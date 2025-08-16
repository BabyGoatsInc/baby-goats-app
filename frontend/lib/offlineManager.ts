import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Comprehensive Offline Management System for Baby Goats App
 * Handles offline detection, data synchronization, and graceful degradation
 */

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

class OfflineManager {
  private networkState: NetworkState = {
    isConnected: false,
    type: 'none',
    isInternetReachable: null,
  };

  private syncInProgress = false;
  private listeners: ((state: NetworkState) => void)[] = [];
  private offlineActions: OfflineAction[] = [];
  private readonly OFFLINE_ACTIONS_KEY = 'babygoats_offline_actions';
  private readonly MAX_OFFLINE_ACTIONS = 1000;
  private readonly MAX_RETRY_COUNT = 3;

  /**
   * Initialize offline manager
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Offline Manager...');

    try {
      // Load pending offline actions from storage
      await this.loadOfflineActions();

      // Set up network state monitoring
      NetInfo.addEventListener(this.handleNetworkStateChange);

      // Get initial network state
      const initialState = await NetInfo.fetch();
      this.handleNetworkStateChange(initialState);

      console.log('✅ Offline Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Offline Manager:', error);
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkStateChange = (state: any) => {
    const previouslyConnected = this.networkState.isConnected;
    
    this.networkState = {
      isConnected: !!state.isConnected,
      type: state.type || 'none',
      isInternetReachable: state.isInternetReachable,
    };

    console.log(`📡 Network state: ${this.networkState.isConnected ? 'ONLINE' : 'OFFLINE'} (${this.networkState.type})`);

    // Notify listeners
    this.notifyListeners();

    // If we just came back online, trigger sync
    if (!previouslyConnected && this.networkState.isConnected) {
      console.log('🔄 Connection restored - starting background sync');
      this.syncOfflineActions();
    }
  };

  /**
   * Add network state listener
   */
  addNetworkListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of network state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.networkState);
      } catch (error) {
        console.error('❌ Error notifying network listener:', error);
      }
    });
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable !== false;
  }

  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Queue action for offline execution
   */
  async queueOfflineAction(
    type: OfflineAction['type'],
    endpoint: string,
    data: any,
    priority: OfflineAction['priority'] = 'MEDIUM'
  ): Promise<string> {
    const action: OfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
    };

    this.offlineActions.push(action);
    await this.saveOfflineActions();

    console.log(`📝 Queued offline action: ${type} ${endpoint} (Priority: ${priority})`);
    return action.id;
  }

  /**
   * Remove offline action by ID
   */
  async removeOfflineAction(actionId: string): Promise<void> {
    const index = this.offlineActions.findIndex(action => action.id === actionId);
    if (index > -1) {
      this.offlineActions.splice(index, 1);
      await this.saveOfflineActions();
      console.log(`🗑️ Removed offline action: ${actionId}`);
    }
  }

  /**
   * Get pending offline actions count
   */
  getPendingActionsCount(): number {
    return this.offlineActions.length;
  }

  /**
   * Get pending offline actions grouped by priority
   */
  getPendingActionsSummary(): { [key: string]: number } {
    const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    this.offlineActions.forEach(action => {
      summary[action.priority]++;
    });
    return summary;
  }

  /**
   * Sync offline actions when online
   */
  async syncOfflineActions(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    if (this.isOffline()) {
      console.log('📴 Device is offline, cannot sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Device is offline'] };
    }

    if (this.offlineActions.length === 0) {
      console.log('✅ No offline actions to sync');
      return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    console.log(`🔄 Starting sync of ${this.offlineActions.length} offline actions...`);

    // Sort actions by priority and timestamp (CRITICAL first, then oldest first)
    const sortedActions = [...this.offlineActions].sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    // Process actions in batches to avoid overwhelming the server
    const BATCH_SIZE = 5;
    for (let i = 0; i < sortedActions.length; i += BATCH_SIZE) {
      const batch = sortedActions.slice(i, i + BATCH_SIZE);
      await this.processBatch(batch, result);
      
      // Small delay between batches to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.syncInProgress = false;
    await this.saveOfflineActions();

    console.log(`✅ Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
    return result;
  }

  /**
   * Process a batch of offline actions
   */
  private async processBatch(actions: OfflineAction[], result: SyncResult): Promise<void> {
    for (const action of actions) {
      try {
        const success = await this.executeOfflineAction(action);
        
        if (success) {
          result.syncedCount++;
          await this.removeOfflineAction(action.id);
          console.log(`✅ Synced: ${action.type} ${action.endpoint}`);
        } else {
          action.retryCount++;
          
          if (action.retryCount >= this.MAX_RETRY_COUNT) {
            result.failedCount++;
            result.errors.push(`Max retries exceeded for ${action.type} ${action.endpoint}`);
            await this.removeOfflineAction(action.id);
            console.log(`❌ Max retries exceeded: ${action.type} ${action.endpoint}`);
          } else {
            console.log(`⚠️ Retry ${action.retryCount}/${this.MAX_RETRY_COUNT}: ${action.type} ${action.endpoint}`);
          }
        }
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Error syncing ${action.type} ${action.endpoint}: ${error}`);
        console.error(`❌ Sync error for ${action.type} ${action.endpoint}:`, error);
      }
    }
  }

  /**
   * Execute a single offline action
   */
  private async executeOfflineAction(action: OfflineAction): Promise<boolean> {
    try {
      // Import the backend URL from env
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const url = `${BACKEND_URL}/api${action.endpoint}`;
      
      let response: Response;
      
      switch (action.type) {
        case 'CREATE':
        case 'UPDATE':
          response = await fetch(url, {
            method: action.type === 'CREATE' ? 'POST' : 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data),
            timeout: 10000, // 10 second timeout
          });
          break;
          
        case 'DELETE':
          response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data),
            timeout: 10000,
          });
          break;
          
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      return response.ok;
    } catch (error) {
      console.error(`❌ Failed to execute offline action:`, error);
      return false;
    }
  }

  /**
   * Load offline actions from storage
   */
  private async loadOfflineActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      if (stored) {
        this.offlineActions = JSON.parse(stored);
        console.log(`📂 Loaded ${this.offlineActions.length} offline actions from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load offline actions:', error);
      this.offlineActions = [];
    }
  }

  /**
   * Save offline actions to storage
   */
  private async saveOfflineActions(): Promise<void> {
    try {
      // Limit the number of stored actions to prevent storage bloat
      if (this.offlineActions.length > this.MAX_OFFLINE_ACTIONS) {
        this.offlineActions = this.offlineActions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.MAX_OFFLINE_ACTIONS);
      }

      await AsyncStorage.setItem(
        this.OFFLINE_ACTIONS_KEY,
        JSON.stringify(this.offlineActions)
      );
    } catch (error) {
      console.error('❌ Failed to save offline actions:', error);
    }
  }

  /**
   * Clear all offline actions
   */
  async clearOfflineActions(): Promise<void> {
    this.offlineActions = [];
    await AsyncStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
    console.log('🧹 Cleared all offline actions');
  }

  /**
   * Force sync manually
   */
  async forcSync(): Promise<SyncResult> {
    console.log('🔄 Forcing manual sync...');
    return this.syncOfflineActions();
  }

  /**
   * Get offline statistics
   */
  getOfflineStats(): {
    pendingActions: number;
    prioritySummary: { [key: string]: number };
    oldestAction?: number;
    newestAction?: number;
  } {
    const prioritySummary = this.getPendingActionsSummary();
    const timestamps = this.offlineActions.map(a => a.timestamp);
    
    return {
      pendingActions: this.offlineActions.length,
      prioritySummary,
      oldestAction: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestAction: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager();

/**
 * React hook for network state
 */
export function useNetworkState() {
  const React = require('react');
  const [networkState, setNetworkState] = React.useState<NetworkState>(
    offlineManager.getNetworkState()
  );

  React.useEffect(() => {
    const unsubscribe = offlineManager.addNetworkListener(setNetworkState);
    return unsubscribe;
  }, []);

  return networkState;
}

/**
 * React hook for offline status
 */
export function useOfflineStatus() {
  const networkState = useNetworkState();
  return {
    isOnline: networkState.isConnected && networkState.isInternetReachable !== false,
    isOffline: !networkState.isConnected || networkState.isInternetReachable === false,
    networkType: networkState.type,
  };
}