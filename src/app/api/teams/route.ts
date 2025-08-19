import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (teamId) {
      // Get specific team
      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      return NextResponse.json({ team });
    }

    // Get all teams
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    return NextResponse.json({ 
      teams: teams || [],
      total: teams?.length || 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      team_color = '#EC1616',
      region,
      school_name
    } = body;

    if (!name || !sport || !captain_id) {
      return NextResponse.json({ 
        error: 'Team name, sport, and captain ID are required' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Generate invite code
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create team
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        name,
        description,
        sport,
        team_type,
        captain_id,
        max_members,
        is_public,
        invite_code,
        team_color,
        region,
        school_name
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add captain as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeam.id,
        user_id: captain_id,
        role: 'captain',
        status: 'active'
      });

    if (memberError) {
      console.error('Error adding captain to team:', memberError);
    }

    return NextResponse.json({ 
      message: 'Team created successfully',
      team: newTeam
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      team_id,
      captain_id, // User making the request
      name,
      description,
      team_type,
      max_members,
      is_public,
      team_color,
      region,
      school_name
    } = body;

    if (!team_id || !captain_id) {
      return NextResponse.json({ 
        error: 'Team ID and captain ID are required' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.captain_id !== captain_id) {
      return NextResponse.json({ error: 'Only team captain can update team' }, { status: 403 });
    }

    // Update team
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (team_type) updateData.team_type = team_type;
    if (max_members) updateData.max_members = max_members;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (team_color) updateData.team_color = team_color;
    if (region !== undefined) updateData.region = region;
    if (school_name !== undefined) updateData.school_name = school_name;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', team_id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Team updated successfully',
      team: updatedTeam
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const captainId = searchParams.get('captain_id');

    if (!teamId || !captainId) {
      return NextResponse.json({ 
        error: 'Team ID and captain ID are required' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Verify user is captain of the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('captain_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.captain_id !== captainId) {
      return NextResponse.json({ error: 'Only team captain can delete team' }, { status: 403 });
    }

    // Delete team (cascade will handle team_members)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}