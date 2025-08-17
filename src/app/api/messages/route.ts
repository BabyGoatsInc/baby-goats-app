import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Messages API - Live Chat & Messaging System
 * Handles real-time messaging between athletes
 */

// GET /api/messages - Get conversation history or message list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friend_id');
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    if (friendId && userId) {
      // Get conversation between two users
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          message_type,
          read_at,
          metadata,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(limit)
        .offset(offset);

      if (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
      }

      // Reverse to show oldest first
      const conversation = (messages || []).reverse();

      return NextResponse.json({
        success: true,
        messages: conversation,
        count: conversation.length
      });
    }

    if (userId) {
      // Get recent conversations for user
      const { data: conversations, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          message_type,
          read_at,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
      }

      // Group by conversation and get latest message per conversation
      const conversationMap = new Map();
      conversations?.forEach(message => {
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            ...message,
            other_user: message.sender_id === userId ? message.receiver : message.sender,
            unread_count: 0
          });
        }
      });

      // Count unread messages for each conversation
      for (const [otherUserId, conversation] of conversationMap) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', userId)
          .is('read_at', null);

        conversation.unread_count = count || 0;
      }

      return NextResponse.json({
        success: true,
        conversations: Array.from(conversationMap.values()),
        count: conversationMap.size
      });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender_id, receiver_id, content, message_type = 'text', metadata } = body;

    if (!sender_id || !receiver_id || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: sender_id, receiver_id, content' 
      }, { status: 400 });
    }

    if (sender_id === receiver_id) {
      return NextResponse.json({ 
        error: 'Cannot send message to yourself' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Check if users are friends
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${sender_id},friend_id.eq.${receiver_id}),and(user_id.eq.${receiver_id},friend_id.eq.${sender_id})`)
      .eq('status', 'accepted')
      .single();

    if (friendError || !friendship) {
      return NextResponse.json({ 
        error: 'Messages can only be sent between friends' 
      }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id,
        receiver_id,
        content: content.trim(),
        message_type,
        metadata
      })
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        message_type,
        read_at,
        metadata,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Create notification for receiver
    await supabase
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'message',
        title: 'New Message',
        message: `${message.sender.full_name} sent you a message`,
        data: {
          sender_id: sender_id,
          message_id: message.id,
          message_preview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        }
      });

    return NextResponse.json({
      success: true,
      message,
      messageSent: true
    });

  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/messages - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, friend_id, message_ids } = body;

    if (!user_id) {
      return NextResponse.json({ 
        error: 'Missing required field: user_id' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    let query = supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user_id)
      .is('read_at', null);

    if (friend_id) {
      query = query.eq('sender_id', friend_id);
    }

    if (message_ids && Array.isArray(message_ids)) {
      query = query.in('id', message_ids);
    }

    const { error, count } = await query;

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messagesMarkedRead: count || 0
    });

  } catch (error) {
    console.error('Messages PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}