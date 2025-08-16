import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * High-performance API response caching system for Baby Goats app
 * Reduces network calls, improves performance, and provides offline capabilities
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
  version: string;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in MB
  version?: string; // Cache version for invalidation
  persistent?: boolean; // Store in AsyncStorage for persistence
}

class ApiCache {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly CACHE_VERSION = '1.0.0';
  private readonly STORAGE_PREFIX = 'babygoats_cache_';
  
  /**
   * Get cached data for a key
   */
  async get<T = any>(key: string, config?: CacheConfig): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    
    try {
      // Check memory cache first (fastest)
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && this.isValid(memoryEntry)) {
        console.log(`💾 Cache HIT (memory): ${key}`);
        return memoryEntry.data as T;
      }

      // Check persistent storage if enabled
      if (config?.persistent !== false) {
        const storedEntry = await this.getFromStorage(cacheKey);
        if (storedEntry && this.isValid(storedEntry)) {
          // Restore to memory cache
          this.memoryCache.set(cacheKey, storedEntry);
          console.log(`💿 Cache HIT (storage): ${key}`);
          return storedEntry.data as T;
        }
      }

      console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.warn('⚠️ Cache read error:', error);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  async set(key: string, data: any, config?: CacheConfig): Promise<void> {
    const cacheKey = this.generateKey(key);
    const ttl = config?.ttl || this.DEFAULT_TTL;
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      version: config?.version || this.CACHE_VERSION,
    };

    try {
      // Store in memory cache
      this.memoryCache.set(cacheKey, entry);
      
      // Store in persistent storage if enabled
      if (config?.persistent !== false) {
        await this.setInStorage(cacheKey, entry);
      }

      // Manage memory size
      this.manageCacheSize();
      
      console.log(`💾 Cached: ${key} (TTL: ${ttl / 1000}s)`);
    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    
    // Remove from memory
    this.memoryCache.delete(cacheKey);
    
    // Remove from storage
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_PREFIX}${cacheKey}`);
      console.log(`🗑️ Cache removed: ${key}`);
    } catch (error) {
      console.warn('⚠️ Cache removal error:', error);
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear persistent storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    memorySize: number;
    hitRate?: number;
  } {
    const memorySize = this.calculateMemorySize();
    
    return {
      memoryEntries: this.memoryCache.size,
      memorySize: memorySize,
    };
  }

  /**
   * Wrapper for caching API calls
   */
  async wrapApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, config);
    if (cached !== null) {
      return cached;
    }

    // Make API call and cache result
    try {
      const result = await apiCall();
      await this.set(key, result, config);
      return result;
    } catch (error) {
      console.error(`❌ API call failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string): string {
    return `api_${key}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const isNotExpired = now < entry.expiry;
    const isCorrectVersion = entry.version === this.CACHE_VERSION;
    
    return isNotExpired && isCorrectVersion;
  }

  /**
   * Get entry from AsyncStorage
   */
  private async getFromStorage(key: string): Promise<CacheEntry | null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set entry in AsyncStorage
   */
  private async setInStorage(key: string, entry: CacheEntry): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Storage might be full, continue without persistent caching
      console.warn('⚠️ Persistent cache storage failed:', error);
    }
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemorySize(): number {
    let size = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      // Rough estimation of memory usage
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for timestamps, etc.
    }
    return size;
  }

  /**
   * Manage cache size by removing oldest entries
   */
  private manageCacheSize(): void {
    const currentSize = this.calculateMemorySize();
    
    if (currentSize > this.MAX_MEMORY_SIZE) {
      console.log('🧹 Cache size limit reached, removing old entries');
      
      // Sort by timestamp (oldest first)
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
      
      console.log(`🧹 Removed ${toRemove} old cache entries`);
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    let removedCount = 0;
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    console.log(`🧹 Cleanup: removed ${removedCount} expired entries`);
  }
}

// Create singleton instance
export const apiCache = new ApiCache();

/**
 * Predefined cache configurations for different data types
 */
export const CacheConfigs = {
  // User profile data - changes infrequently
  userProfile: {
    ttl: 15 * 60 * 1000, // 15 minutes
    persistent: true,
    version: '1.0.0',
  },
  
  // Challenge data - updated daily
  challenges: {
    ttl: 30 * 60 * 1000, // 30 minutes
    persistent: true,
    version: '1.0.0',
  },
  
  // Statistics - can be cached longer
  statistics: {
    ttl: 10 * 60 * 1000, // 10 minutes
    persistent: true,
    version: '1.0.0',
  },
  
  // Achievement data - rarely changes
  achievements: {
    ttl: 60 * 60 * 1000, // 1 hour
    persistent: true,
    version: '1.0.0',
  },
  
  // Real-time data - short TTL
  liveData: {
    ttl: 30 * 1000, // 30 seconds
    persistent: false,
    version: '1.0.0',
  },
} as const;

/**
 * Helper function for caching API responses
 */
export function cacheApiResponse<T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  cacheConfig?: CacheConfig
): Promise<T> {
  return apiCache.wrapApiCall(endpoint, apiCall, cacheConfig);
}

/**
 * Start cache cleanup interval
 */
export function startCacheCleanup(): void {
  // Run cleanup every 5 minutes
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
  
  console.log('🧹 Cache cleanup scheduled every 5 minutes');
}

/**
 * React hook for cached API calls
 */
export function useCachedApi<T>(
  key: string,
  apiCall: () => Promise<T>,
  config?: CacheConfig & { enabled?: boolean }
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const React = require('react');

  React.useEffect(() => {
    if (config?.enabled === false) {
      setLoading(false);
      return;
    }

    apiCache.wrapApiCall(key, apiCall, config)
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError(err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key, config?.enabled]);

  return { data, loading, error };
}