import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineManager } from './offlineManager';
import { apiCache, CacheConfigs } from './apiCache';

/**
 * Offline-First Data Layer for Baby Goats App
 * Handles local data storage, offline operations, and data synchronization
 */

export interface OfflineData {
  profiles: { [id: string]: any };
  achievements: { [id: string]: any };
  goals: { [id: string]: any };
  challenges: { [id: string]: any };
  userProgress: { [userId: string]: any };
  profilePhotos: { [userId: string]: string };
}

export interface DataSyncStatus {
  lastSync: number;
  syncInProgress: boolean;
  pendingChanges: number;
  conflictCount: number;
}

class OfflineDataLayer {
  private readonly OFFLINE_DATA_KEY = 'babygoats_offline_data';
  private readonly SYNC_STATUS_KEY = 'babygoats_sync_status';
  private readonly DATA_VERSION = '1.0.0';
  
  private offlineData: OfflineData = {
    profiles: {},
    achievements: {},
    goals: {},
    challenges: {},
    userProgress: {},
    profilePhotos: {},
  };

  private syncStatus: DataSyncStatus = {
    lastSync: 0,
    syncInProgress: false,
    pendingChanges: 0,
    conflictCount: 0,
  };

  /**
   * Initialize offline data layer
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Offline Data Layer...');

    try {
      await this.loadOfflineData();
      await this.loadSyncStatus();
      console.log('✅ Offline Data Layer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Offline Data Layer:', error);
    }
  }

  /**
   * Get user profile with offline support
   */
  async getProfile(userId: string, options?: { forceRefresh?: boolean }): Promise<any> {
    const cacheKey = `profile_${userId}`;

    // If offline, return cached data
    if (offlineManager.isOffline()) {
      const offlineProfile = this.offlineData.profiles[userId];
      if (offlineProfile) {
        console.log(`📱 Offline profile loaded: ${userId}`);
        return offlineProfile;
      }
      throw new Error('Profile not available offline');
    }

    // If force refresh, skip cache
    if (options?.forceRefresh) {
      return this.fetchAndCacheProfile(userId);
    }

    // Try cache first
    const cached = await apiCache.get(cacheKey, CacheConfigs.userProfile);
    if (cached) {
      // Update offline storage with cached data
      this.offlineData.profiles[userId] = cached;
      await this.saveOfflineData();
      return cached;
    }

    // Fetch from API
    return this.fetchAndCacheProfile(userId);
  }

