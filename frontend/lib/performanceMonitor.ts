import { Platform } from 'react-native';

/**
 * Performance monitoring utilities for Baby Goats app
 * Helps identify and prevent memory leaks, slow operations, and performance bottlenecks
 */

interface PerformanceMetrics {
  timestamp: number;
  memoryUsage?: number;
  renderTime?: number;
  apiResponseTime?: number;
  screenLoadTime?: number;
  imageLoadTime?: number;
}

interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 metrics
  private memoryWarnings: MemoryWarning[] = [];
  private apiTimings = new Map<string, number>();

  /**
   * Start monitoring app performance
   */
  public startMonitoring() {
    if (__DEV__) {
      console.log('📊 Performance monitoring started');
      
      // Monitor memory usage periodically
      setInterval(() => {
        this.recordMemoryUsage();
      }, 30000); // Every 30 seconds
      
      // Monitor for memory warnings on iOS
      if (Platform.OS === 'ios') {
        // Note: React Native doesn't expose memory warning events directly
        // This would need native module integration for full functionality
        console.log('🍎 iOS memory monitoring enabled (requires native module for full functionality)');
      }
    }
  }

  /**
   * Record memory usage snapshot
   */
  private recordMemoryUsage() {
    try {
      // Note: React Native doesn't provide direct memory access
      // This is a placeholder for memory monitoring that would require native modules
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        memoryUsage: this.estimateMemoryUsage(),
      };
      
      this.addMetric(metrics);
      this.checkMemoryThresholds(metrics.memoryUsage || 0);
    } catch (error) {
      console.error('❌ Memory monitoring error:', error);
    }
  }

  /**
   * Estimate memory usage based on app state
   * This is a simplified estimation - real memory monitoring requires native modules
   */
  private estimateMemoryUsage(): number {
    // Estimate based on metrics stored and other factors
    const baseMemory = 50; // Base app memory in MB
    const metricMemory = this.metrics.length * 0.001; // Roughly 1KB per metric
    const imageMemory = this.estimateImageMemory();
    
    return baseMemory + metricMemory + imageMemory;
  }

  /**
   * Estimate memory used by images
   */
  private estimateImageMemory(): number {
    // Rough estimation: assume some images are loaded
    // Real implementation would track actual image loads
    return 20; // Estimate 20MB for images
  }

  /**
   * Check memory thresholds and issue warnings
   */
  private checkMemoryThresholds(memoryMB: number) {
    let warning: MemoryWarning | null = null;

    if (memoryMB > 200) {
      warning = {
        level: 'critical',
        message: `Critical memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: Date.now(),
      };
    } else if (memoryMB > 150) {
      warning = {
        level: 'high',
        message: `High memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: Date.now(),
      };
    } else if (memoryMB > 100) {
      warning = {
        level: 'medium',
        message: `Elevated memory usage: ${memoryMB.toFixed(1)}MB`,
        timestamp: Date.now(),
      };
    }

    if (warning) {
      this.memoryWarnings.push(warning);
      console.warn(`🚨 Memory Warning: ${warning.message}`);
      
      // Keep only last 10 warnings
      if (this.memoryWarnings.length > 10) {
        this.memoryWarnings.shift();
      }
    }
  }

  /**
   * Track API response times
   */
  public startApiTimer(endpoint: string): void {
    this.apiTimings.set(endpoint, Date.now());
  }

  public endApiTimer(endpoint: string): number {
    const startTime = this.apiTimings.get(endpoint);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      this.apiTimings.delete(endpoint);
      
      this.addMetric({
        timestamp: Date.now(),
        apiResponseTime: responseTime,
      });

      if (responseTime > 3000) {
        console.warn(`🐌 Slow API response: ${endpoint} took ${responseTime}ms`);
      }

      return responseTime;
    }
    return 0;
  }

  /**
   * Track screen load times
   */
  public recordScreenLoad(screenName: string, loadTime: number): void {
    this.addMetric({
      timestamp: Date.now(),
      screenLoadTime: loadTime,
    });

    if (loadTime > 1000) {
      console.warn(`🐌 Slow screen load: ${screenName} took ${loadTime}ms`);
    } else {
      console.log(`✅ Screen loaded efficiently: ${screenName} in ${loadTime}ms`);
    }
  }

  /**
   * Track image load times
   */
  public recordImageLoad(imageUri: string, loadTime: number, size?: number): void {
    this.addMetric({
      timestamp: Date.now(),
      imageLoadTime: loadTime,
    });

    const sizeInfo = size ? ` (${(size / 1024).toFixed(1)}KB)` : '';
    
    if (loadTime > 2000) {
      console.warn(`🖼️ Slow image load: ${loadTime}ms${sizeInfo}`);
    } else {
      console.log(`📸 Image loaded: ${loadTime}ms${sizeInfo}`);
    }
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance summary
   */
  public getSummary(): {
    averageApiTime: number;
    averageScreenLoad: number;
    memoryWarnings: number;
    recentMetrics: PerformanceMetrics[];
  } {
    const apiTimes = this.metrics
      .filter(m => m.apiResponseTime)
      .map(m => m.apiResponseTime!);
    
    const screenLoads = this.metrics
      .filter(m => m.screenLoadTime)
      .map(m => m.screenLoadTime!);

    return {
      averageApiTime: apiTimes.length > 0 
        ? apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length 
        : 0,
      averageScreenLoad: screenLoads.length > 0
        ? screenLoads.reduce((a, b) => a + b, 0) / screenLoads.length
        : 0,
      memoryWarnings: this.memoryWarnings.length,
      recentMetrics: this.metrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Clear all performance data
   */
  public clearData(): void {
    this.metrics = [];
    this.memoryWarnings = [];
    this.apiTimings.clear();
    console.log('🧹 Performance data cleared');
  }

  /**
   * Log performance summary to console
   */
  public logSummary(): void {
    if (!__DEV__) return;
    
    const summary = this.getSummary();
    
    console.log('\n📊 Performance Summary:');
    console.log(`• Average API Response: ${summary.averageApiTime.toFixed(0)}ms`);
    console.log(`• Average Screen Load: ${summary.averageScreenLoad.toFixed(0)}ms`);
    console.log(`• Memory Warnings: ${summary.memoryWarnings}`);
    console.log(`• Total Metrics: ${this.metrics.length}`);
    
    if (summary.memoryWarnings > 0) {
      console.log('\n🚨 Recent Memory Warnings:');
      this.memoryWarnings.slice(-3).forEach(warning => {
        console.log(`  ${warning.level.toUpperCase()}: ${warning.message}`);
      });
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order component to track screen load times
 */
export function withPerformanceTracking<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  screenName: string
) {
  return function PerformanceTrackedScreen(props: T) {
    const React = require('react');
    
    React.useEffect(() => {
      const startTime = Date.now();
      
      return () => {
        const loadTime = Date.now() - startTime;
        performanceMonitor.recordScreenLoad(screenName, loadTime);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

/**
 * Hook for tracking API calls
 */
export function useApiPerformance() {
  return {
    startTimer: (endpoint: string) => performanceMonitor.startApiTimer(endpoint),
    endTimer: (endpoint: string) => performanceMonitor.endApiTimer(endpoint),
  };
}

/**
 * Memory optimization utilities
 */
export const MemoryUtils = {
  /**
   * Clear image cache when memory is low
   */
  clearImageCache: () => {
    console.log('🧹 Clearing image cache for memory optimization');
    // Implementation would depend on the image caching library used
  },

  /**
   * Optimize component re-renders
   */
  shouldComponentUpdate: (prevProps: any, nextProps: any) => {
    // Shallow comparison utility
    const keys = Object.keys(nextProps);
    return keys.some(key => prevProps[key] !== nextProps[key]);
  },

  /**
   * Debounce function to reduce excessive calls
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};