import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorMonitoring } from './errorMonitoring';
import { offlineManager } from './offlineManager';
import { apiCache, CacheConfigs } from './apiCache';

/**
 * Core Social System for Baby Goats App
 * Handles friend connections, following, and social interactions for young athletes
 * Age-appropriate and safety-first design for 8-16 year olds
 */

export interface AthleteProfile {
  id: string;
  username: string;
  displayName: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  sport: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  location?: string;
  joinedAt: string;
  isPublic: boolean;
  parentalControls: ParentalControls;
  stats?: AthleteStats;
  badges?: string[];
  recentAchievements?: Achievement[];
}

export interface ParentalControls {
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  parentEmail?: string;
  moderationLevel: 'strict' | 'moderate' | 'relaxed';
}

export interface AthleteStats {
  totalAchievements: number;
  goalsCompleted: number;
  daysSinceJoined: number;
  currentStreak: number;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'consistency' | 'improvement' | 'social' | 'special';
  iconUrl?: string;
  unlockedAt: string;
  isPublic: boolean;
}

export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string;
  createdAt: string;
  acceptedAt?: string;
  friendProfile?: AthleteProfile;
}

export interface FollowConnection {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  followerProfile?: AthleteProfile;
  followingProfile?: AthleteProfile;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  type: 'achievement_unlocked' | 'goal_completed' | 'new_photo' | 'milestone_reached' | 'friend_added' | 'challenge_completed';
  title: string;
  description: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isPublic: boolean;
  reactions?: Reaction[];
  commentsCount: number;
  userProfile?: AthleteProfile;
}

export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'wow' | 'celebrate' | 'support';
  createdAt: string;
  userProfile?: AthleteProfile;
}

export interface SafetyReport {
  id: string;
  reportedBy: string;
  reportedUser: string;
  reason: 'inappropriate_content' | 'bullying' | 'fake_profile' | 'spam' | 'other';
  description: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

class SocialSystem {
  private readonly STORAGE_KEY = 'babygoats_social_data';
  private socialData = {
    friends: [] as FriendConnection[],
    following: [] as FollowConnection[],
    followers: [] as FollowConnection[],
    activityFeed: [] as ActivityFeedItem[],
    blockedUsers: [] as string[],
  };

  /**
   * Initialize social system
   */
  async initialize(): Promise<void> {
    console.log('🤝 Initializing Social System...');
    
    try {
      await this.loadSocialData();
      console.log('✅ Social System initialized');
      
      await errorMonitoring.logEvent('info', 'Social system initialized', {
        friends: this.socialData.friends.length,
        following: this.socialData.following.length,
        followers: this.socialData.followers.length,
      });
    } catch (error) {
      console.error('❌ Failed to initialize Social System:', error);
      await errorMonitoring.logError(error as Error, 'high', 'error', {
        component: 'SocialSystem',
        phase: 'initialization'
      });
    }
  }