  /**
   * Update user profile with offline support
   */
  async updateProfile(userId: string, updates: any): Promise<any> {
    const optimisticUpdate = {
      ...this.offlineData.profiles[userId],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Apply optimistic update locally
    this.offlineData.profiles[userId] = optimisticUpdate;
    await this.saveOfflineData();

    // If offline, queue for later sync
    if (offlineManager.isOffline()) {
      await offlineManager.queueOfflineAction(
        'UPDATE',
        `/profiles/${userId}`,
        updates,
        'HIGH'
      );
      
      this.syncStatus.pendingChanges++;
      await this.saveSyncStatus();
      
      console.log(`📝 Profile update queued for offline sync: ${userId}`);
      return optimisticUpdate;
    }

    // If online, sync immediately
    try {
      const result = await this.syncProfileUpdate(userId, updates);
      
      // Update cache with server response
      const cacheKey = `profile_${userId}`;
      await apiCache.set(cacheKey, result, CacheConfigs.userProfile);
      
      return result;
    } catch (error) {
      // If API fails, queue for later sync
      await offlineManager.queueOfflineAction(
        'UPDATE',
        `/profiles/${userId}`,
        updates,
        'HIGH'
      );
      
      console.log(`⚠️ Profile update API failed, queued for sync: ${userId}`, error);
      return optimisticUpdate;
    }
  }

  /**
   * Get achievements with offline support
   */
  async getAchievements(userId: string): Promise<any[]> {
    const cacheKey = `achievements_${userId}`;

    // If offline, return cached data
    if (offlineManager.isOffline()) {
      const offlineAchievements = Object.values(this.offlineData.achievements)
        .filter((achievement: any) => achievement.userId === userId);
      
      if (offlineAchievements.length > 0) {
        console.log(`📱 Offline achievements loaded: ${userId} (${offlineAchievements.length} items)`);
        return offlineAchievements;
      }
      return [];
    }

    // Try cache first
    const cached = await apiCache.get(cacheKey, CacheConfigs.achievements);
    if (cached) {
      // Update offline storage
      cached.forEach((achievement: any) => {
        this.offlineData.achievements[achievement.id] = achievement;
      });
      await this.saveOfflineData();
      return cached;
    }

    // Fetch from API
    return this.fetchAndCacheAchievements(userId);
  }

  /**
   * Get goals with offline support
   */
  async getGoals(userId: string): Promise<any[]> {
    const cacheKey = `goals_${userId}`;

    // If offline, return cached data
    if (offlineManager.isOffline()) {
      const offlineGoals = Object.values(this.offlineData.goals)
        .filter((goal: any) => goal.userId === userId);
      
      console.log(`📱 Offline goals loaded: ${userId} (${offlineGoals.length} items)`);
      return offlineGoals;
    }

    // Try cache first
    const cached = await apiCache.get(cacheKey, CacheConfigs.statistics);
    if (cached) {
      // Update offline storage
      cached.forEach((goal: any) => {
        this.offlineData.goals[goal.id] = goal;
      });
      await this.saveOfflineData();
      return cached;
    }

    // For now, return mock goals since API doesn't exist yet
    return this.getMockGoals(userId);
  }

  /**
   * Update goal progress with offline support
   */
  async updateGoalProgress(userId: string, goalId: string, progress: number): Promise<any> {
    const goal = this.offlineData.goals[goalId] || { id: goalId, userId, progress: 0 };
    const updatedGoal = { ...goal, progress, updatedAt: new Date().toISOString() };

    // Apply optimistic update
    this.offlineData.goals[goalId] = updatedGoal;
    await this.saveOfflineData();

    // If offline, queue for sync
    if (offlineManager.isOffline()) {
      await offlineManager.queueOfflineAction(
        'UPDATE',
        `/goals/${goalId}/progress`,
        { progress },
        'MEDIUM'
      );
      
      this.syncStatus.pendingChanges++;
      await this.saveSyncStatus();
      
      console.log(`📝 Goal progress queued for offline sync: ${goalId} -> ${progress}%`);
    } else {
      // Sync immediately if online
      try {
        // Since goals API doesn't exist yet, just log the action
        console.log(`🎯 Goal progress updated: ${goalId} -> ${progress}%`);
      } catch (error) {
        console.warn('⚠️ Goal progress sync failed:', error);
      }
    }

    return updatedGoal;
  }

  /**
   * Get profile photo with offline support
   */
  async getProfilePhoto(userId: string): Promise<string | null> {
    // Check offline storage first
    const offlinePhoto = this.offlineData.profilePhotos[userId];
    if (offlinePhoto) {
      return offlinePhoto;
    }

    // If online, try to fetch from profile
    if (offlineManager.isOnline()) {
      try {
        const profile = await this.getProfile(userId);
        const photoUrl = profile?.avatar_url;
        
        if (photoUrl) {
          this.offlineData.profilePhotos[userId] = photoUrl;
          await this.saveOfflineData();
          return photoUrl;
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch profile photo:', error);
      }
    }

    return null;
  }

  /**
   * Update profile photo with offline support
   */
  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    // Store photo URL locally
    this.offlineData.profilePhotos[userId] = photoUrl;
    await this.saveOfflineData();

    // Update profile with new photo URL
    await this.updateProfile(userId, { avatar_url: photoUrl });
    
    console.log(`📸 Profile photo updated: ${userId}`);
  }

  /**
   * Get challenges with offline support
   */
  async getChallenges(): Promise<any[]> {
    const cacheKey = 'challenges';

    // If offline, return cached data
    if (offlineManager.isOffline()) {
      const offlineChallenges = Object.values(this.offlineData.challenges);
      console.log(`📱 Offline challenges loaded: ${offlineChallenges.length} items`);
      return offlineChallenges;
    }

    // Try cache first
    const cached = await apiCache.get(cacheKey, CacheConfigs.challenges);
    if (cached) {
      // Update offline storage
      cached.challenges?.forEach((challenge: any) => {
        this.offlineData.challenges[challenge.id] = challenge;
      });
      await this.saveOfflineData();
      return cached.challenges || [];
    }

    // Fetch from API
    return this.fetchAndCacheChallenges();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): DataSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force data synchronization
   */
  async forceSync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.lastSync = Date.now();
    await this.saveSyncStatus();

    try {
      // Trigger offline manager sync
      const result = await offlineManager.forcSync();
      
      this.syncStatus.pendingChanges = Math.max(0, this.syncStatus.pendingChanges - result.syncedCount);
      console.log(`✅ Data sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (error) {
      console.error('❌ Data sync failed:', error);
    } finally {
      this.syncStatus.syncInProgress = false;
      await this.saveSyncStatus();
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    this.offlineData = {
      profiles: {},
      achievements: {},
      goals: {},
      challenges: {},
      userProgress: {},
      profilePhotos: {},
    };

    this.syncStatus = {
      lastSync: 0,
      syncInProgress: false,
      pendingChanges: 0,
      conflictCount: 0,
    };

    await AsyncStorage.multiRemove([this.OFFLINE_DATA_KEY, this.SYNC_STATUS_KEY]);
    await apiCache.clear();
    await offlineManager.clearOfflineActions();
    
    console.log('🧹 All offline data cleared');
  }

  /**
   * Get offline storage statistics
   */
  getOfflineStats(): {
    dataSize: number;
    profiles: number;
    achievements: number;
    goals: number;
    challenges: number;
    photos: number;
    pendingChanges: number;
  } {
    const dataString = JSON.stringify(this.offlineData);
    
    return {
      dataSize: dataString.length,
      profiles: Object.keys(this.offlineData.profiles).length,
      achievements: Object.keys(this.offlineData.achievements).length,
      goals: Object.keys(this.offlineData.goals).length,
      challenges: Object.keys(this.offlineData.challenges).length,
      photos: Object.keys(this.offlineData.profilePhotos).length,
      pendingChanges: this.syncStatus.pendingChanges,
    };
  }

  // Private helper methods

  private async fetchAndCacheProfile(userId: string): Promise<any> {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_URL}/api/profiles?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const profile = data.profiles?.[0] || data;
        
        // Cache the result
        const cacheKey = `profile_${userId}`;
        await apiCache.set(cacheKey, profile, CacheConfigs.userProfile);
        
        // Store offline
        this.offlineData.profiles[userId] = profile;
        await this.saveOfflineData();
        
        return profile;
      }
      
      throw new Error(`Profile fetch failed: ${response.status}`);
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      throw error;
    }
  }

  private async fetchAndCacheAchievements(userId: string): Promise<any[]> {
    // Mock achievements for now since API doesn't exist yet
    const mockAchievements = [
      { id: '1', userId, title: 'First Goal Completed', type: 'milestone', unlockedAt: new Date().toISOString() },
      { id: '2', userId, title: 'Week Streak', type: 'consistency', unlockedAt: new Date().toISOString() },
    ];

    const cacheKey = `achievements_${userId}`;
    await apiCache.set(cacheKey, mockAchievements, CacheConfigs.achievements);
    
    mockAchievements.forEach(achievement => {
      this.offlineData.achievements[achievement.id] = achievement;
    });
    await this.saveOfflineData();
    
    return mockAchievements;
  }

  private async fetchAndCacheChallenges(): Promise<any[]> {
    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${BACKEND_URL}/api/challenges`);
      
      if (response.ok) {
        const data = await response.json();
        const challenges = data.challenges || [];
        
        // Cache the result
        await apiCache.set('challenges', data, CacheConfigs.challenges);
        
        // Store offline
        challenges.forEach((challenge: any) => {
          this.offlineData.challenges[challenge.id] = challenge;
        });
        await this.saveOfflineData();
        
        return challenges;
      }
      
      throw new Error(`Challenges fetch failed: ${response.status}`);
    } catch (error) {
      console.error('❌ Failed to fetch challenges:', error);
      return [];
    }
  }

