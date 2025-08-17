/**
 * Real-Time Social Features Infrastructure
 * 
 * Handles live messaging, notifications, activity feed updates, and presence
 * Uses Supabase Realtime for live database changes and WebSocket connections
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for real-time features
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'achievement' | 'challenge';
  created_at: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accept' | 'message' | 'achievement' | 'challenge';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface ActivityUpdate {
  id: string;
  user_id: string;
  type: 'achievement' | 'challenge_complete' | 'goal_reached' | 'streak';
  title: string;
  description: string;
  data?: Record<string, any>;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_activity?: string;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageListeners: ((message: Message) => void)[] = [];
  private notificationListeners: ((notification: Notification) => void)[] = [];
  private activityListeners: ((activity: ActivityUpdate) => void)[] = [];
  private presenceListeners: ((presence: UserPresence[]) => void)[] = [];
  
  private currentUserId: string | null = null;

  /**
   * Initialize real-time system for authenticated user
   */
  async initialize(userId: string) {
    this.currentUserId = userId;
    
    try {
      // Subscribe to personal messages
      await this.subscribeToMessages(userId);
      
      // Subscribe to personal notifications
      await this.subscribeToNotifications(userId);
      
      // Subscribe to friends' activity updates
      await this.subscribeToFriendsActivity(userId);
      
      // Set user online status
      await this.setUserPresence(userId, 'online');
      
      console.log('🔥 Real-time system initialized for user:', userId);
    } catch (error) {
      console.error('Error initializing real-time system:', error);
    }
  }

  /**
   * Subscribe to incoming messages
   */
  private async subscribeToMessages(userId: string) {
    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          this.messageListeners.forEach(listener => listener(message));
        }
      )
      .subscribe();

    this.channels.set(`messages:${userId}`, channel);
  }

  /**
   * Subscribe to notifications
   */
  private async subscribeToNotifications(userId: string) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          this.notificationListeners.forEach(listener => listener(notification));
        }
      )
      .subscribe();

    this.channels.set(`notifications:${userId}`, channel);
  }

  /**
   * Subscribe to friends' activity updates
   */
  private async subscribeToFriendsActivity(userId: string) {
    // Get user's friends list first
    const { data: friends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (friends && friends.length > 0) {
      const friendIds = friends.map(f => f.friend_id);
      
      const channel = supabase
        .channel(`activity:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_feed',
            filter: `user_id.in.(${friendIds.join(',')})`,
          },
          (payload) => {
            const activity = payload.new as ActivityUpdate;
            this.activityListeners.forEach(listener => listener(activity));
          }
        )
        .subscribe();

      this.channels.set(`activity:${userId}`, channel);
    }
  }

  /**
   * Send a message to another user
   */
  async sendMessage(receiverId: string, content: string, type: Message['message_type'] = 'text', metadata?: Record<string, any>) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const message = {
      sender_id: this.currentUserId,
      receiver_id: receiverId,
      content,
      message_type: type,
      metadata,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Message;
  }

  /**
   * Get conversation history with a friend
   */
  async getConversation(friendId: string, limit: number = 50): Promise<Message[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${this.currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${this.currentUserId})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).reverse() as Message[];
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(friendId: string) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', friendId)
      .eq('receiver_id', this.currentUserId)
      .is('read_at', null);

    if (error) {
      throw error;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, type: Notification['type'], title: string, message: string, data?: Record<string, any>) {
    const notification = {
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) {
      throw error;
    }
  }

  /**
   * Set user online presence
   */
  async setUserPresence(userId: string, status: UserPresence['status'], activity?: string) {
    const presence = {
      user_id: userId,
      status,
      last_seen: new Date().toISOString(),
      current_activity: activity,
    };

    const { error } = await supabase
      .from('user_presence')
      .upsert(presence);

    if (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Get friends' online status
   */
  async getFriendsPresence(userId: string): Promise<UserPresence[]> {
    const { data: friends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (!friends || friends.length === 0) {
      return [];
    }

    const friendIds = friends.map(f => f.friend_id);
    
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', friendIds)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active within last 5 minutes

    if (error) {
      console.error('Error getting friends presence:', error);
      return [];
    }

    return data as UserPresence[];
  }

  /**
   * Add activity to user's feed
   */
  async addActivity(type: ActivityUpdate['type'], title: string, description: string, data?: Record<string, any>) {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const activity = {
      user_id: this.currentUserId,
      type,
      title,
      description,
      data,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('activity_feed')
      .insert(activity);

    if (error) {
      throw error;
    }
  }

  // Event listeners
  onMessage(listener: (message: Message) => void) {
    this.messageListeners.push(listener);
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onNotification(listener: (notification: Notification) => void) {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  onActivity(listener: (activity: ActivityUpdate) => void) {
    this.activityListeners.push(listener);
    return () => {
      const index = this.activityListeners.indexOf(listener);
      if (index > -1) {
        this.activityListeners.splice(index, 1);
      }
    };
  }

  onPresence(listener: (presence: UserPresence[]) => void) {
    this.presenceListeners.push(listener);
    return () => {
      const index = this.presenceListeners.indexOf(listener);
      if (index > -1) {
        this.presenceListeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup all channels and listeners
   */
  async cleanup() {
    // Set user offline
    if (this.currentUserId) {
      await this.setUserPresence(this.currentUserId, 'offline');
    }

    // Unsubscribe from all channels
    for (const [name, channel] of this.channels) {
      await supabase.removeChannel(channel);
      console.log(`Unsubscribed from channel: ${name}`);
    }
    
    this.channels.clear();
    this.messageListeners = [];
    this.notificationListeners = [];
    this.activityListeners = [];
    this.presenceListeners = [];
    this.currentUserId = null;
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();