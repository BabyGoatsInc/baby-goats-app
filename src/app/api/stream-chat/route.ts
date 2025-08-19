import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Stream Chat API - Live Broadcasting System
 * Handles real-time chat during live streams
 */

// GET /api/stream-chat - Get chat messages for a stream
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const since = searchParams.get('since'); // ISO timestamp

    if (!streamId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: stream_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('stream_chat_messages')
      .select(`
        id,
        stream_id,
        user_id,
        message,
        message_type,
        is_highlighted,
        is_moderator,
        metadata,
        created_at,
        profiles!stream_chat_messages_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    // Get messages since a specific timestamp
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching stream chat:', error);
      return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      total: messages?.length || 0,
      status: 'success'
    });

  } catch (error) {
    console.error('Stream Chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stream-chat - Send a chat message during stream
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      stream_id, 
      user_id, 
      message, 
      message_type = 'text',
      metadata 
    } = body;

    if (!stream_id || !user_id || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: stream_id, user_id, message' 
      }, { status: 400 });
    }

    // Validate message length
    if (message.trim().length === 0 || message.length > 500) {
      return NextResponse.json({ 
        error: 'Message must be between 1 and 500 characters' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify stream exists and is live
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('id, status, streamer_id, chat_enabled')
      .eq('id', stream_id)
      .single();

    if (streamError || !stream) {
      return NextResponse.json({ 
        error: 'Stream not found' 
      }, { status: 404 });
    }

    if (stream.status !== 'live') {
      return NextResponse.json({ 
        error: 'Stream is not currently live' 
      }, { status: 400 });
    }

    if (!stream.chat_enabled) {
      return NextResponse.json({ 
        error: 'Chat is disabled for this stream' 
      }, { status: 403 });
    }

    // Check if user is currently viewing the stream
    const { data: viewer } = await supabase
      .from('stream_viewers')
      .select('id')
      .eq('user_id', user_id)
      .eq('stream_id', stream_id)
      .eq('is_active', true)
      .single();

    if (!viewer && user_id !== stream.streamer_id) {
      return NextResponse.json({ 
        error: 'Must be watching the stream to send chat messages' 
      }, { status: 403 });
    }

    // Check if user is the streamer for moderator privileges
    const isModerator = user_id === stream.streamer_id;

    // Rate limiting: Check recent messages from this user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentMessageCount } = await supabase
      .from('stream_chat_messages')
      .select('id', { count: 'exact' })
      .eq('user_id', user_id)
      .eq('stream_id', stream_id)
      .gte('created_at', fiveMinutesAgo);

    if ((recentMessageCount || 0) >= 20 && !isModerator) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please slow down.' 
      }, { status: 429 });
    }

    // Filter inappropriate content (basic profanity filter)
    const profanityWords = ['spam', 'scam', 'fake', 'hate'];
    const containsProfanity = profanityWords.some(word => 
      message.toLowerCase().includes(word.toLowerCase())
    );

    if (containsProfanity && !isModerator) {
      return NextResponse.json({ 
        error: 'Message contains inappropriate content' 
      }, { status: 400 });
    }

    // Insert chat message
    const { data: chatMessage, error } = await supabase
      .from('stream_chat_messages')
      .insert({
        stream_id,
        user_id,
        message: message.trim(),
        message_type,
        is_moderator: isModerator,
        is_highlighted: false,
        metadata
      })
      .select(`
        id,
        stream_id,
        user_id,
        message,
        message_type,
        is_highlighted,
        is_moderator,
        created_at,
        profiles!stream_chat_messages_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error sending chat message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Send special notification for highlighted messages or streamer messages
    if (isModerator || message_type === 'special') {
      await supabase
        .from('notifications')
        .insert({
          user_id: stream.streamer_id,
          type: 'stream_chat',
          title: 'Stream Chat Activity',
          message: `New message in your stream: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          data: {
            stream_id: stream_id,
            message_id: chatMessage.id,
            sender_id: user_id
          }
        });
    }

    return NextResponse.json({
      success: true,
      message: chatMessage,
      messageSent: true
    });

  } catch (error) {
    console.error('Stream Chat POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/stream-chat - Moderate chat message (highlight/delete)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, stream_id, moderator_id, action, reason } = body;

    if (!message_id || !stream_id || !moderator_id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: message_id, stream_id, moderator_id, action' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify moderator is the stream owner
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('id, streamer_id')
      .eq('id', stream_id)
      .single();

    if (streamError || !stream) {
      return NextResponse.json({ 
        error: 'Stream not found' 
      }, { status: 404 });
    }

    if (stream.streamer_id !== moderator_id) {
      return NextResponse.json({ 
        error: 'Only the stream owner can moderate chat' 
      }, { status: 403 });
    }

    if (action === 'highlight') {
      // Highlight message
      const { data: message, error } = await supabase
        .from('stream_chat_messages')
        .update({ 
          is_highlighted: true,
          moderation_reason: reason 
        })
        .eq('id', message_id)
        .eq('stream_id', stream_id)
        .select('id, user_id, message')
        .single();

      if (error) {
        console.error('Error highlighting message:', error);
        return NextResponse.json({ error: 'Failed to highlight message' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message,
        messageHighlighted: true
      });

    } else if (action === 'delete') {
      // Delete message
      const { data: message, error } = await supabase
        .from('stream_chat_messages')
        .delete()
        .eq('id', message_id)
        .eq('stream_id', stream_id)
        .select('id, user_id')
        .single();

      if (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        messageDeleted: true
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: highlight, delete' 
    }, { status: 400 });

  } catch (error) {
    console.error('Stream Chat PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/stream-chat - Clear chat or delete old messages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    const moderatorId = searchParams.get('moderator_id');
    const action = searchParams.get('action') || 'clear'; // clear, cleanup
    const olderThan = searchParams.get('older_than'); // ISO timestamp

    if (!streamId || !moderatorId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: stream_id, moderator_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify moderator is the stream owner
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('id, streamer_id')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json({ 
        error: 'Stream not found' 
      }, { status: 404 });
    }

    if (stream.streamer_id !== moderatorId) {
      return NextResponse.json({ 
        error: 'Only the stream owner can moderate chat' 
      }, { status: 403 });
    }

    let query = supabase
      .from('stream_chat_messages')
      .delete()
      .eq('stream_id', streamId);

    if (action === 'cleanup' && olderThan) {
      // Delete messages older than specified time
      query = query.lt('created_at', olderThan);
    }

    const { data: deletedMessages, error } = await query.select('id');

    if (error) {
      console.error('Error clearing chat:', error);
      return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedMessages: deletedMessages?.length || 0,
      chatCleared: true
    });

  } catch (error) {
    console.error('Stream Chat DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}