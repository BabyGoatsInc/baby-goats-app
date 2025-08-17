import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Teams API - Team Management System
 * Handles team creation, membership, and management
 */

// GET /api/teams - Get teams list or specific team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const userId = searchParams.get('user_id');
    const sport = searchParams.get('sport');
    const teamType = searchParams.get('team_type');
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (teamId) {
      // Get specific team with detailed information
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url, sport),
          members:team_members!team_members_team_id_fkey(
            id,
            role,
            joined_at,
            status,
            contribution_score,
            user:profiles!team_members_user_id_fkey(id, full_name, avatar_url, sport, grad_year)
          ),
          statistics:team_statistics!team_statistics_team_id_fkey(*)
        `)
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // Get recent team challenges
      const { data: recentChallenges } = await supabase
        .from('team_challenge_participations')
        .select(`
          *,
          challenge:team_challenges!team_challenge_participations_team_challenge_id_fkey(
            id,
            title,
            description,
            challenge_type,
            sport,
            target_metric,
            target_value,
            team_points_reward,
            start_date,
            end_date
          )
        `)
        .eq('team_id', teamId)
        .order('registered_at', { ascending: false })
        .limit(5);

      return NextResponse.json({
        success: true,
        team: {
          ...team,
          recent_challenges: recentChallenges || []
        }
      });
    }

    if (userId) {
      // Get teams for a specific user
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          joined_at,
          status,
          contribution_score,
          team:teams!team_members_team_id_fkey(
            id,
            name,
            description,
            sport,
            team_type,
            team_image_url,
            team_color,
            region,
            school_name,
            founded_date,
            captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url),
            statistics:team_statistics!team_statistics_team_id_fkey(total_members, total_points)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (userTeamsError) {
        console.error('Error fetching user teams:', userTeamsError);
        return NextResponse.json({ error: 'Failed to fetch user teams' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        teams: userTeams || [],
        count: userTeams?.length || 0
      });
    }

    // Get public teams list with filters
    let query = supabase
      .from('teams')
      .select(`
        *,
        captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url),
        statistics:team_statistics!team_statistics_team_id_fkey(total_members, active_members, total_points)
      `)
      .eq('is_public', true);

    if (sport) {
      query = query.eq('sport', sport);
    }

    if (teamType) {
      query = query.eq('team_type', teamType);
    }

    if (region) {
      query = query.eq('region', region);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,school_name.ilike.%${search}%`);
    }

    const { data: teams, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
      .offset(offset);

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teams: teams || [],
      count: teams?.length || 0
    });

  } catch (error) {
    console.error('Teams GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      sport, 
      team_type = 'recreational',
      captain_id,
      max_members = 10,
      is_public = true,
      region,
      school_name,
      team_color = '#EC1616'
    } = body;

    if (!name || !captain_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, captain_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Generate unique invite code
    const generateInviteCode = () => {
      return name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) + 
             Math.random().toString(36).substring(2, 6).toUpperCase();
    };

    let inviteCode = generateInviteCode();
    let attempts = 0;

    // Ensure invite code is unique
    while (attempts < 5) {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (!existingTeam) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        sport,
        team_type,
        captain_id,
        max_members,
        is_public,
        invite_code: inviteCode,
        team_color,
        region,
        school_name
      })
      .select(`
        *,
        captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add captain as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: captain_id,
        role: 'captain',
        status: 'active'
      });

    if (memberError) {
      console.error('Error adding captain to team:', memberError);
      // Clean up - delete team if member creation failed
      await supabase.from('teams').delete().eq('id', team.id);
      return NextResponse.json({ error: 'Failed to create team membership' }, { status: 500 });
    }

    // Initialize team statistics
    await supabase
      .from('team_statistics')
      .insert({
        team_id: team.id,
        total_members: 1,
        active_members: 1
      });

    // Award points for team creation
    await supabase.rpc('award_points', {
      p_user_id: captain_id,
      p_points: 25,
      p_category: 'social'
    });

    return NextResponse.json({
      success: true,
      team,
      message: 'Team created successfully',
      invite_code: inviteCode
    });

  } catch (error) {
    console.error('Teams POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/teams - Update team information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      team_id, 
      user_id, 
      name, 
      description, 
      team_color,
      max_members,
      is_public,
      region,
      school_name
    } = body;

    if (!team_id || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: team_id, user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Verify user is team captain or co-captain
    const { data: memberCheck, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (memberError || !memberCheck || !['captain', 'co_captain'].includes(memberCheck.role)) {
      return NextResponse.json({ 
        error: 'Only team captains can update team information' 
      }, { status: 403 });
    }

    // Update team
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (team_color) updateData.team_color = team_color;
    if (max_members) updateData.max_members = max_members;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (region) updateData.region = region;
    if (school_name) updateData.school_name = school_name;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', team_id)
      .select(`
        *,
        captain:profiles!teams_captain_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error('Error updating team:', updateError);
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      team: updatedTeam,
      message: 'Team updated successfully'
    });

  } catch (error) {
    console.error('Teams PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams - Delete team (captain only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const userId = searchParams.get('user_id');

    if (!teamId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: team_id, user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Verify user is team captain
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id, name')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.captain_id !== userId) {
      return NextResponse.json({ 
        error: 'Only the team captain can delete the team' 
      }, { status: 403 });
    }

    // Delete team (cascade will handle members, challenges, etc.)
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      console.error('Error deleting team:', deleteError);
      return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Team "${team.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Teams DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}