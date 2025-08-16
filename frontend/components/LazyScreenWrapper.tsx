import React, { Suspense } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LazyScreenWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  screenName?: string;
}

/**
 * Performance-optimized loading component for lazy-loaded screens
 * Provides consistent loading experience across the Baby Goats app
 */
function DefaultLoadingFallback({ screenName }: { screenName?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#EC1616" />
      <Text style={styles.loadingText}>
        {screenName ? `Loading ${screenName}...` : 'Loading...'}
      </Text>
    </View>
  );
}

/**
 * Wrapper for lazy-loaded screens with optimized loading states
 * Provides consistent UX while code-splitting reduces initial bundle size
 */
export default function LazyScreenWrapper({ 
  children, 
  fallback, 
  screenName 
}: LazyScreenWrapperProps) {
  return (
    <Suspense 
      fallback={fallback || <DefaultLoadingFallback screenName={screenName} />}
    >
      {children}
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

/**
 * Higher-order component for creating lazy-loaded screens
 * Usage: export default withLazyLoading(MyScreen, 'Profile');
 */
export function withLazyLoading<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  screenName: string
) {
  return function LazyLoadedScreen(props: T) {
    return (
      <LazyScreenWrapper screenName={screenName}>
        <Component {...props} />
      </LazyScreenWrapper>
    );
  };
}

/**
 * Preload utility for critical screens
 * Call this to preload screens that user is likely to visit
 */
export function preloadScreen(importFn: () => Promise<any>) {
  // Preload on idle to avoid blocking main thread
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      importFn().catch(console.error);
    });
  } else {
    // Fallback for environments without requestIdleCallback
    setTimeout(() => {
      importFn().catch(console.error);
    }, 100);
  }
}