  /**
   * Get enhanced athlete profile with social features
   */
  async getAthleteProfile(userId: string, viewerUserId?: string): Promise<AthleteProfile | null> {
    try {
      const cacheKey = `athlete_profile_${userId}`;
      
      // Check cache first
      const cached = await apiCache.get<AthleteProfile>(cacheKey, CacheConfigs.userProfile);
      if (cached) {
        // Add social stats
        cached.stats = await this.calculateAthleteStats(userId);
        return cached;
      }

      // Fetch from API (would be replaced with actual API call)
      const profile = await this.fetchAthleteProfile(userId);
      if (!profile) return null;

      // Check privacy settings
      if (!this.canViewProfile(profile, viewerUserId)) {
        return this.getPrivateProfileView(profile);
      }

      // Add social statistics
      profile.stats = await this.calculateAthleteStats(userId);
      profile.recentAchievements = await this.getRecentAchievements(userId, 3);

      // Cache the result
      await apiCache.set(cacheKey, profile, CacheConfigs.userProfile);

      return profile;
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'getAthleteProfile',
        userId
      });
      return null;
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<{
    success: boolean;
    message: string;
    requestId?: string;
  }> {
    try {
      // Safety checks
      if (fromUserId === toUserId) {
        return { success: false, message: "You can't add yourself as a friend!" };
      }

      if (this.socialData.blockedUsers.includes(toUserId)) {
        return { success: false, message: "Unable to send friend request" };
      }

      // Check if already friends or request pending
      const existingConnection = this.socialData.friends.find(
        f => (f.userId === fromUserId && f.friendId === toUserId) ||
             (f.userId === toUserId && f.friendId === fromUserId)
      );

      if (existingConnection) {
        if (existingConnection.status === 'accepted') {
          return { success: false, message: "You're already friends!" };
        }
        if (existingConnection.status === 'pending') {
          return { success: false, message: "Friend request already sent" };
        }
      }

      // Check recipient's parental controls
      const recipientProfile = await this.getAthleteProfile(toUserId);
      if (!recipientProfile?.parentalControls.allowFriendRequests) {
        return { success: false, message: "This athlete isn't accepting friend requests right now" };
      }

      // Create friend request
      const friendRequest: FriendConnection = {
        id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: fromUserId,
        friendId: toUserId,
        status: 'pending',
        initiatedBy: fromUserId,
        createdAt: new Date().toISOString(),
      };

      // Add to local data
      this.socialData.friends.push(friendRequest);
      await this.saveSocialData();

      // Queue for sync if offline
      if (offlineManager.isOffline()) {
        await offlineManager.queueOfflineAction(
          'CREATE',
          '/social/friend-requests',
          friendRequest,
          'MEDIUM'
        );
      } else {
        // Send to server (mock for now)
        await this.syncFriendRequest(friendRequest);
      }

      // Log activity
      await this.createActivityFeedItem(fromUserId, 'friend_added', 'Sent a friend request', '', {
        recipientId: toUserId
      });

      console.log(`🤝 Friend request sent: ${fromUserId} → ${toUserId}`);
      return { success: true, message: "Friend request sent!", requestId: friendRequest.id };

    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'sendFriendRequest',
        fromUserId,
        toUserId
      });
      return { success: false, message: "Failed to send friend request" };
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const request = this.socialData.friends.find(f => f.id === requestId);
      if (!request) {
        return { success: false, message: "Friend request not found" };
      }

      if (request.friendId !== userId) {
        return { success: false, message: "You can't accept this request" };
      }

      if (request.status !== 'pending') {
        return { success: false, message: "This request has already been handled" };
      }

      // Accept the request
      request.status = 'accepted';
      request.acceptedAt = new Date().toISOString();
      await this.saveSocialData();

      // Queue for sync if offline
      if (offlineManager.isOffline()) {
        await offlineManager.queueOfflineAction(
          'UPDATE',
          `/social/friend-requests/${requestId}`,
          { status: 'accepted', acceptedAt: request.acceptedAt },
          'MEDIUM'
        );
      } else {
        await this.syncFriendRequestUpdate(request);
      }

      // Create activity feed items for both users
      await this.createActivityFeedItem(userId, 'friend_added', 'New friendship!', '', {
        friendId: request.userId
      });

