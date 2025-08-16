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

type Stat = Database['public']['Tables']['stats']['Row']
type StatInsert = Database['public']['Tables']['stats']['Insert']
type StatUpdate = Database['public']['Tables']['stats']['Update']

// GET /api/stats - Get stats with filters
// Query params: user_id, category, stat_name, limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const category = searchParams.get('category')
    const statName = searchParams.get('stat_name')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('stats')
      .select(`
        *,
        profiles!stats_user_id_fkey (
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
    
    if (category) {
      query = query.eq('category', category)
    }

    if (statName) {
      query = query.eq('stat_name', statName)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: stats, error } = await query

    if (error) {
      console.error('Error fetching stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      stats: stats || [],
      pagination: {
        limit,
        offset,
        hasMore: stats ? stats.length === limit : false
      }
    })

  } catch (error) {
    console.error('Stats GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/stats - Create/update stat
export async function POST(request: NextRequest) {
  try {
    const body: StatInsert = await request.json()
    
    // Validate required fields
    if (!body.user_id || !body.stat_name || body.value === undefined || !body.category) {
      return NextResponse.json(
        { error: 'user_id, stat_name, value, and category are required' },
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

    // Check if stat already exists for this user/category/name combination
    const { data: existingStat } = await supabase
      .from('stats')
      .select('id, value')
      .eq('user_id', body.user_id)
      .eq('stat_name', body.stat_name)
      .eq('category', body.category)
      .single()

    let result
    
    if (existingStat) {
      // Update existing stat using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('stats')
        .update({
          value: body.value,
          unit: body.unit
        })
        .eq('id', existingStat.id)
        .select(`
          *,
          profiles!stats_user_id_fkey (
            id,
            full_name,
            sport,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error updating stat:', error)
        return NextResponse.json(
          { error: 'Failed to update stat', details: error.message },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new stat using service role (bypasses RLS)
      const statData: StatInsert = {
        ...body,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('stats')
        .insert(statData)
        .select(`
          *,
          profiles!stats_user_id_fkey (
            id,
            full_name,
            sport,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error creating stat:', error)
        return NextResponse.json(
          { error: 'Failed to create stat', details: error.message },
          { status: 500 }
        )
      }
      result = data
    }

    console.log('✅ Stat operation successful:', result.stat_name)
    return NextResponse.json({ 
      stat: result,
      message: 'Stat saved successfully',
      productionMode: true 
    })

  } catch (error) {
    console.error('Stat POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}