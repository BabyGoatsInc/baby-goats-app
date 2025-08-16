import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNetworkState, useOfflineStatus } from '../lib/offlineManager';
import { offlineDataLayer } from '../lib/offlineDataLayer';

const { width } = Dimensions.get('window');

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
}

/**
 * Offline Status Indicator for Baby Goats App
 * Shows network status, sync progress, and pending changes
 */
export default function OfflineIndicator({ 
  showDetails = false, 
  position = 'top' 
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, networkType } = useOfflineStatus();
  const [syncStatus, setSyncStatus] = useState(offlineDataLayer.getSyncStatus());
  const [offlineStats, setOfflineStats] = useState(offlineDataLayer.getOfflineStats());
  const [showFullIndicator, setShowFullIndicator] = useState(false);
  
  const slideAnim = new Animated.Value(position === 'top' ? -100 : 100);
  const opacityAnim = new Animated.Value(0);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(offlineDataLayer.getSyncStatus());
      setOfflineStats(offlineDataLayer.getOfflineStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Show/hide indicator based on network status
  useEffect(() => {
    const shouldShow = isOffline || syncStatus.pendingChanges > 0 || syncStatus.syncInProgress;
    
    if (shouldShow) {
      setShowFullIndicator(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: position === 'top' ? -100 : 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowFullIndicator(false);
      });
    }
  }, [isOffline, syncStatus.pendingChanges, syncStatus.syncInProgress, position]);

  const handleSync = async () => {
    if (!syncStatus.syncInProgress && isOnline) {
      try {
        await offlineDataLayer.forceSync();
        setSyncStatus(offlineDataLayer.getSyncStatus());
      } catch (error) {
        console.error('Manual sync failed:', error);
      }
    }
  };

  const getStatusColor = () => {
    if (isOffline) return '#FF6B6B'; // Red for offline
    if (syncStatus.syncInProgress) return '#4ECDC4'; // Teal for syncing
    if (syncStatus.pendingChanges > 0) return '#FFE66D'; // Yellow for pending
    return '#95E1D3'; // Green for online
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline Mode';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending changes`;
    return 'Connected';
  };

  const getNetworkIcon = () => {
    if (isOffline) return '📴';
    if (syncStatus.syncInProgress) return '🔄';
    if (networkType === 'wifi') return '📶';
    if (networkType === 'cellular') return '📱';
    return '🌐';
  };

  if (!showFullIndicator) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { backgroundColor: getStatusColor() },
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.indicatorContent}
        onPress={() => setShowFullIndicator(!showFullIndicator)}
        activeOpacity={0.8}
      >
        <View style={styles.statusRow}>
          <Text style={styles.networkIcon}>{getNetworkIcon()}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          
          {syncStatus.syncInProgress && (
            <ActivityIndicator 
              size="small" 
              color="#000000" 
              style={styles.loadingIndicator}
            />
          )}
          
          {!syncStatus.syncInProgress && syncStatus.pendingChanges > 0 && isOnline && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network:</Text>
              <Text style={styles.detailValue}>
                {isOnline ? `Online (${networkType})` : 'Offline'}
              </Text>
            </View>
            
            {offlineStats.pendingChanges > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pending:</Text>
                <Text style={styles.detailValue}>{offlineStats.pendingChanges} changes</Text>
              </View>
            )}
            
            {syncStatus.lastSync > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last sync:</Text>
                <Text style={styles.detailValue}>
                  {new Date(syncStatus.lastSync).toLocaleTimeString()}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Offline data:</Text>
              <Text style={styles.detailValue}>
                {offlineStats.profiles}p, {offlineStats.achievements}a, {offlineStats.goals}g
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Compact offline badge for navigation bars
 */
export function OfflineBadge() {
  const { isOffline } = useOfflineStatus();
  const [syncStatus] = useState(offlineDataLayer.getSyncStatus());

  if (!isOffline && syncStatus.pendingChanges === 0) {
    return null;
  }

  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>
        {isOffline ? '📴' : syncStatus.pendingChanges > 0 ? `${syncStatus.pendingChanges}` : ''}
      </Text>
    </View>
  );
}

/**
 * Sync progress bar for data synchronization
 */
export function SyncProgressBar({ visible }: { visible: boolean }) {
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topPosition: {
    top: 50, // Below status bar
  },
  bottomPosition: {
    bottom: 50, // Above navigation
  },
  indicatorContent: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  networkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 1.5,
  },
});

/**
 * Higher-order component to add offline awareness to screens
 */
export function withOfflineSupport<T extends Record<string, any>>(
  Component: React.ComponentType<T>
) {
  return function OfflineAwareComponent(props: T) {
    const { isOffline } = useOfflineStatus();
    
    return (
      <View style={{ flex: 1 }}>
        <Component {...props} />
        <OfflineIndicator position="top" />
        {isOffline && (
          <View style={styles.offlineOverlay}>
            <Text style={styles.offlineMessage}>
              You're offline. Changes will sync when connection is restored.
            </Text>
          </View>
        )}
      </View>
    );
  };
}

const overlayStyles = StyleSheet.create({
  offlineOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    padding: 12,
    alignItems: 'center',
  },
  offlineMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// Merge overlay styles
Object.assign(styles, overlayStyles);