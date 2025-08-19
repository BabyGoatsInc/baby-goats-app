import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Stream Viewers API - Live Broadcasting System
 * Handles viewer tracking, presence, and interactions
 */

// GET /api/viewers - Get viewers for a stream or user's viewing history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    const userId = searchParams.get('user_id');
    const activeOnly = searchParams.get('active_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (streamId) {
      // Get viewers for a specific stream
      let query = supabase
        .from('stream_viewers')
        .select('*')
        .eq('stream_id', streamId)
        .order('joined_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: viewers, error } = await query.limit(limit);

      if (error) {
        console.error('Error fetching stream viewers:', error);
        return NextResponse.json({ error: 'Failed to fetch viewers' }, { status: 500 });
      }

      // Get current viewer count
      const { count: activeViewerCount } = await supabase
        .from('stream_viewers')
        .select('id', { count: 'exact' })
        .eq('stream_id', streamId)
        .eq('is_active', true);

      return NextResponse.json({ 
        viewers: viewers || [],
        activeViewerCount: activeViewerCount || 0,
        totalViewers: viewers?.length || 0,
        status: 'success'
      });

    } else if (userId) {
      // Get viewing history for a user
      const { data: viewingHistory, error } = await supabase
        .from('stream_viewers')
        .select('*')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching viewing history:', error);
        return NextResponse.json({ error: 'Failed to fetch viewing history' }, { status: 500 });
      }

      return NextResponse.json({ 
        viewingHistory: viewingHistory || [],
        total: viewingHistory?.length || 0,
        status: 'success'
      });
    }

    return NextResponse.json({ 
      error: 'Must provide either stream_id or user_id parameter' 
    }, { status: 400 });

  } catch (error) {
    console.error('Viewers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/viewers - Join a stream as a viewer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, stream_id, metadata } = body;

    if (!user_id || !stream_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, stream_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify stream exists and is live
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('id, status, streamer_id, is_private')
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

    // Check if user is already viewing this stream
    const { data: existingViewer } = await supabase
      .from('stream_viewers')
      .select('id, is_active')
      .eq('user_id', user_id)
      .eq('stream_id', stream_id)
      .eq('is_active', true)
      .single();

    if (existingViewer) {
      return NextResponse.json({ 
        message: 'Already viewing this stream',
        viewer: existingViewer,
        alreadyViewing: true
      });
    }

    // Add viewer to stream
    const { data: viewer, error } = await supabase
      .from('stream_viewers')
      .insert({
        user_id,
        stream_id,
        joined_at: new Date().toISOString(),
        is_active: true,
        total_watch_time: 0,
        metadata
      })
      .select(`
        id,
        user_id,
        stream_id,
        joined_at,
        is_active
      `)
      .single();

    if (error) {
      console.error('Error joining stream:', error);
      return NextResponse.json({ error: 'Failed to join stream' }, { status: 500 });
    }

    // Update stream viewer count
    const { count: newViewerCount } = await supabase
      .from('stream_viewers')
      .select('id', { count: 'exact' })
      .eq('stream_id', stream_id)
      .eq('is_active', true);

    await supabase
      .from('live_streams')
      .update({ 
        viewer_count: newViewerCount || 0,
        max_viewers: Math.max(newViewerCount || 0, stream.max_viewers || 0)
      })
      .eq('id', stream_id);

    // Send notification to streamer (but not if they're viewing their own stream)
    if (user_id !== stream.streamer_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: stream.streamer_id,
          type: 'stream_viewer',
          title: 'New Viewer',
          message: 'Someone joined your live stream!',
          data: {
            stream_id: stream_id,
            viewer_id: user_id,
            viewer_count: newViewerCount
          }
        });
    }

    return NextResponse.json({
      success: true,
      viewer,
      viewerCount: newViewerCount || 0,
      joinedStream: true
    });

  } catch (error) {
    console.error('Viewers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/viewers - Update viewer status or interaction
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, stream_id, action, metadata } = body;

    if (!user_id || !stream_id || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, stream_id, action' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'leave') {
      // Leave stream
      const now = new Date().toISOString();
      
      const { data: viewer, error } = await supabase
        .from('stream_viewers')
        .update({
          left_at: now,
          is_active: false
        })
        .eq('user_id', user_id)
        .eq('stream_id', stream_id)
        .eq('is_active', true)
        .select('id, joined_at')
        .single();

      if (error) {
        console.error('Error leaving stream:', error);
        return NextResponse.json({ error: 'Failed to leave stream' }, { status: 500 });
      }

      // Calculate watch time
      if (viewer && viewer.joined_at) {
        const watchTime = Math.floor((new Date(now).getTime() - new Date(viewer.joined_at).getTime()) / 1000);
        
        await supabase
          .from('stream_viewers')
          .update({ total_watch_time: watchTime })
          .eq('id', viewer.id);
      }

      // Update stream viewer count
      const { count: newViewerCount } = await supabase
        .from('stream_viewers')
        .select('id', { count: 'exact' })
        .eq('stream_id', stream_id)
        .eq('is_active', true);

      await supabase
        .from('live_streams')
        .update({ viewer_count: newViewerCount || 0 })
        .eq('id', stream_id);

      return NextResponse.json({
        success: true,
        viewerCount: newViewerCount || 0,
        leftStream: true
      });

    } else if (action === 'heartbeat') {
      // Update viewer heartbeat to maintain active status
      const { error } = await supabase
        .from('stream_viewers')
        .update({
          last_heartbeat: new Date().toISOString(),
          metadata
        })
        .eq('user_id', user_id)
        .eq('stream_id', stream_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating heartbeat:', error);
        return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        heartbeatUpdated: true
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: leave, heartbeat' 
    }, { status: 400 });

  } catch (error) {
    console.error('Viewers PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/viewers - Remove inactive viewers (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    const inactiveMinutes = parseInt(searchParams.get('inactive_minutes') || '5');

    if (!streamId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: stream_id' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate cutoff time for inactive viewers
    const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000).toISOString();

    // Mark viewers as inactive if they haven't sent a heartbeat
    const { data: inactiveViewers, error } = await supabase
      .from('stream_viewers')
      .update({
        is_active: false,
        left_at: new Date().toISOString()
      })
      .eq('stream_id', streamId)
      .eq('is_active', true)
      .or(`last_heartbeat.is.null,last_heartbeat.lt.${cutoffTime}`)
      .select('id');

    if (error) {
      console.error('Error cleaning up inactive viewers:', error);
      return NextResponse.json({ error: 'Failed to cleanup inactive viewers' }, { status: 500 });
    }

    // Update stream viewer count
    const { count: activeViewerCount } = await supabase
      .from('stream_viewers')
      .select('id', { count: 'exact' })
      .eq('stream_id', streamId)
      .eq('is_active', true);

    await supabase
      .from('live_streams')
      .update({ viewer_count: activeViewerCount || 0 })
      .eq('id', streamId);

    return NextResponse.json({
      success: true,
      removedViewers: inactiveViewers?.length || 0,
      activeViewerCount: activeViewerCount || 0,
      cleanupComplete: true
    });

  } catch (error) {
    console.error('Viewers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}