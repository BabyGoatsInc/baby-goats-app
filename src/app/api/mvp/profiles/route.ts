import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// MVP MODE: Temporary in-memory storage for demonstration
// This simulates database operations for MVP when RLS policies block writes

interface MVPProfile {
  id: string
  full_name: string
  sport: string
  experience_level?: string
  passion_level?: number
  selected_goals?: string[]
  grad_year?: number
  created_at: string
}

interface MVPChallengeCompletion {
  id: string
  user_id: string
  challenge_id: string
  completed_at: string
  notes?: string
}

interface MVPStats {
  id: string
  user_id: string
  stat_name: string
  value: number
  category: string
  created_at: string
}

// In-memory storage (in production, this would be Redis or similar)
const mvpStorage = {
  profiles: [] as MVPProfile[],
  completions: [] as MVPChallengeCompletion[],
  stats: [] as MVPStats[],
  likes: [] as Array<{ user_id: string; highlight_id: string; created_at: string }>
}

// GET /api/mvp/profiles - Get profiles from both DB and MVP storage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get real profiles from database
    let query = supabase.from('profiles').select('*')
    
    if (sport) query = query.eq('sport', sport)
    if (search) query = query.ilike('full_name', `%${search}%`)
    
    const { data: dbProfiles, error } = await query.range(0, limit - 1)

    if (error) {
      console.error('Error fetching profiles from DB:', error)
    }

    // Combine DB profiles with MVP profiles
    let allProfiles = [...(dbProfiles || []), ...mvpStorage.profiles]

    // Apply client-side filtering for MVP profiles
    if (sport) {
      allProfiles = allProfiles.filter(p => 
        p.sport?.toLowerCase() === sport.toLowerCase()
      )
    }
    if (search) {
      allProfiles = allProfiles.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Limit results
    allProfiles = allProfiles.slice(0, limit)

    return NextResponse.json({
      profiles: allProfiles,
      mvpMode: true,
      source: {
        database: dbProfiles?.length || 0,
        mvpStorage: mvpStorage.profiles.length
      },
      pagination: {
        limit,
        hasMore: false // Simplified for MVP
      }
    })

  } catch (error) {
    console.error('MVP Profiles API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', mvpMode: true },
      { status: 500 }
    )
  }
}

// POST /api/mvp/profiles - Create profile in MVP storage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.id || !body.full_name) {
      return NextResponse.json(
        { error: 'User ID and full name are required' },
        { status: 400 }
      )
    }

    // Create profile object for MVP storage
    const mvpProfile: MVPProfile = {
      id: body.id,
      full_name: body.full_name,
      sport: body.sport || 'unknown',
      experience_level: body.experience_level,
      passion_level: body.passion_level,
      selected_goals: body.selected_goals,
      grad_year: body.grad_year,
      created_at: new Date().toISOString()
    }

    // Check if profile exists in MVP storage
    const existingIndex = mvpStorage.profiles.findIndex(p => p.id === body.id)
    
    if (existingIndex >= 0) {
      // Update existing profile
      mvpStorage.profiles[existingIndex] = { ...mvpStorage.profiles[existingIndex], ...mvpProfile }
      console.log('✅ MVP Profile updated:', mvpProfile.full_name)
    } else {
      // Add new profile
      mvpStorage.profiles.push(mvpProfile)
      console.log('✅ MVP Profile created:', mvpProfile.full_name)
    }

    return NextResponse.json({
      success: true,
      profile: mvpProfile,
      mvpMode: true,
      message: 'Profile saved in MVP mode'
    })

  } catch (error) {
    console.error('MVP Profile creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create profile in MVP mode' },
      { status: 500 }
    )
  }
}

// PUT /api/mvp/profiles - Update profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'User ID is required for update' },
        { status: 400 }
      )
    }

    // Find and update profile
    const existingIndex = mvpStorage.profiles.findIndex(p => p.id === body.id)
    
    if (existingIndex >= 0) {
      mvpStorage.profiles[existingIndex] = { 
        ...mvpStorage.profiles[existingIndex], 
        ...body,
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        profile: mvpStorage.profiles[existingIndex],
        mvpMode: true,
        message: 'Profile updated in MVP mode'
      })
    } else {
      return NextResponse.json(
        { error: 'Profile not found in MVP storage' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('MVP Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile in MVP mode' },
      { status: 500 }
    )
  }
}