import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Notifications API - Real-time Notification System
 * Handles user notifications for messages, friend requests, achievements, etc.
 */

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const type = searchParams.get('type'); // filter by notification type
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
      .offset(offset);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);

    if (countError) {
      console.error('Error fetching unread count:', countError);
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      count: notifications?.length || 0
    });

  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification (system use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, data } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, type, title, message' 
      }, { status: 400 });
    }

    const supabase = createServerComponentClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        data
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification,
      created: true
    });

  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, notification_ids, mark_all_read } = body;

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
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false);

    if (!mark_all_read && notification_ids && Array.isArray(notification_ids) && notification_ids.length > 0) {
      query = query.in('id', notification_ids);
    }

    const { error, count } = await query;

    if (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notificationsMarkedRead: count || 0
    });

  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const notificationId = searchParams.get('notification_id');
    const deleteAll = searchParams.get('delete_all') === 'true';

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

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (!deleteAll && notificationId) {
      query = query.eq('id', notificationId);
    }

    const { error, count } = await query;

    if (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notificationsDeleted: count || 0
    });

  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}