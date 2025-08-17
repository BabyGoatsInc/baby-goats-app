import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Leaderboards API - Rankings & Competition System
 * Handles leaderboard data and user rankings
 */

// GET /api/leaderboards - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaderboardId = searchParams.get('id');
    const type = searchParams.get('type'); // points, achievements, challenges, streaks
    const scope = searchParams.get('scope'); // global, sport, region
    const sport = searchParams.get('sport');
    const timePeriod = searchParams.get('time_period'); // daily, weekly, monthly, all_time
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('user_id'); // Get user's position

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (leaderboardId) {
      // Get specific leaderboard with entries
      const { data: leaderboard, error: boardError } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('id', leaderboardId)
        .eq('is_active', true)
        .single();

      if (boardError || !leaderboard) {
        return NextResponse.json({ error: 'Leaderboard not found' }, { status: 404 });
      }

      // Get leaderboard entries
      const { data: entries, error: entriesError } = await supabase
        .from('leaderboard_entries')
        .select(`
          id,
          rank,
          score,
          previous_rank,
          rank_change,
          created_at,
          updated_at,
          user:profiles!leaderboard_entries_user_id_fkey(
            id,
            full_name,
            avatar_url,
            sport,
            grad_year
          )
        `)
        .eq('leaderboard_id', leaderboardId)
        .order('rank', { ascending: true })
        .limit(limit);

      if (entriesError) {
        console.error('Error fetching leaderboard entries:', entriesError);
        return NextResponse.json({ error: 'Failed to fetch leaderboard entries' }, { status: 500 });
      }

      let userPosition = null;
      if (userId) {
        const { data: userEntry } = await supabase
          .from('leaderboard_entries')
          .select('rank, score, rank_change')
          .eq('leaderboard_id', leaderboardId)
          .eq('user_id', userId)
          .single();

        userPosition = userEntry;
      }

      return NextResponse.json({
        success: true,
        leaderboard: {
          ...leaderboard,
          entries: entries || []
        },
        userPosition,
        totalEntries: entries?.length || 0
      });
    }

    // Get list of leaderboards or filtered leaderboards
    let query = supabase
      .from('leaderboards')
      .select('*')
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    if (scope) {
      query = query.eq('scope', scope);
    }

    if (sport) {
      query = query.eq('sport_filter', sport);
    }

    if (timePeriod) {
      query = query.eq('time_period', timePeriod);
    }

    const { data: leaderboards, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leaderboards:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboards' }, { status: 500 });
    }

    // Get top entries for each leaderboard (top 3)
    const leaderboardsWithEntries = await Promise.all(
      (leaderboards || []).map(async (board) => {
        const { data: topEntries } = await supabase
          .from('leaderboard_entries')
          .select(`
            rank,
            score,
            rank_change,
            user:profiles!leaderboard_entries_user_id_fkey(
              id,
              full_name,
              avatar_url,
              sport
            )
          `)
          .eq('leaderboard_id', board.id)
          .order('rank', { ascending: true })
          .limit(3);

        return {
          ...board,
          topEntries: topEntries || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      leaderboards: leaderboardsWithEntries,
      count: leaderboardsWithEntries.length
    });

  } catch (error) {
    console.error('Leaderboards GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/leaderboards - Update user score (internal system use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, points, category } = body;

    if (!user_id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, action' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Award points based on action
    let pointsToAward = 0;
    let pointCategory = 'general';

    switch (action) {
      case 'challenge_complete':
        pointsToAward = points || 15;
        pointCategory = 'challenge';
        break;
      case 'achievement_unlock':
        pointsToAward = points || 25;
        pointCategory = 'achievement';
        break;
      case 'streak_milestone':
        pointsToAward = points || 10;
        pointCategory = 'streak';
        break;
      case 'friend_added':
        pointsToAward = points || 5;
        pointCategory = 'social';
        break;
      default:
        pointsToAward = points || 1;
    }

    // Use the award_points database function
    const { error: awardError } = await supabase
      .rpc('award_points', {
        p_user_id: user_id,
        p_points: pointsToAward,
        p_category: pointCategory
      });

    if (awardError) {
      console.error('Error awarding points:', awardError);
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }

    // Get updated user points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
    }

    // Create activity feed item
    await supabase
      .from('activity_feed')
      .insert({
        user_id,
        type: action === 'challenge_complete' ? 'challenge_complete' : 'achievement',
        title: `${pointsToAward} Points Earned!`,
        description: `Earned ${pointsToAward} points for ${action.replace('_', ' ')}`,
        data: {
          points: pointsToAward,
          category: pointCategory,
          action
        }
      });

    return NextResponse.json({
      success: true,
      pointsAwarded: pointsToAward,
      category: pointCategory,
      userPoints: userPoints || null,
      action
    });

  } catch (error) {
    console.error('Leaderboards POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/leaderboards - Trigger leaderboard recalculation (admin)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Trigger leaderboard rankings update
    const { error } = await supabase.rpc('update_leaderboard_rankings');

    if (error) {
      console.error('Error updating leaderboard rankings:', error);
      return NextResponse.json({ error: 'Failed to update leaderboard rankings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard rankings updated successfully'
    });

  } catch (error) {
    console.error('Leaderboards PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}