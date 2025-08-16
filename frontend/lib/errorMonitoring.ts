import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Comprehensive Error Monitoring & Logging System for Baby Goats App
 * Provides crash reporting, performance tracking, and real-time error aggregation
 */

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'error' | 'warning' | 'crash' | 'performance' | 'network' | 'storage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  userContext?: UserContext;
  deviceContext?: DeviceContext;
  appContext?: AppContext;
  metadata?: Record<string, any>;
}

export interface UserContext {
  userId?: string;
  userType?: string;
  sessionId: string;
  currentScreen?: string;
  userJourney?: string[];
  isAuthenticated: boolean;
}

export interface DeviceContext {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  availableMemory?: number;
  batteryLevel?: number;
  networkType?: string;
  isLowPowerMode?: boolean;
}

export interface AppContext {
  buildVersion: string;
  environment: 'development' | 'staging' | 'production';
  offlineMode: boolean;
  cacheSize?: number;
  lastSyncTime?: number;
  activeFeatures: string[];
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'api_response' | 'screen_load' | 'image_load' | 'sync_operation' | 'app_startup';
  duration: number;
  success: boolean;
  details?: Record<string, any>;
}

class ErrorMonitoringService {
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private sessionId: string;
  private userJourney: string[] = [];
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly STORAGE_KEY = 'babygoats_error_reports';
  private readonly PERFORMANCE_KEY = 'babygoats_performance_metrics';
  private deviceContext?: DeviceContext;
  private isInitialized = false;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize error monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔍 Initializing Error Monitoring System...');

