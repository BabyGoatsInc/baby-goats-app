import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Live Streams API - Live Broadcasting System
 * Handles stream creation, management, and metadata
 */

// GET /api/streams - Get live streams or user's streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status') || 'live'; // live, ended, scheduled
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('live_streams')
      .select(`
        id,
        streamer_id,
        title,
        description,
        category,
        status,
        viewer_count,
        max_viewers,
        stream_key,
        stream_url,
        thumbnail_url,
        chat_enabled,
        is_private,
        scheduled_for,
        started_at,
        ended_at,
        created_at,
        profiles!live_streams_streamer_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user if specified
    if (userId) {
      query = query.eq('streamer_id', userId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    const { data: streams, error } = await query;

    if (error) {
      console.error('Error fetching streams:', error);
      return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
    }

    return NextResponse.json({ 
      streams: streams || [],
      total: streams?.length || 0,
      status: 'success'
    });

  } catch (error) {
    console.error('Streams GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/streams - Create a new live stream
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      streamer_id, 
      title, 
      description, 
      category = 'general',
      thumbnail_url,
      chat_enabled = true,
      is_private = false,
      scheduled_for 
    } = body;

    if (!streamer_id || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: streamer_id, title' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate unique stream key
    const streamKey = `bgs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const streamUrl = `rtmp://streaming.babygoats.app/live/${streamKey}`;

    // Create stream record
    const { data: stream, error } = await supabase
      .from('live_streams')
      .insert({
        streamer_id,
        title: title.trim(),
        description: description?.trim(),
        category,
        status: scheduled_for ? 'scheduled' : 'created',
        stream_key: streamKey,
        stream_url: streamUrl,
        thumbnail_url,
        chat_enabled,
        is_private,
        scheduled_for,
        viewer_count: 0,
        max_viewers: 0
      })
      .select(`
        id,
        streamer_id,
        title,
        description,
        category,
        status,
        stream_key,
        stream_url,
        thumbnail_url,
        chat_enabled,
        is_private,
        scheduled_for,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating stream:', error);
      return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
    }

    // Create activity feed entry for stream creation
    await supabase
      .from('activity_feed')
      .insert({
        user_id: streamer_id,
        type: 'stream_scheduled',
        title: 'Stream Scheduled',
        description: `${title} scheduled for ${scheduled_for ? new Date(scheduled_for).toLocaleDateString() : 'now'}`,
        data: {
          stream_id: stream.id,
          stream_title: title,
          category
        }
      });

    return NextResponse.json({
      success: true,
      stream,
      streamCreated: true
    });

  } catch (error) {
    console.error('Streams POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/streams - Update stream status or metadata
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      stream_id, 
      status, 
      viewer_count, 
      max_viewers,
      title,
      description,
      thumbnail_url 
    } = body;

    if (!stream_id) {
      return NextResponse.json({ 
        error: 'Missing required field: stream_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build update object
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'live') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'ended') {
        updateData.ended_at = new Date().toISOString();
      }
    }

    if (viewer_count !== undefined) {
      updateData.viewer_count = viewer_count;
    }

    if (max_viewers !== undefined) {
      updateData.max_viewers = Math.max(max_viewers, updateData.viewer_count || 0);
    }

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (thumbnail_url) updateData.thumbnail_url = thumbnail_url;

    const { data: stream, error } = await supabase
      .from('live_streams')
      .update(updateData)
      .eq('id', stream_id)
      .select(`
        id,
        streamer_id,
        title,
        status,
        viewer_count,
        max_viewers,
        started_at,
        ended_at
      `)
      .single();

    if (error) {
      console.error('Error updating stream:', error);
      return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
    }

    // Create activity feed entry for important status changes
    if (status === 'live') {
      await supabase
        .from('activity_feed')
        .insert({
          user_id: stream.streamer_id,
          type: 'stream_started',
          title: 'Live Stream Started',
          description: `${stream.title} is now live!`,
          data: {
            stream_id: stream.id,
            stream_title: stream.title
          }
        });
    }

    return NextResponse.json({
      success: true,
      stream,
      streamUpdated: true
    });

  } catch (error) {
    console.error('Streams PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/streams - Delete a stream
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    const streamerId = searchParams.get('streamer_id');

    if (!streamId || !streamerId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: stream_id, streamer_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership before deletion
    const { data: stream, error: fetchError } = await supabase
      .from('live_streams')
      .select('id, streamer_id, status')
      .eq('id', streamId)
      .eq('streamer_id', streamerId)
      .single();

    if (fetchError || !stream) {
      return NextResponse.json({ 
        error: 'Stream not found or unauthorized' 
      }, { status: 404 });
    }

    // Don't allow deletion of live streams
    if (stream.status === 'live') {
      return NextResponse.json({ 
        error: 'Cannot delete a live stream. End the stream first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('live_streams')
      .delete()
      .eq('id', streamId)
      .eq('streamer_id', streamerId);

    if (error) {
      console.error('Error deleting stream:', error);
      return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      streamDeleted: true
    });

  } catch (error) {
    console.error('Streams DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}