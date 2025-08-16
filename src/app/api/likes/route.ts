import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for write operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type Like = Database['public']['Tables']['likes']['Row']
type LikeInsert = Database['public']['Tables']['likes']['Insert']

// POST /api/likes - Toggle like on a highlight
export async function POST(request: NextRequest) {
  try {
    const body: { user_id: string; highlight_id: string } = await request.json()
    
    // Validate required fields
    if (!body.user_id || !body.highlight_id) {
      return NextResponse.json(
        { error: 'user_id and highlight_id are required' },
        { status: 400 }
      )
    }

    // Verify user exists (simplified - no parent approval check for now)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify highlight exists
    const { data: highlight } = await supabase
      .from('highlights')
      .select('id, likes_count')
      .eq('id', body.highlight_id)
      .single()

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', body.user_id)
      .eq('highlight_id', body.highlight_id)
      .single()

    if (existingLike) {
      // Unlike: Remove the like using service role (bypasses RLS)
      const { error: deleteError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('user_id', body.user_id)
        .eq('highlight_id', body.highlight_id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove like', details: deleteError.message },
          { status: 500 }
        )
      }

      console.log('✅ Like removed successfully for highlight:', body.highlight_id)
      return NextResponse.json({ 
        liked: false,
        message: 'Like removed',
        productionMode: true
      })
    } else {
      // Like: Add the like using service role (bypasses RLS)
      const likeData: LikeInsert = {
        user_id: body.user_id,
        highlight_id: body.highlight_id,
        created_at: new Date().toISOString()
      }

      const { data: newLike, error: insertError } = await supabaseAdmin
        .from('likes')
        .insert(likeData)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating like:', insertError)
        return NextResponse.json(
          { error: 'Failed to create like', details: insertError.message },
          { status: 500 }
        )
      }

      console.log('✅ Like added successfully for highlight:', body.highlight_id)
      return NextResponse.json({ 
        liked: true,
        like: newLike,
        message: 'Like added',
        productionMode: true
      })
    }

  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/likes - Get likes for a highlight or user
// Query params: highlight_id OR user_id, limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const highlightId = searchParams.get('highlight_id')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!highlightId && !userId) {
      return NextResponse.json(
        { error: 'Either highlight_id or user_id is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('likes')
      .select(`
        *,
        profiles!likes_user_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        highlights!likes_highlight_id_fkey (
          id,
          title,
          video_url
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (highlightId) {
      query = query.eq('highlight_id', highlightId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: likes, error } = await query

    if (error) {
      console.error('Error fetching likes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      likes: likes || [],
      pagination: {
        limit,
        offset,
        hasMore: likes ? likes.length === limit : false
      }
    })

  } catch (error) {
    console.error('Likes GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}