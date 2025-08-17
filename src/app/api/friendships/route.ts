import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Friendships API - Friend System Management
 * Handles friend requests, friendships, and social connections
 */

// GET /api/friendships - Get friends list or friend requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status'); // pending, accepted, blocked
    const type = searchParams.get('type'); // friends, sent_requests, received_requests
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (type === 'friends' || (!type && (!status || status === 'accepted'))) {
      // Get accepted friends
      const { data: friends, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          accepted_at
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching friends:', error);
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
      }

      // Format response to show the friend (not self)
      const formattedFriends = friends?.map(friendship => ({
        ...friendship,
        friend_profile: friendship.user_id === userId ? friendship.friend : friendship.user,
        friend_user_id: friendship.user_id === userId ? friendship.friend_id : friendship.user_id
      })) || [];

      return NextResponse.json({
        success: true,
        friends: formattedFriends,
        count: formattedFriends.length
      });
    }

    if (type === 'received_requests') {
      // Get pending friend requests received by user
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          initiated_by,
          requester:profiles!friendships_initiated_by_fkey(id, full_name, avatar_url, sport, grad_year)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching friend requests:', error);
        return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        friendRequests: requests || [],
        count: requests?.length || 0
      });
    }

    if (type === 'sent_requests') {
      // Get pending friend requests sent by user
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          recipient:profiles!friendships_friend_id_fkey(id, full_name, avatar_url, sport, grad_year)
        `)
        .eq('initiated_by', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sent requests:', error);
        return NextResponse.json({ error: 'Failed to fetch sent requests' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        sentRequests: requests || [],
        count: requests?.length || 0
      });
    }

    // Default: get all friendships with specified status
    let query = supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        accepted_at,
        initiated_by,
        user:profiles!friendships_user_id_fkey(id, full_name, avatar_url, sport),
        friend:profiles!friendships_friend_id_fkey(id, full_name, avatar_url, sport)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: friendships, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching friendships:', error);
      return NextResponse.json({ error: 'Failed to fetch friendships' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      friendships: friendships || [],
      count: friendships?.length || 0
    });

  } catch (error) {
    console.error('Friendships GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/friendships - Send friend request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, friend_id } = body;

    if (!user_id || !friend_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, friend_id' 
      }, { status: 400 });
    }

    if (user_id === friend_id) {
      return NextResponse.json({ 
        error: 'Cannot send friend request to yourself' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Check if friendship already exists
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing friendship:', checkError);
      return NextResponse.json({ error: 'Failed to check existing friendship' }, { status: 500 });
    }

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json({ 
          error: 'You are already friends with this person' 
        }, { status: 400 });
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json({ 
          error: 'Friend request already sent' 
        }, { status: 400 });
      }
    }

    // Get recipient profile for notification
    const { data: recipientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', friend_id)
      .single();

    if (profileError || !recipientProfile) {
      return NextResponse.json({ 
        error: 'Recipient profile not found' 
      }, { status: 404 });
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        user_id,
        friend_id,
        status: 'pending',
        initiated_by: user_id
      })
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        requester:profiles!friendships_initiated_by_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating friendship:', error);
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
    }

    // Create notification for recipient
    await supabase
      .from('notifications')
      .insert({
        user_id: friend_id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${friendship.requester.full_name} sent you a friend request`,
        data: {
          sender_id: user_id,
          friendship_id: friendship.id
        }
      });

    // Award social points to sender
    await supabase.rpc('award_points', {
      p_user_id: user_id,
      p_points: 2,
      p_category: 'social'
    });

    return NextResponse.json({
      success: true,
      friendship,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Friendships POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/friendships - Accept/decline friend request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendship_id, user_id, action } = body; // action: 'accept' or 'decline'

    if (!friendship_id || !user_id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: friendship_id, user_id, action' 
      }, { status: 400 });
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept" or "decline"' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Get the friendship request
    const { data: friendship, error: getError } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        initiated_by,
        requester:profiles!friendships_initiated_by_fkey(id, full_name, avatar_url)
      `)
      .eq('id', friendship_id)
      .single();

    if (getError || !friendship) {
      return NextResponse.json({ 
        error: 'Friend request not found' 
      }, { status: 404 });
    }

    // Verify user can respond to this request (must be the recipient)
    if (friendship.friend_id !== user_id) {
      return NextResponse.json({ 
        error: 'You can only respond to friend requests sent to you' 
      }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This friend request has already been handled' 
      }, { status: 400 });
    }

    if (action === 'decline') {
      // Delete the friendship request
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship_id);

      if (deleteError) {
        console.error('Error declining friend request:', deleteError);
        return NextResponse.json({ error: 'Failed to decline friend request' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Friend request declined'
      });
    }

    // Accept the friend request
    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', friendship_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error accepting friend request:', updateError);
      return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 });
    }

    // Get user's full name for notification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    // Create notification for the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: friendship.initiated_by,
        type: 'friend_accept',
        title: 'Friend Request Accepted!',
        message: `${userProfile?.full_name || 'Someone'} accepted your friend request`,
        data: {
          friend_id: user_id,
          friendship_id: friendship.id
        }
      });

    // Award social points to both users
    await Promise.all([
      supabase.rpc('award_points', {
        p_user_id: user_id,
        p_points: 5,
        p_category: 'social'
      }),
      supabase.rpc('award_points', {
        p_user_id: friendship.initiated_by,
        p_points: 5,
        p_category: 'social'
      })
    ]);

    // Create activity feed items for both users
    await Promise.all([
      supabase.from('activity_feed').insert({
        user_id: user_id,
        type: 'friend_added',
        title: 'New Friend!',
        description: `Now friends with ${friendship.requester.full_name}`,
        data: { friend_id: friendship.initiated_by }
      }),
      supabase.from('activity_feed').insert({
        user_id: friendship.initiated_by,
        type: 'friend_added',
        title: 'New Friend!',
        description: `Now friends with ${userProfile?.full_name}`,
        data: { friend_id: user_id }
      })
    ]);

    return NextResponse.json({
      success: true,
      friendship: updatedFriendship,
      message: 'Friend request accepted! You are now friends.'
    });

  } catch (error) {
    console.error('Friendships PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/friendships - Remove friend or cancel request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendship_id');
    const userId = searchParams.get('user_id');
    const friendId = searchParams.get('friend_id');

    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    let query = supabase.from('friendships').delete();

    if (friendshipId) {
      // Delete specific friendship by ID
      query = query.eq('id', friendshipId);
      
      // Verify user is involved in this friendship
      const { data: friendship } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('id', friendshipId)
        .single();

      if (!friendship || (friendship.user_id !== userId && friendship.friend_id !== userId)) {
        return NextResponse.json({ 
          error: 'You can only remove your own friendships' 
        }, { status: 403 });
      }
    } else if (friendId) {
      // Delete friendship between two specific users
      query = query.or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    } else {
      return NextResponse.json({ 
        error: 'Must specify either friendship_id or friend_id' 
      }, { status: 400 });
    }

    const { error, count } = await query;

    if (error) {
      console.error('Error removing friendship:', error);
      return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ 
        error: 'Friendship not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Friendship removed successfully',
      friendshipsRemoved: count
    });

  } catch (error) {
    console.error('Friendships DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}