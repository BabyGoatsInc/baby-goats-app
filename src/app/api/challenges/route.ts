import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/supabaseClient'

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
        { error: 'User not approved to complete challenges' },
        { status: 403 }
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

    // Create completion record
    const completionData: ChallengeCompletionInsert = {
      user_id: body.user_id,
      challenge_id: body.challenge_id,
      notes: body.notes || null,
      completed_at: new Date().toISOString()
    }

    const { data: completion, error } = await supabase
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
        { error: 'Failed to complete challenge' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      completion,
      message: 'Challenge completed successfully!',
      points_earned: challenge.points
    }, { status: 201 })

  } catch (error) {
    console.error('Challenge completion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/challenges/user-stats - Get user challenge statistics
export async function GET_USER_STATS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Get completion stats by category
    const { data: completions, error } = await supabase
      .from('challenge_completions')
      .select(`
        *,
        challenges!challenge_completions_challenge_id_fkey (
          category,
          points,
          difficulty
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user challenge stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch challenge statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      total_completed: completions?.length || 0,
      total_points: completions?.reduce((sum, c) => sum + (c.challenges?.points || 0), 0) || 0,
      categories: {} as Record<string, {
        completed: number,
        points: number,
        streak: number
      }>,
      streak: 0,
      recent_completions: completions?.slice(-5) || []
    }

    // Calculate category stats
    completions?.forEach(completion => {
      const category = completion.challenges?.category || 'Unknown'
      if (!stats.categories[category]) {
        stats.categories[category] = {
          completed: 0,
          points: 0,
          streak: 0
        }
      }
      
      stats.categories[category].completed += 1
      stats.categories[category].points += completion.challenges?.points || 0
    })

    // Calculate current streak (simplified - consecutive days with completions)
    if (completions && completions.length > 0) {
      const sortedCompletions = completions
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      let streakDays = 0
      let currentDate = today
      
      for (const completion of sortedCompletions) {
        const completionDate = new Date(completion.completed_at)
        const completionDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate())
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        
        if (completionDay.getTime() === currentDay.getTime()) {
          streakDays++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      }
      
      stats.streak = streakDays
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Challenge user stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}