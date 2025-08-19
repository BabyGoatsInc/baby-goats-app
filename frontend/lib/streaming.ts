/**
 * Live Streaming Library - Baby Goats Broadcasting System
 * 
 * Handles live streaming functionality including:
 * - Stream creation and management
 * - Viewer tracking and presence
 * - Real-time chat integration
 * - Stream discovery and interaction
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for live streaming
export interface LiveStream {
  id: string;
  streamer_id: string;
  title: string;
  description?: string;
  category: string;
  status: 'created' | 'live' | 'ended' | 'scheduled';
  viewer_count: number;
  max_viewers: number;
  stream_key: string;
  stream_url: string;
  thumbnail_url?: string;
  chat_enabled: boolean;
  is_private: boolean;
  scheduled_for?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  streamer?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface StreamViewer {
  id: string;
  user_id: string;
  stream_id: string;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
  total_watch_time: number;
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface StreamChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system' | 'special';
  is_highlighted: boolean;
  is_moderator: boolean;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface StreamInteraction {
  type: 'like' | 'heart' | 'clap' | 'fire';
  user_id: string;
  timestamp: string;
}

class StreamingManager {
  private apiBaseUrl: string;
  private currentUserId: string | null = null;
  private activeStream: LiveStream | null = null;
  private viewerHeartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  }

  /**
   * Initialize streaming system for authenticated user
   */
  async initialize(userId: string) {
    this.currentUserId = userId;
    console.log('🎥 Streaming system initialized for user:', userId);
  }

  /**
   * Get live streams or user's streams
   */
  async getStreams(options: {
    userId?: string;
    status?: 'live' | 'ended' | 'scheduled';
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ streams: LiveStream[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options.userId) params.append('user_id', options.userId);
      if (options.status) params.append('status', options.status);
      if (options.category) params.append('category', options.category);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`${this.apiBaseUrl}/api/streams?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch streams: ${response.status}`);
      }

      const data = await response.json();
      return {
        streams: data.streams || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching streams:', error);
      throw error;
    }
  }

  /**
   * Create a new live stream
   */
  async createStream(streamData: {
    title: string;
    description?: string;
    category?: string;
    thumbnail_url?: string;
    chat_enabled?: boolean;
    is_private?: boolean;
    scheduled_for?: string;
  }): Promise<LiveStream> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamer_id: this.currentUserId,
          ...streamData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create stream');
      }

      const data = await response.json();
      this.activeStream = data.stream;
      
      // Store stream info locally
      await AsyncStorage.setItem('activeStream', JSON.stringify(data.stream));
      
      return data.stream;
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  }

  /**
   * Update stream status or metadata
   */
  async updateStream(streamId: string, updates: {
    status?: 'live' | 'ended';
    viewer_count?: number;
    max_viewers?: number;
    title?: string;
    description?: string;
    thumbnail_url?: string;
  }): Promise<LiveStream> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/streams`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamId,
          ...updates
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stream');
      }

      const data = await response.json();
      
      if (this.activeStream && this.activeStream.id === streamId) {
        this.activeStream = { ...this.activeStream, ...data.stream };
        await AsyncStorage.setItem('activeStream', JSON.stringify(this.activeStream));
      }
      
      return data.stream;
    } catch (error) {
      console.error('Error updating stream:', error);
      throw error;
    }
  }

  /**
   * Delete a stream
   */
  async deleteStream(streamId: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/streams?stream_id=${streamId}&streamer_id=${this.currentUserId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete stream');
      }

      if (this.activeStream && this.activeStream.id === streamId) {
        this.activeStream = null;
        await AsyncStorage.removeItem('activeStream');
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      throw error;
    }
  }

  /**
   * Join a stream as a viewer
   */
  async joinStream(streamId: string): Promise<{ viewerCount: number }> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/viewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.currentUserId,
          stream_id: streamId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join stream');
      }

      const data = await response.json();
      
      // Start heartbeat to maintain viewer status
      this.startViewerHeartbeat(streamId);
      
      return {
        viewerCount: data.viewerCount || 0
      };
    } catch (error) {
      console.error('Error joining stream:', error);
      throw error;
    }
  }

  /**
   * Leave a stream as a viewer
   */
  async leaveStream(streamId: string): Promise<{ viewerCount: number }> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      // Stop heartbeat
      this.stopViewerHeartbeat();

      const response = await fetch(`${this.apiBaseUrl}/api/viewers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.currentUserId,
          stream_id: streamId,
          action: 'leave'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave stream');
      }

      const data = await response.json();
      
      return {
        viewerCount: data.viewerCount || 0
      };
    } catch (error) {
      console.error('Error leaving stream:', error);
      throw error;
    }
  }

  /**
   * Get viewers for a stream
   */
  async getViewers(streamId: string, activeOnly: boolean = true): Promise<{
    viewers: StreamViewer[];
    activeViewerCount: number;
    totalViewers: number;
  }> {
    try {
      const params = new URLSearchParams({
        stream_id: streamId,
        active_only: activeOnly.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/api/viewers?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch viewers: ${response.status}`);
      }

      const data = await response.json();
      return {
        viewers: data.viewers || [],
        activeViewerCount: data.activeViewerCount || 0,
        totalViewers: data.totalViewers || 0
      };
    } catch (error) {
      console.error('Error fetching viewers:', error);
      throw error;
    }
  }

  /**
   * Send a chat message during stream
   */
  async sendChatMessage(streamId: string, message: string, messageType: 'text' | 'emoji' | 'special' = 'text'): Promise<StreamChatMessage> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stream-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamId,
          user_id: this.currentUserId,
          message: message.trim(),
          message_type: messageType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get chat messages for a stream
   */
  async getChatMessages(streamId: string, limit: number = 50, since?: string): Promise<StreamChatMessage[]> {
    try {
      const params = new URLSearchParams({
        stream_id: streamId,
        limit: limit.toString()
      });

      if (since) {
        params.append('since', since);
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stream-chat?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chat messages: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  /**
   * Start viewer heartbeat to maintain active status
   */
  private startViewerHeartbeat(streamId: string) {
    this.stopViewerHeartbeat(); // Clear any existing interval
    
    this.viewerHeartbeatInterval = setInterval(async () => {
      try {
        await fetch(`${this.apiBaseUrl}/api/viewers`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: this.currentUserId,
            stream_id: streamId,
            action: 'heartbeat'
          })
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop viewer heartbeat
   */
  private stopViewerHeartbeat() {
    if (this.viewerHeartbeatInterval) {
      clearInterval(this.viewerHeartbeatInterval);
      this.viewerHeartbeatInterval = null;
    }
  }

  /**
   * Get current active stream
   */
  async getActiveStream(): Promise<LiveStream | null> {
    if (this.activeStream) {
      return this.activeStream;
    }

    try {
      const stored = await AsyncStorage.getItem('activeStream');
      if (stored) {
        this.activeStream = JSON.parse(stored);
        return this.activeStream;
      }
    } catch (error) {
      console.error('Error getting active stream:', error);
    }

    return null;
  }

  /**
   * Clear active stream
   */
  async clearActiveStream() {
    this.activeStream = null;
    this.stopViewerHeartbeat();
    await AsyncStorage.removeItem('activeStream');
  }

  /**
   * Get stream categories
   */
  getStreamCategories() {
    return [
      { id: 'training', name: 'Training Session', emoji: '💪' },
      { id: 'competition', name: 'Competition', emoji: '🏆' },
      { id: 'tips', name: 'Tips & Advice', emoji: '💡' },
      { id: 'motivation', name: 'Motivation', emoji: '🔥' },
      { id: 'q_and_a', name: 'Q&A Session', emoji: '❓' },
      { id: 'general', name: 'General Chat', emoji: '💬' },
      { id: 'challenge', name: 'Challenge', emoji: '⚡' }
    ];
  }

  /**
   * Cleanup streaming resources
   */
  async cleanup() {
    this.stopViewerHeartbeat();
    this.currentUserId = null;
    this.activeStream = null;
    console.log('🎥 Streaming system cleaned up');
  }
}

// Export singleton instance
export const streamingManager = new StreamingManager();