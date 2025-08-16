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

type Challenge = Database['public']['Tables']['challenges']['Row']
type ChallengeCompletion = Database['public']['Tables']['challenge_completions']['Row']
type ChallengeCompletionInsert = Database['public']['Tables']['challenge_completions']['Insert']

// GET /api/challenges - Get challenges with optional filters
// Query params: category, difficulty, is_active, user_id (to show completion status), limit, offset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const isActive = searchParams.get('is_active')
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    } else {
      // Default to active challenges only
      query = query.eq('is_active', true)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: challenges, error } = await query

    if (error) {
      console.error('Error fetching challenges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 }
      )
    }

    // If user_id is provided, fetch completion status for each challenge
    let challengesWithCompletion = challenges || []
    
    if (userId && challenges) {
      const challengeIds = challenges.map(c => c.id)
      
      const { data: completions } = await supabase
        .from('challenge_completions')
        .select('challenge_id, completed_at, notes')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds)

      const completionMap = new Map(
        completions?.map(c => [c.challenge_id, c]) || []
      )

      challengesWithCompletion = challenges.map(challenge => ({
        ...challenge,
        completed: completionMap.has(challenge.id),
        completion: completionMap.get(challenge.id) || null
      }))
    }

    return NextResponse.json({
      challenges: challengesWithCompletion,
      pagination: {
        limit,
        offset,
        hasMore: challenges ? challenges.length === limit : false
      }
    })

  } catch (error) {
    console.error('Challenges GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/challenges/complete - Mark challenge as completed
export async function POST(request: NextRequest) {
  try {
    const body: { user_id: string; challenge_id: string; notes?: string } = await request.json()
    
    // Validate required fields
    if (!body.user_id || !body.challenge_id) {
      return NextResponse.json(
        { error: 'user_id and challenge_id are required' },
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

    // Verify challenge exists and is active
    const { data: challenge } = await supabase
      .from('challenges')
      .select('id, is_active, title, points')
      .eq('id', body.challenge_id)
      .single()

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (!challenge.is_active) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      )
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('challenge_completions')
      .select('id')
      .eq('user_id', body.user_id)
      .eq('challenge_id', body.challenge_id)
      .single()

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'Challenge already completed' },
        { status: 409 }
      )
    }

    // Create completion record using service role (bypasses RLS)
    const { data: completion, error } = await supabaseAdmin
      .from('challenge_completions')
      .insert(completionData)
      .select(`
        *,
        challenges!challenge_completions_challenge_id_fkey (
          id,
          title,
          description,
          category,
          difficulty,
          points
        )
      `)
      .single()

    if (error) {
      console.error('Error creating challenge completion:', error)
      return NextResponse.json(
        { error: 'Failed to complete challenge', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Challenge completed successfully:', challenge.title)
    return NextResponse.json({ 
      completion,
      message: 'Challenge completed successfully!',
      points_earned: challenge.points,
      productionMode: true
    }, { status: 201 })

  } catch (error) {
    console.error('Challenge completion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}