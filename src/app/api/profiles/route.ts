import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

// Create an admin client for MVP development
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Use service role key for admin operations - in production this should be from env vars
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key for now
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// GET /api/profiles - Search/filter profiles
// Query params: sport, grad_year, search (name), limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const gradYear = searchParams.get('grad_year')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('profiles')
      .select('*')
      // Note: is_parent_approved column may not exist yet, so we'll show all profiles for now

    // Apply filters
    if (sport) {
      query = query.eq('sport', sport)
    }
    
    if (gradYear) {
      query = query.eq('grad_year', parseInt(gradYear))
    }

    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profiles: profiles || [],
      pagination: {
        limit,
        offset,
        hasMore: profiles ? profiles.length === limit : false
      }
    })

  } catch (error) {
    console.error('Profiles API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/profiles - Create/update profile
export async function POST(request: NextRequest) {
  try {
    const body: ProfileUpdate = await request.json()
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.id)
      .single()

    let result
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new profile
      const profileData: ProfileInsert = {
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({ profile: result })

  } catch (error) {
    console.error('Profile POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/profiles/[id] - Get single profile by ID
export async function GET_PROFILE_BY_ID(id: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        highlights (
          id,
          title,
          video_url,
          description,
          likes_count,
          is_featured,
          created_at
        ),
        stats (
          id,
          stat_name,
          value,
          unit,
          category,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.is_parent_approved) {
      return NextResponse.json(
        { error: 'Profile not available' },
        { status: 403 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile GET_BY_ID API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}