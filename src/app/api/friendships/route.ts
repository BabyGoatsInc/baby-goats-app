import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Simple query to test if table exists
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching friendships:', error);
      return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
    }

    return NextResponse.json({ 
      friends: friendships || [],
      total: friendships?.length || 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, friend_id } = body;

    if (!user_id || !friend_id) {
      return NextResponse.json({ 
        error: 'User ID and Friend ID are required' 
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
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${user_id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user_id})`)
      .single();

    if (existingFriendship) {
      return NextResponse.json({ 
        error: 'Friend request already exists or you are already friends' 
      }, { status: 400 });
    }

    // Create new friend request
    const { data: newRequest, error } = await supabase
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
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating friend request:', error);
      return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Friend request sent successfully',
      friendRequest: newRequest
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendship_id, action, user_id } = body;

    if (!friendship_id || !action || !user_id) {
      return NextResponse.json({ 
        error: 'Friendship ID, action, and user ID are required' 
      }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "accept" or "reject"' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (action === 'accept') {
      const { data: updatedFriendship, error } = await supabase
        .from('friendships')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', friendship_id)
        .eq('friend_id', user_id) // Only the recipient can accept
        .select('*')
        .single();

      if (error) {
        console.error('Error accepting friend request:', error);
        return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Friend request accepted',
        friendship: updatedFriendship
      });
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship_id)
        .eq('friend_id', user_id); // Only the recipient can reject

      if (error) {
        console.error('Error rejecting friend request:', error);
        return NextResponse.json({ error: 'Failed to reject friend request' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Friend request rejected'
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendship_id');
    const userId = searchParams.get('user_id');

    if (!friendshipId || !userId) {
      return NextResponse.json({ 
        error: 'Friendship ID and user ID are required' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Delete the friendship (user must be part of the friendship)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      console.error('Error deleting friendship:', error);
      return NextResponse.json({ error: 'Failed to delete friendship' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Friendship deleted successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}