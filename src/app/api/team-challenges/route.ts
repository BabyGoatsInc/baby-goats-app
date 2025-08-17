import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Team Challenges API - Group Challenges & Team Competitions
 * Handles team-based challenges, participations, and progress tracking
 */

// GET /api/team-challenges - Get team challenges list or specific challenge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challenge_id');
    const teamId = searchParams.get('team_id');
    const userId = searchParams.get('user_id');
    const sport = searchParams.get('sport');
    const challengeType = searchParams.get('challenge_type');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (challengeId) {
      // Get specific team challenge with participations
      const { data: challenge, error: challengeError } = await supabase
        .from('team_challenges')
        .select(`
          *,
          creator:profiles!team_challenges_created_by_fkey(id, full_name, avatar_url),
          participations:team_challenge_participations!team_challenge_participations_team_challenge_id_fkey(
            id,
            current_progress,
            completion_percentage,
            status,
            registered_at,
            completed_at,
            final_score,
            team_rank,
            points_earned,
            team:teams!team_challenge_participations_team_id_fkey(
              id,
              name,
              team_color,
              sport,
              captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url)
            )
          )
        `)
        .eq('id', challengeId)
        .single();

      if (challengeError || !challenge) {
        return NextResponse.json({ error: 'Team challenge not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        challenge
      });
    }

    if (teamId) {
      // Get challenges for a specific team
      const { data: participations, error: participationsError } = await supabase
        .from('team_challenge_participations')
        .select(`
          *,
          challenge:team_challenges!team_challenge_participations_team_challenge_id_fkey(
            id,
            title,
            description,
            challenge_type,
            sport,
            difficulty_level,
            target_metric,
            target_value,
            team_points_reward,
            individual_points_reward,
            start_date,
            end_date,
            is_active
          )
        `)
        .eq('team_id', teamId)
        .order('registered_at', { ascending: false })
        .limit(limit);

      if (participationsError) {
        console.error('Error fetching team participations:', participationsError);
        return NextResponse.json({ error: 'Failed to fetch team challenges' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        participations: participations || [],
        count: participations?.length || 0
      });
    }

    // Get available team challenges with filters
    let query = supabase
      .from('team_challenges')
      .select(`
        *,
        creator:profiles!team_challenges_created_by_fkey(id, full_name, avatar_url),
        participations_count:team_challenge_participations(count)
      `);

    if (status === 'active') {
      query = query.eq('is_active', true);
    }

    if (sport && sport !== 'all') {
      query = query.or(`sport.eq.${sport},sport.eq.general`);
    }

    if (challengeType) {
      query = query.eq('challenge_type', challengeType);
    }

    // Filter by date if active
    if (status === 'active') {
      const now = new Date().toISOString();
      query = query.or(`start_date.is.null,start_date.lte.${now}`)
                   .or(`end_date.is.null,end_date.gte.${now}`);
    }

    const { data: challenges, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching team challenges:', error);
      return NextResponse.json({ error: 'Failed to fetch team challenges' }, { status: 500 });
    }

    // If user_id provided, include user's team participation status
    if (userId && challenges) {
      // Get user's teams
      const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const teamIds = userTeams?.map(tm => tm.team_id) || [];

      // For each challenge, check if any of user's teams are participating
      for (const challenge of challenges) {
        const { data: userParticipations } = await supabase
          .from('team_challenge_participations')
          .select('id, status, team_id')
          .eq('team_challenge_id', challenge.id)
          .in('team_id', teamIds);

        challenge.user_team_participations = userParticipations || [];
      }
    }

    return NextResponse.json({
      success: true,
      challenges: challenges || [],
      count: challenges?.length || 0
    });

  } catch (error) {
    console.error('Team Challenges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/team-challenges - Create team challenge or register team for challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'create', ...challengeData } = body;

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (action === 'register') {
      // Register team for existing challenge
      const { team_challenge_id, team_id, user_id } = challengeData;

      if (!team_challenge_id || !team_id || !user_id) {
        return NextResponse.json({ 
          error: 'Missing required fields: team_challenge_id, team_id, user_id' 
        }, { status: 400 });
      }

      // Verify user is team captain or co-captain
      const { data: membership, error: memberError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team_id)
        .eq('user_id', user_id)
        .eq('status', 'active')
        .single();

      if (memberError || !membership || !['captain', 'co_captain'].includes(membership.role)) {
        return NextResponse.json({ 
          error: 'Only team captains or co-captains can register for challenges' 
        }, { status: 403 });
      }

      // Get challenge details
      const { data: challenge, error: challengeError } = await supabase
        .from('team_challenges')
        .select('*')
        .eq('id', team_challenge_id)
        .eq('is_active', true)
        .single();

      if (challengeError || !challenge) {
        return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 });
      }

      // Check if team is already registered
      const { data: existingParticipation } = await supabase
        .from('team_challenge_participations')
        .select('id, status')
        .eq('team_challenge_id', team_challenge_id)
        .eq('team_id', team_id)
        .single();

      if (existingParticipation) {
        return NextResponse.json({ 
          error: 'Team is already registered for this challenge' 
        }, { status: 400 });
      }

      // Check team size requirements
      const { count: teamSize } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .eq('team_id', team_id)
        .eq('status', 'active');

      if (teamSize < challenge.min_team_size || teamSize > challenge.max_team_size) {
        return NextResponse.json({ 
          error: `Team size must be between ${challenge.min_team_size} and ${challenge.max_team_size} members` 
        }, { status: 400 });
      }

      // Register team for challenge
      const { data: participation, error: participationError } = await supabase
        .from('team_challenge_participations')
        .insert({
          team_challenge_id,
          team_id,
          status: 'registered'
        })
        .select(`
          *,
          challenge:team_challenges!team_challenge_participations_team_challenge_id_fkey(title, description),
          team:teams!team_challenge_participations_team_id_fkey(name)
        `)
        .single();

      if (participationError) {
        console.error('Error registering team for challenge:', participationError);
        return NextResponse.json({ error: 'Failed to register team for challenge' }, { status: 500 });
      }

      // Notify team members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', team_id)
        .eq('status', 'active');

      if (teamMembers) {
        const notifications = teamMembers.map(member => ({
          user_id: member.user_id,
          type: 'team_challenge_registered',
          title: 'New Team Challenge!',
          message: `Your team "${participation.team.name}" registered for "${participation.challenge.title}"`,
          data: {
            team_id,
            team_challenge_id,
            participation_id: participation.id
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      return NextResponse.json({
        success: true,
        participation,
        message: 'Team successfully registered for challenge'
      });
    }

    // Create new team challenge
    const { 
      title, 
      description, 
      challenge_type, 
      sport = 'general',
      difficulty_level = 'intermediate',
      min_team_size = 2,
      max_team_size = 10,
      target_metric,
      target_value,
      team_points_reward = 50,
      individual_points_reward = 15,
      duration_days = 7,
      created_by
    } = challengeData;

    if (!title || !description || !challenge_type || !target_metric || !target_value || !created_by) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, challenge_type, target_metric, target_value, created_by' 
      }, { status: 400 });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration_days);

    // Create team challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('team_challenges')
      .insert({
        title: title.trim(),
        description: description.trim(),
        challenge_type,
        sport,
        difficulty_level,
        min_team_size,
        max_team_size,
        target_metric,
        target_value: parseFloat(target_value),
        team_points_reward,
        individual_points_reward,
        duration_days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_by
      })
      .select(`
        *,
        creator:profiles!team_challenges_created_by_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (challengeError) {
      console.error('Error creating team challenge:', challengeError);
      return NextResponse.json({ error: 'Failed to create team challenge' }, { status: 500 });
    }

    // Award points for creating challenge
    await supabase.rpc('award_points', {
      p_user_id: created_by,
      p_points: 20,
      p_category: 'social'
    });

    return NextResponse.json({
      success: true,
      challenge,
      message: 'Team challenge created successfully'
    });

  } catch (error) {
    console.error('Team Challenges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/team-challenges - Update team challenge progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      participation_id, 
      user_id, 
      contribution_value, 
      contribution_type,
      action = 'update_progress'
    } = body;

    if (!participation_id || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: participation_id, user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Get participation details
    const { data: participation, error: participationError } = await supabase
      .from('team_challenge_participations')
      .select(`
        *,
        challenge:team_challenges!team_challenge_participations_team_challenge_id_fkey(*),
        team:teams!team_challenge_participations_team_id_fkey(*)
      `)
      .eq('id', participation_id)
      .single();

    if (participationError || !participation) {
      return NextResponse.json({ error: 'Team challenge participation not found' }, { status: 404 });
    }

    // Verify user is team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', participation.team_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ 
        error: 'User is not a member of this team' 
      }, { status: 403 });
    }

    if (action === 'update_progress' && contribution_value !== undefined) {
      // Add individual contribution
      const { error: contributionError } = await supabase
        .from('team_challenge_contributions')
        .insert({
          participation_id,
          user_id,
          contribution_value: parseFloat(contribution_value),
          contribution_type: contribution_type || participation.challenge.target_metric,
          verified: true // Auto-verify for now
        });

      if (contributionError) {
        console.error('Error adding contribution:', contributionError);
        return NextResponse.json({ error: 'Failed to add contribution' }, { status: 500 });
      }

      // Recalculate team progress
      const { data: contributions } = await supabase
        .from('team_challenge_contributions')
        .select('contribution_value')
        .eq('participation_id', participation_id)
        .eq('verified', true);

      let newProgress = 0;
      if (contributions && contributions.length > 0) {
        switch (participation.challenge.challenge_type) {
          case 'cumulative':
            // Sum all contributions
            newProgress = contributions.reduce((sum, c) => sum + c.contribution_value, 0);
            break;
          case 'collaborative':
            // Average of all contributions
            newProgress = contributions.reduce((sum, c) => sum + c.contribution_value, 0) / contributions.length;
            break;
          case 'competitive':
            // Best individual contribution
            newProgress = Math.max(...contributions.map(c => c.contribution_value));
            break;
          default:
            newProgress = contributions.reduce((sum, c) => sum + c.contribution_value, 0);
        }
      }

      // Update participation progress
      const { error: updateError } = await supabase
        .from('team_challenge_participations')
        .update({
          current_progress: newProgress,
          status: newProgress >= participation.challenge.target_value ? 'completed' : 'active',
          completed_at: newProgress >= participation.challenge.target_value ? new Date().toISOString() : null
        })
        .eq('id', participation_id);

      if (updateError) {
        console.error('Error updating participation progress:', updateError);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
      }

      // Recalculate progress percentage
      await supabase.rpc('calculate_team_challenge_progress', {
        p_participation_id: participation_id
      });

      // Award points if challenge completed
      if (newProgress >= participation.challenge.target_value && participation.status !== 'completed') {
        // Award team points to all active members
        const { data: activeMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', participation.team_id)
          .eq('status', 'active');

        if (activeMembers) {
          for (const member of activeMembers) {
            await supabase.rpc('award_points', {
              p_user_id: member.user_id,
              p_points: participation.challenge.individual_points_reward,
              p_category: 'challenge'
            });
          }

          // Create completion notifications
          const notifications = activeMembers.map(member => ({
            user_id: member.user_id,
            type: 'team_challenge_completed',
            title: 'Team Challenge Completed! 🎉',
            message: `Your team completed "${participation.challenge.title}" and earned ${participation.challenge.individual_points_reward} points!`,
            data: {
              team_id: participation.team_id,
              team_challenge_id: participation.team_challenge_id,
              points_earned: participation.challenge.individual_points_reward
            }
          }));

          await supabase.from('notifications').insert(notifications);
        }
      }

      return NextResponse.json({
        success: true,
        current_progress: newProgress,
        target_value: participation.challenge.target_value,
        completion_percentage: Math.min((newProgress / participation.challenge.target_value) * 100, 100),
        completed: newProgress >= participation.challenge.target_value,
        message: 'Progress updated successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Team Challenges PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}