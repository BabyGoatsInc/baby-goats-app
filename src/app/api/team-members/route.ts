import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Team Members API - Team Membership Management
 * Handles team invitations, joining, leaving, and role management
 */

// GET /api/team-members - Get team members or user's teams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (teamId) {
      // Get members for a specific team
      let query = supabase
        .from('team_members')
        .select(`
          id,
          role,
          joined_at,
          status,
          contribution_score,
          invited_by,
          user:profiles!team_members_user_id_fkey(
            id,
            full_name,
            avatar_url,
            sport,
            grad_year,
            bio
          ),
          inviter:profiles!team_members_invited_by_fkey(
            id,
            full_name
          )
        `)
        .eq('team_id', teamId);

      if (status) {
        query = query.eq('status', status);
      }

      if (role) {
        query = query.eq('role', role);
      }

      const { data: members, error } = await query.order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
      }

      // Get team info for context
      const { data: team } = await supabase
        .from('teams')
        .select('name, max_members, captain_id')
        .eq('id', teamId)
        .single();

      return NextResponse.json({
        success: true,
        members: members || [],
        team_info: team,
        count: members?.length || 0
      });
    }

    if (userId) {
      // Get teams for a specific user with their role
      const { data: userMemberships, error } = await supabase
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
            max_members,
            captain_id,
            statistics:team_statistics!team_statistics_team_id_fkey(total_members, active_members, total_points)
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user memberships:', error);
        return NextResponse.json({ error: 'Failed to fetch user memberships' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        memberships: userMemberships || [],
        count: userMemberships?.length || 0
      });
    }

    return NextResponse.json({ error: 'Missing required parameter: team_id or user_id' }, { status: 400 });

  } catch (error) {
    console.error('Team Members GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/team-members - Join team or invite member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team_id, user_id, invite_code, invited_by } = body;

    if (!team_id || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: team_id, user_id' 
      }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Get team information
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, invite_code, max_members, is_public, captain_id')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', team_id)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json({ 
          error: 'User is already a member of this team' 
        }, { status: 400 });
      } else if (existingMember.status === 'pending') {
        return NextResponse.json({ 
          error: 'User already has a pending invitation to this team' 
        }, { status: 400 });
      }
    }

    // Validate invite code for private teams
    if (!team.is_public && invite_code !== team.invite_code) {
      return NextResponse.json({ 
        error: 'Invalid invite code' 
      }, { status: 400 });
    }

    // Check team capacity
    const { count: currentMembers } = await supabase
      .from('team_members')
      .select('id', { count: 'exact' })
      .eq('team_id', team_id)
      .eq('status', 'active');

    if (currentMembers >= team.max_members) {
      return NextResponse.json({ 
        error: 'Team is full' 
      }, { status: 400 });
    }

    // Determine membership status
    const membershipStatus = invited_by ? 'pending' : 'active';
    const role = 'member';

    // Create team membership
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id,
        user_id,
        role,
        status: membershipStatus,
        invited_by
      })
      .select(`
        id,
        role,
        joined_at,
        status,
        user:profiles!team_members_user_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (memberError) {
      console.error('Error creating team membership:', memberError);
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
    }

    // Create notification for team captain
    if (membershipStatus === 'active') {
      await supabase
        .from('notifications')
        .insert({
          user_id: team.captain_id,
          type: 'team_member_joined',
          title: 'New Team Member!',
          message: `${membership.user.full_name} joined your team "${team.name}"`,
          data: {
            team_id: team_id,
            new_member_id: user_id,
            team_name: team.name
          }
        });

      // Award social points for joining a team
      await supabase.rpc('award_points', {
        p_user_id: user_id,
        p_points: 10,
        p_category: 'social'
      });
    } else {
      // Create notification for invitation
      await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'team_invitation',
          title: 'Team Invitation',
          message: `You've been invited to join team "${team.name}"`,
          data: {
            team_id: team_id,
            invited_by: invited_by,
            team_name: team.name
          }
        });
    }

    return NextResponse.json({
      success: true,
      membership,
      message: membershipStatus === 'active' 
        ? `Successfully joined team "${team.name}"` 
        : `Invitation sent to join team "${team.name}"`
    });

  } catch (error) {
    console.error('Team Members POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/team-members - Update member role or accept invitation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { membership_id, user_id, action, new_role } = body;

    if (!membership_id || !user_id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: membership_id, user_id, action' 
      }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Get membership details
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select(`
        *,
        team:teams!team_members_team_id_fkey(id, name, captain_id, max_members)
      `)
      .eq('id', membership_id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept_invitation':
        // User accepting team invitation
        if (membership.user_id !== user_id) {
          return NextResponse.json({ 
            error: 'You can only accept your own invitations' 
          }, { status: 403 });
        }

        if (membership.status !== 'pending') {
          return NextResponse.json({ 
            error: 'No pending invitation to accept' 
          }, { status: 400 });
        }

        // Update membership to active
        const { error: acceptError } = await supabase
          .from('team_members')
          .update({ 
            status: 'active',
            joined_at: new Date().toISOString()
          })
          .eq('id', membership_id);

        if (acceptError) {
          console.error('Error accepting invitation:', acceptError);
          return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
        }

        // Notify team captain
        await supabase
          .from('notifications')
          .insert({
            user_id: membership.team.captain_id,
            type: 'team_member_joined',
            title: 'Team Invitation Accepted!',
            message: `New member joined your team "${membership.team.name}"`,
            data: {
              team_id: membership.team_id,
              new_member_id: user_id,
              team_name: membership.team.name
            }
          });

        // Award points for joining
        await supabase.rpc('award_points', {
          p_user_id: user_id,
          p_points: 10,
          p_category: 'social'
        });

        return NextResponse.json({
          success: true,
          message: `Successfully joined team "${membership.team.name}"`
        });

      case 'decline_invitation':
        // User declining team invitation
        if (membership.user_id !== user_id) {
          return NextResponse.json({ 
            error: 'You can only decline your own invitations' 
          }, { status: 403 });
        }

        // Delete the membership record
        const { error: declineError } = await supabase
          .from('team_members')
          .delete()
          .eq('id', membership_id);

        if (declineError) {
          console.error('Error declining invitation:', declineError);
          return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Team invitation declined'
        });

      case 'change_role':
        // Team captain/co-captain changing member role
        if (membership.team.captain_id !== user_id) {
          // Also allow co-captains to promote to member (but not to captain/co-captain)
          const { data: requesterMembership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', membership.team_id)
            .eq('user_id', user_id)
            .single();

          if (!requesterMembership || requesterMembership.role !== 'co_captain' || 
              ['captain', 'co_captain'].includes(new_role)) {
            return NextResponse.json({ 
              error: 'Only team captains can change member roles' 
            }, { status: 403 });
          }
        }

        if (!['member', 'co_captain'].includes(new_role)) {
          return NextResponse.json({ 
            error: 'Invalid role. Must be "member" or "co_captain"' 
          }, { status: 400 });
        }

        // Update member role
        const { error: roleError } = await supabase
          .from('team_members')
          .update({ role: new_role })
          .eq('id', membership_id);

        if (roleError) {
          console.error('Error updating member role:', roleError);
          return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
        }

        // Notify the member about role change
        await supabase
          .from('notifications')
          .insert({
            user_id: membership.user_id,
            type: 'team_role_changed',
            title: 'Team Role Updated',
            message: `Your role in team "${membership.team.name}" has been updated to ${new_role}`,
            data: {
              team_id: membership.team_id,
              new_role: new_role,
              team_name: membership.team.name
            }
          });

        return NextResponse.json({
          success: true,
          message: `Member role updated to ${new_role}`
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Must be "accept_invitation", "decline_invitation", or "change_role"' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Team Members PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/team-members - Leave team or remove member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('membership_id');
    const userId = searchParams.get('user_id');
    const teamId = searchParams.get('team_id');
    const memberUserId = searchParams.get('member_user_id');

    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: user_id' 
      }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    let membership;

    if (membershipId) {
      // Remove specific membership by ID
      const { data: membershipData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          *,
          team:teams!team_members_team_id_fkey(id, name, captain_id)
        `)
        .eq('id', membershipId)
        .single();

      if (memberError || !membershipData) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
      }

      membership = membershipData;
    } else if (teamId && memberUserId) {
      // Remove member by team_id and member_user_id
      const { data: membershipData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          *,
          team:teams!team_members_team_id_fkey(id, name, captain_id)
        `)
        .eq('team_id', teamId)
        .eq('user_id', memberUserId)
        .single();

      if (memberError || !membershipData) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
      }

      membership = membershipData;
    } else {
      return NextResponse.json({ 
        error: 'Must provide either membership_id or both team_id and member_user_id' 
      }, { status: 400 });
    }

    // Check permissions
    const isLeavingSelf = membership.user_id === userId;
    const isTeamCaptain = membership.team.captain_id === userId;
    const isCaptainLeaving = membership.user_id === membership.team.captain_id;

    if (!isLeavingSelf && !isTeamCaptain) {
      return NextResponse.json({ 
        error: 'You can only leave teams yourself or remove members if you are the captain' 
      }, { status: 403 });
    }

    if (isCaptainLeaving) {
      return NextResponse.json({ 
        error: 'Team captain cannot leave the team. Transfer captaincy first or delete the team.' 
      }, { status: 400 });
    }

    // Remove team membership
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', membership.id);

    if (deleteError) {
      console.error('Error removing team membership:', deleteError);
      return NextResponse.json({ error: 'Failed to remove team membership' }, { status: 500 });
    }

    // Create appropriate notifications
    if (isLeavingSelf) {
      // User left team - notify captain
      await supabase
        .from('notifications')
        .insert({
          user_id: membership.team.captain_id,
          type: 'team_member_left',
          title: 'Team Member Left',
          message: `A member left your team "${membership.team.name}"`,
          data: {
            team_id: membership.team_id,
            left_member_id: membership.user_id,
            team_name: membership.team.name
          }
        });
    } else {
      // Captain removed member - notify the member
      await supabase
        .from('notifications')
        .insert({
          user_id: membership.user_id,
          type: 'team_member_removed',
          title: 'Removed from Team',
          message: `You have been removed from team "${membership.team.name}"`,
          data: {
            team_id: membership.team_id,
            team_name: membership.team.name
          }
        });
    }

    return NextResponse.json({
      success: true,
      message: isLeavingSelf 
        ? `Successfully left team "${membership.team.name}"` 
        : `Successfully removed member from team "${membership.team.name}"`
    });

  } catch (error) {
    console.error('Team Members DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}