  private getMockGoals(userId: string): any[] {
    return [
      {
        id: 'goal_1',
        userId,
        title: 'Practice 30 minutes daily',
        description: 'Consistent daily practice',
        target: 100,
        progress: 65,
        category: 'training',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'goal_2',
        userId,
        title: 'Complete 10 challenges',
        description: 'Finish weekly challenges',
        target: 10,
        progress: 7,
        category: 'challenges',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async syncProfileUpdate(userId: string, updates: any): Promise<any> {
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    const response = await fetch(`${BACKEND_URL}/api/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Profile update failed: ${response.status}`);
    }

    return response.json();
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.DATA_VERSION) {
          this.offlineData = parsed.data;
          console.log('📂 Offline data loaded from storage');
        } else {
          console.log('🔄 Offline data version mismatch, clearing old data');
          await this.clearOfflineData();
        }
      }
    } catch (error) {
      console.error('❌ Failed to load offline data:', error);
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const toStore = {
        version: this.DATA_VERSION,
        data: this.offlineData,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('❌ Failed to save offline data:', error);
    }
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (stored) {
        this.syncStatus = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('❌ Failed to save sync status:', error);
    }
  }
}

// Create singleton instance
export const offlineDataLayer = new OfflineDataLayer();

/**
 * React hook for offline-aware data fetching
 */
export function useOfflineData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const React = require('react');
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}