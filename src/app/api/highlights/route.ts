import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/supabaseClient'

type Highlight = Database['public']['Tables']['highlights']['Row']
type HighlightInsert = Database['public']['Tables']['highlights']['Insert']
type HighlightUpdate = Database['public']['Tables']['highlights']['Update']

// GET /api/highlights - Get highlights with filters
// Query params: user_id, is_featured, limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const isFeatured = searchParams.get('is_featured')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('highlights')
      .select(`
        *,
        profiles!highlights_user_id_fkey (
          id,
          full_name,
          sport,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: highlights, error } = await query

    if (error) {
      console.error('Error fetching highlights:', error)
      return NextResponse.json(
        { error: 'Failed to fetch highlights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      highlights: highlights || [],
      pagination: {
        limit,
        offset,
        hasMore: highlights ? highlights.length === limit : false
      }
    })

  } catch (error) {
    console.error('Highlights GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/highlights - Create new highlight
export async function POST(request: NextRequest) {
  try {
    const body: HighlightInsert = await request.json()
    
    // Validate required fields
    if (!body.user_id || !body.title || !body.video_url) {
      return NextResponse.json(
        { error: 'user_id, title, and video_url are required' },
        { status: 400 }
      )
    }

    // Verify user exists and is approved
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_parent_approved')
      .eq('id', body.user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!profile.is_parent_approved) {
      return NextResponse.json(
        { error: 'User not approved to create highlights' },
        { status: 403 }
      )
    }

    const highlightData: HighlightInsert = {
      ...body,
      likes_count: 0,
      created_at: new Date().toISOString()
    }

    const { data: highlight, error } = await supabase
      .from('highlights')
      .insert(highlightData)
      .select(`
        *,
        profiles!highlights_user_id_fkey (
          id,
          full_name,
          sport,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating highlight:', error)
      return NextResponse.json(
        { error: 'Failed to create highlight' },
        { status: 500 }
      )
    }

    return NextResponse.json({ highlight }, { status: 201 })

  } catch (error) {
    console.error('Highlight POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/highlights/[id] - Update highlight
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Highlight ID is required' },
        { status: 400 }
      )
    }

    const { data: highlight, error } = await supabase
      .from('highlights')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles!highlights_user_id_fkey (
          id,
          full_name,
          sport,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating highlight:', error)
      return NextResponse.json(
        { error: 'Failed to update highlight' },
        { status: 500 }
      )
    }

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ highlight })

  } catch (error) {
    console.error('Highlight PUT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/highlights/[id] - Delete highlight
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Highlight ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting highlight:', error)
      return NextResponse.json(
        { error: 'Failed to delete highlight' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Highlight deleted successfully' })

  } catch (error) {
    console.error('Highlight DELETE API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}