      console.log(`🤝 Friend request accepted: ${requestId}`);
      return { success: true, message: "You're now friends!" };

    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'acceptFriendRequest',
        requestId,
        userId
      });
      return { success: false, message: "Failed to accept friend request" };
    }
  }

  /**
   * Follow an athlete
   */
  async followAthlete(followerId: string, followingId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (followerId === followingId) {
        return { success: false, message: "You can't follow yourself!" };
      }

      // Check if already following
      const existingFollow = this.socialData.following.find(
        f => f.followerId === followerId && f.followingId === followingId
      );

      if (existingFollow) {
        return { success: false, message: "You're already following this athlete" };
      }

      // Create follow connection
      const follow: FollowConnection = {
        id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId,
        followingId,
        createdAt: new Date().toISOString(),
      };

      this.socialData.following.push(follow);
      await this.saveSocialData();

      // Queue for sync if offline
      if (offlineManager.isOffline()) {
        await offlineManager.queueOfflineAction(
          'CREATE',
          '/social/follows',
          follow,
          'LOW'
        );
      }

      console.log(`👥 Follow created: ${followerId} → ${followingId}`);
      return { success: true, message: "Now following!" };

    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'followAthlete',
        followerId,
        followingId
      });
      return { success: false, message: "Failed to follow athlete" };
    }
  }

  /**
   * Get friends list
   */
  async getFriends(userId: string): Promise<FriendConnection[]> {
    try {
      const friends = this.socialData.friends.filter(
        f => (f.userId === userId || f.friendId === userId) && f.status === 'accepted'
      );

      // Fetch friend profiles
      for (const friend of friends) {
        const friendUserId = friend.userId === userId ? friend.friendId : friend.userId;
        friend.friendProfile = await this.getAthleteProfile(friendUserId, userId);
      }

      return friends;
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'low', 'error', {
        component: 'SocialSystem',
        action: 'getFriends',
        userId
      });
      return [];
    }
  }

  /**
   * Get pending friend requests
   */
  async getPendingFriendRequests(userId: string): Promise<FriendConnection[]> {
    try {
      const pendingRequests = this.socialData.friends.filter(
        f => f.friendId === userId && f.status === 'pending'
      );

      // Fetch requester profiles
      for (const request of pendingRequests) {
        request.friendProfile = await this.getAthleteProfile(request.userId, userId);
      }

      return pendingRequests;
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'low', 'error', {
        component: 'SocialSystem',
        action: 'getPendingFriendRequests',
        userId
      });
      return [];
    }
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    try {
      // Get friends to include their activities
      const friends = await this.getFriends(userId);
      const friendIds = friends.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );
      friendIds.push(userId); // Include own activities

      // Filter activity feed
      let activities = this.socialData.activityFeed.filter(
        activity => friendIds.includes(activity.userId) && activity.isPublic
      );

      // Sort by creation date (newest first)
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Limit results
      activities = activities.slice(0, limit);

      // Add user profiles
      for (const activity of activities) {
        activity.userProfile = await this.getAthleteProfile(activity.userId, userId);
      }

      return activities;
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'getActivityFeed',
        userId
      });
      return [];
    }
  }

  /**
   * Create activity feed item
   */
  async createActivityFeedItem(
    userId: string,
    type: ActivityFeedItem['type'],
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const activity: ActivityFeedItem = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        title,
        description,
        metadata,
        createdAt: new Date().toISOString(),
        isPublic: true,
        reactions: [],
        commentsCount: 0,
      };

      this.socialData.activityFeed.push(activity);
      
      // Keep only recent activities (last 1000)
      if (this.socialData.activityFeed.length > 1000) {
        this.socialData.activityFeed.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.socialData.activityFeed = this.socialData.activityFeed.slice(0, 1000);
      }

      await this.saveSocialData();

      console.log(`📢 Activity created: ${type} for user ${userId}`);
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'low', 'error', {
        component: 'SocialSystem',
        action: 'createActivityFeedItem',
        userId,
        type
      });
    }
  }

  /**
   * Search athletes
   */
  async searchAthletes(query: string, currentUserId: string, limit: number = 10): Promise<AthleteProfile[]> {
    try {
      // This would normally be a server-side search
      // For now, we'll simulate with mock data
      const mockProfiles = await this.getMockSearchResults(query, limit);
      
      // Filter out current user and blocked users
      const filtered = mockProfiles.filter(
        profile => profile.id !== currentUserId && 
                  !this.socialData.blockedUsers.includes(profile.id) &&
                  profile.isPublic
      );

      return filtered;
    } catch (error) {
      await errorMonitoring.logError(error as Error, 'medium', 'error', {
        component: 'SocialSystem',
        action: 'searchAthletes',
        query,
        currentUserId
      });
      return [];
    }
  }

  // Private helper methods

  private async fetchAthleteProfile(userId: string): Promise<AthleteProfile | null> {
    // Mock athlete profile - in real app, this would be an API call
    return {
      id: userId,
      username: `athlete_${userId.slice(0, 8)}`,
      displayName: 'Young Champion',
      sport: 'Basketball',
      experience_level: 'intermediate',
      bio: 'Passionate about basketball and improving every day! 🏀',
      joinedAt: new Date().toISOString(),
      isPublic: true,
      parentalControls: {
        allowDirectMessages: true,
        allowFriendRequests: true,
        profileVisibility: 'public',
        moderationLevel: 'moderate',
      },
      badges: ['first_goal', 'week_streak', 'team_player'],
    };
  }

  private canViewProfile(profile: AthleteProfile, viewerUserId?: string): boolean {
    if (!viewerUserId) return profile.isPublic;
    
    switch (profile.parentalControls.profileVisibility) {
      case 'public':
        return true;
      case 'friends':
        return this.areFriends(profile.id, viewerUserId);
      case 'private':
        return profile.id === viewerUserId;
      default:
        return false;
    }
  }

  private areFriends(userId1: string, userId2: string): boolean {
    return this.socialData.friends.some(
      f => ((f.userId === userId1 && f.friendId === userId2) ||
            (f.userId === userId2 && f.friendId === userId1)) &&
           f.status === 'accepted'
    );
  }

  private getPrivateProfileView(profile: AthleteProfile): AthleteProfile {
    return {
      ...profile,
      bio: undefined,
      stats: undefined,
      recentAchievements: undefined,
      displayName: 'Private Profile',
    };
  }

  private async calculateAthleteStats(userId: string): Promise<AthleteStats> {
    // Mock stats calculation
    const friends = this.socialData.friends.filter(
      f => (f.userId === userId || f.friendId === userId) && f.status === 'accepted'
    );

    const followers = this.socialData.followers.filter(f => f.followingId === userId);
    const following = this.socialData.following.filter(f => f.followerId === userId);

    return {
      totalAchievements: 12,
      goalsCompleted: 8,
      daysSinceJoined: 45,
      currentStreak: 7,
      friendsCount: friends.length,
      followersCount: followers.length,
      followingCount: following.length,
    };
  }

  private async getRecentAchievements(userId: string, limit: number): Promise<Achievement[]> {
    // Mock recent achievements
    return [
      {
        id: 'ach_1',
        title: 'First Goal',
        description: 'Completed your first goal!',
        type: 'milestone',
        unlockedAt: new Date().toISOString(),
        isPublic: true,
      },
      {
        id: 'ach_2',
        title: 'Team Player',
        description: 'Added 5 friends',
        type: 'social',
        unlockedAt: new Date(Date.now() - 86400000).toISOString(),
        isPublic: true,
      },
    ].slice(0, limit);
  }

  private async getMockSearchResults(query: string, limit: number): Promise<AthleteProfile[]> {
    // Mock search results
    const mockProfiles: AthleteProfile[] = [
      {
        id: 'user_1',
        username: 'basketballstar',
        displayName: 'Basketball Star',
        sport: 'Basketball',
        experience_level: 'advanced',
        age: 14,
        bio: 'Love basketball and making friends! 🏀',
        joinedAt: new Date().toISOString(),
        isPublic: true,
        parentalControls: {
          allowDirectMessages: true,
          allowFriendRequests: true,
          profileVisibility: 'public',
          moderationLevel: 'moderate',
        },
      },
      {
        id: 'user_2',
        username: 'soccerchamp',
        displayName: 'Soccer Champion',
        sport: 'Soccer',
        experience_level: 'elite',
        age: 15,
        bio: 'Soccer is life! Always training to be better ⚽',
        joinedAt: new Date().toISOString(),
        isPublic: true,
        parentalControls: {
          allowDirectMessages: true,
          allowFriendRequests: true,
          profileVisibility: 'public',
          moderationLevel: 'moderate',
        },
      },
    ];

    return mockProfiles.filter(p => 
      query.length === 0 || 
      p.displayName.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      p.sport.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
  }

  private async syncFriendRequest(request: FriendConnection): Promise<void> {
    // Mock API sync
    console.log('🔄 Syncing friend request to server:', request.id);
  }

  private async syncFriendRequestUpdate(request: FriendConnection): Promise<void> {
    // Mock API sync
    console.log('🔄 Syncing friend request update to server:', request.id);
  }

  private async loadSocialData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.socialData = JSON.parse(stored);
        console.log('📂 Social data loaded from storage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load social data:', error);
    }
  }

  private async saveSocialData(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.socialData));
    } catch (error) {
      console.warn('⚠️ Failed to save social data:', error);
    }
  }
}

// Create singleton instance
export const socialSystem = new SocialSystem();

/**
 * React hooks for social features
 */
export function useFriends(userId: string) {
  const React = require('react');
  const [friends, setFriends] = React.useState<FriendConnection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadFriends() {
      try {
        const friendsList = await socialSystem.getFriends(userId);
        setFriends(friendsList);
      } catch (error) {
        console.error('Failed to load friends:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadFriends();
    }
  }, [userId]);

  return { friends, loading, refetch: () => setLoading(true) };
}

export function useActivityFeed(userId: string, limit: number = 20) {
  const React = require('react');
  const [activities, setActivities] = React.useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadActivityFeed() {
      try {
        const feed = await socialSystem.getActivityFeed(userId, limit);
        setActivities(feed);
      } catch (error) {
        console.error('Failed to load activity feed:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadActivityFeed();
    }
  }, [userId, limit]);

  return { activities, loading, refetch: () => setLoading(true) };
}