    try {
      // Collect device context
      await this.collectDeviceContext();
      
      // Load pending reports from storage
      await this.loadPendingReports();
      
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Error Monitoring System initialized');
      
      // Log successful initialization
      await this.logEvent('info', 'Error monitoring system initialized', {
        sessionId: this.sessionId,
        deviceModel: this.deviceContext?.deviceModel,
        platform: Platform.OS,
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Error Monitoring System:', error);
    }
  }

  /**
   * Log an error with full context
   */
  async logError(
    error: Error | string,
    severity: ErrorReport['severity'] = 'medium',
    type: ErrorReport['type'] = 'error',
    metadata?: Record<string, any>
  ): Promise<string> {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userContext: await this.getUserContext(),
      deviceContext: this.deviceContext,
      appContext: await this.getAppContext(),
      metadata,
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Manage queue size
    this.manageQueueSize();
    
    // Save to storage
    await this.saveReportsToStorage();
    
    // Log to console in development
    if (__DEV__) {
      console.error(`🚨 [${severity.toUpperCase()}] ${type}:`, errorReport.message, metadata);
      if (errorReport.stack) {
        console.error('Stack:', errorReport.stack);
      }
    }

    // Send real-time alert for critical errors
    if (severity === 'critical') {
      await this.sendCriticalAlert(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Log performance metrics
   */
  async logPerformance(
    type: PerformanceMetric['type'],
    duration: number,
    success: boolean = true,
    details?: Record<string, any>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      duration,
      success,
      details,
    };

    this.performanceQueue.push(metric);
    
    // Manage queue size
    if (this.performanceQueue.length > this.MAX_QUEUE_SIZE) {
      this.performanceQueue.shift();
    }

    // Save to storage
    await this.savePerformanceToStorage();

    // Log performance warnings
    if (this.shouldWarnAboutPerformance(type, duration)) {
      await this.logError(
        `Slow ${type}: ${duration}ms`,
        'medium',
        'performance',
        { type, duration, details }
      );
    }

    if (__DEV__) {
      const status = success ? '✅' : '❌';
      console.log(`📊 ${status} Performance [${type}]: ${duration}ms`, details);
    }
  }

  /**
   * Track user journey for context
   */
  trackScreenNavigation(screenName: string): void {
    this.userJourney.push(`${screenName}@${Date.now()}`);
    
    // Keep only last 10 screens
    if (this.userJourney.length > 10) {
      this.userJourney.shift();
    }
  }

  /**
   * Log application events
   */
  async logEvent(
    level: 'info' | 'warning' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const severity: ErrorReport['severity'] = 
      level === 'error' ? 'high' : 
      level === 'warning' ? 'medium' : 'low';

    await this.logError(message, severity, level === 'error' ? 'error' : 'warning', metadata);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrors: number;
    averagePerformance: Record<string, number>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const errorsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const errorsByType = { error: 0, warning: 0, crash: 0, performance: 0, network: 0, storage: 0 };
    
    let recentErrors = 0;
    
    this.errorQueue.forEach(error => {
      errorsBySeverity[error.severity]++;
      errorsByType[error.type]++;
      
      if (error.timestamp > oneHourAgo) {
        recentErrors++;
      }
    });

    // Calculate average performance metrics
    const performanceByType: Record<string, number[]> = {};
    this.performanceQueue.forEach(metric => {
      if (!performanceByType[metric.type]) {
        performanceByType[metric.type] = [];
      }
      performanceByType[metric.type].push(metric.duration);
    });

    const averagePerformance: Record<string, number> = {};
    Object.entries(performanceByType).forEach(([type, durations]) => {
      averagePerformance[type] = durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    return {
      totalErrors: this.errorQueue.length,
      errorsBySeverity,
      errorsByType,
      recentErrors,
      averagePerformance,
    };
  }

  /**
   * Export error reports for analysis
   */
  async exportErrorReports(): Promise<{
    errors: ErrorReport[];
    performance: PerformanceMetric[];
    summary: any;
  }> {
    return {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      summary: this.getErrorStats(),
    };
  }

  /**
   * Clear all error reports
   */
  async clearReports(): Promise<void> {
    this.errorQueue = [];
    this.performanceQueue = [];
    
    await AsyncStorage.multiRemove([this.STORAGE_KEY, this.PERFORMANCE_KEY]);
    
    console.log('🧹 Error reports cleared');
  }

  // Private methods

  private async collectDeviceContext(): Promise<void> {
    try {
      this.deviceContext = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: await DeviceInfo.getVersion(),
        deviceModel: await DeviceInfo.getDeviceName(),
        availableMemory: await DeviceInfo.getTotalMemory().catch(() => undefined),
        batteryLevel: await DeviceInfo.getBatteryLevel().catch(() => undefined),
        isLowPowerMode: await DeviceInfo.isPowerSaveMode().catch(() => undefined),
      };
    } catch (error) {
      console.warn('⚠️ Failed to collect device context:', error);
      this.deviceContext = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0',
        deviceModel: 'Unknown',
      };
    }
  }

  private async getUserContext(): Promise<UserContext> {
    // This would integrate with your auth system
    return {
      sessionId: this.sessionId,
      userJourney: [...this.userJourney],
      isAuthenticated: false, // Would check auth state
      currentScreen: this.userJourney[this.userJourney.length - 1]?.split('@')[0],
    };
  }

  private async getAppContext(): Promise<AppContext> {
    // This would integrate with your app state
    return {
      buildVersion: await DeviceInfo.getBuildNumber().catch(() => '1'),
      environment: __DEV__ ? 'development' : 'production',
      offlineMode: false, // Would check offline manager
      activeFeatures: ['profiles', 'goals', 'achievements', 'storage'], // Current features
    };
  }

  private setupGlobalErrorHandlers(): void {
    // React Native global error boundary would go here
    // This is a placeholder for error boundary integration
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.logError(error, isFatal ? 'critical' : 'high', 'crash', {
          isFatal,
          globalError: true,
        });
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    // Integration with existing performance monitor
    console.log('🔧 Performance monitoring integration ready');
  }

  private shouldWarnAboutPerformance(type: PerformanceMetric['type'], duration: number): boolean {
    const thresholds = {
      api_response: 3000, // 3 seconds
      screen_load: 2000,  // 2 seconds
      image_load: 5000,   // 5 seconds
      sync_operation: 10000, // 10 seconds
      app_startup: 5000,  // 5 seconds
    };

    return duration > (thresholds[type] || 3000);
  }

  private async sendCriticalAlert(errorReport: ErrorReport): Promise<void> {
    // In production, this would send to monitoring service
    console.error('🚨 CRITICAL ERROR ALERT:', {
      id: errorReport.id,
      message: errorReport.message,
      timestamp: new Date(errorReport.timestamp).toISOString(),
      deviceModel: errorReport.deviceContext?.deviceModel,
      userId: errorReport.userContext?.userId,
    });
  }

  private manageQueueSize(): void {
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      // Remove oldest errors, but keep critical ones
      const nonCritical = this.errorQueue.filter(e => e.severity !== 'critical');
      const critical = this.errorQueue.filter(e => e.severity === 'critical');
      
      if (nonCritical.length > this.MAX_QUEUE_SIZE - critical.length) {
        nonCritical.splice(0, nonCritical.length - (this.MAX_QUEUE_SIZE - critical.length));
      }
      
      this.errorQueue = [...critical, ...nonCritical];
    }
  }

  private async loadPendingReports(): Promise<void> {
    try {
      const [storedErrors, storedPerformance] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.PERFORMANCE_KEY),
      ]);

      if (storedErrors) {
        this.errorQueue = JSON.parse(storedErrors);
        console.log(`📂 Loaded ${this.errorQueue.length} pending error reports`);
      }

      if (storedPerformance) {
        this.performanceQueue = JSON.parse(storedPerformance);
        console.log(`📂 Loaded ${this.performanceQueue.length} performance metrics`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load pending reports:', error);
    }
  }

  private async saveReportsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorQueue));
    } catch (error) {
      console.warn('⚠️ Failed to save error reports:', error);
    }
  }

  private async savePerformanceToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(this.performanceQueue));
    } catch (error) {
      console.warn('⚠️ Failed to save performance metrics:', error);
    }
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

/**
 * React Error Boundary Component
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    errorMonitoring.logError(error, 'critical', 'crash', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error! });
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error }: { error: Error }) {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return React.createElement(
    View,
    { style: styles.errorContainer },
    React.createElement(Text, { style: styles.errorTitle }, 'Oops! Something went wrong'),
    React.createElement(
      Text,
      { style: styles.errorMessage },
      "We've recorded this error and will fix it in the next update."
    ),
    React.createElement(
      TouchableOpacity,
      {
        style: styles.retryButton,
        onPress: () => console.log('Restart app - error boundary')
      },
      React.createElement(Text, { style: styles.retryButtonText }, 'Try Again')
    )
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Performance monitoring utilities
 */
export class PerformanceTracker {
  private startTimes = new Map<string, number>();

  startTimer(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  endTimer(
    operationId: string,
    type: PerformanceMetric['type'],
    success: boolean = true,
    details?: Record<string, any>
  ): void {
    const startTime = this.startTimes.get(operationId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.startTimes.delete(operationId);
      
      errorMonitoring.logPerformance(type, duration, success, details);
    }
  }

  async measureAsync<T>(
    operation: () => Promise<T>,
    type: PerformanceMetric['type'],
    details?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      await errorMonitoring.logPerformance(type, duration, success, details);
    }
  }
}

export const performanceTracker = new PerformanceTracker();