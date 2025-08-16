import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { socialSystem, FriendConnection } from '../lib/socialSystem';

const { width: screenWidth } = Dimensions.get('window');

interface SocialNotificationsProps {
  userId?: string;
  onNotificationPress?: (type: string, data: any) => void;
}

interface NotificationItem {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'achievement_celebration';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export default function SocialNotifications({ userId, onNotificationPress }: SocialNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-screenWidth));

  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Check for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    if (notifications.length > 0 && !visible) {
      showNotifications();
    } else if (notifications.length === 0 && visible) {
      hideNotifications();
    }
  }, [notifications.length]);

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      // Load pending friend requests as notifications
      const pendingRequests = await socialSystem.getPendingFriendRequests(userId);
      
      const newNotifications: NotificationItem[] = pendingRequests.map(request => ({
        id: `friend_request_${request.id}`,
        type: 'friend_request' as const,
        title: 'New Friend Request',
        message: `${request.friendProfile?.displayName || 'Someone'} wants to be friends!`,
        timestamp: request.createdAt,
        data: request
      }));

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to load social notifications:', error);
    }
  };

  const showNotifications = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 5 seconds
    setTimeout(() => {
      hideNotifications();
    }, 5000);
  };

  const hideNotifications = () => {
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    onNotificationPress?.(notification.type, notification.data);
    hideNotifications();
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'friend_request': return '👋';
      case 'friend_accepted': return '🤝';
      case 'achievement_celebration': return '🎉';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'friend_request': return '#2196F3';
      case 'friend_accepted': return '#4CAF50';
      case 'achievement_celebration': return '#FF9800';
      default: return '#666666';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }] }
      ]}
    >
      <View style={styles.notificationsContainer}>
        {notifications.slice(0, 3).map((notification, index) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              { borderLeftColor: getNotificationColor(notification.type) }
            ]}
            onPress={() => handleNotificationPress(notification)}
            activeOpacity={0.8}
          >
            <View style={styles.notificationIcon}>
              <Text style={styles.notificationEmoji}>
                {getNotificationIcon(notification.type)}
              </Text>
            </View>
            
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={hideNotifications}
            >
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {notifications.length > 3 && (
          <TouchableOpacity style={styles.moreNotifications}>
            <Text style={styles.moreText}>
              +{notifications.length - 3} more notifications
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationEmoji: {
    fontSize: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    color: '#CCCCCC',
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '300',
  },
  moreNotifications: {
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  moreText: {
    color: '#666666',
    fontSize: 11,
    fontStyle: 'italic',
  },
});