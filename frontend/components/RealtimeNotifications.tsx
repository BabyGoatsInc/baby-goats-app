import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { realtimeManager, Notification } from '../lib/realtime';

interface RealtimeNotificationsProps {
  onNotificationPress?: (notification: Notification) => void;
  maxVisible?: number;
}

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onDismiss: (notification: Notification) => void;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onPress, 
  onDismiss, 
  index 
}) => {
  const slideAnim = new Animated.Value(-300);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 8 seconds for some types
    if (notification.type === 'achievement' || notification.type === 'challenge') {
      setTimeout(() => {
        handleDismiss();
      }, 8000);
    }
  }, []);

  const handleDismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification);
    });
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'friend_request':
        return '👥';
      case 'friend_accept':
        return '🎉';
      case 'message':
        return '💬';
      case 'achievement':
        return '🏆';
      case 'challenge':
        return '⚡';
      default:
        return '📢';
    }
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'friend_request':
      case 'friend_accept':
        return styles.socialNotification;
      case 'message':
        return styles.messageNotification;
      case 'achievement':
        return styles.achievementNotification;
      case 'challenge':
        return styles.challengeNotification;
      default:
        return styles.defaultNotification;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <Animated.View 
      style={[
        styles.notificationContainer,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.notification, getNotificationStyle()]}
        onPress={() => onPress(notification)}
        activeOpacity={0.8}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationIcon}>{getNotificationIcon()}</Text>
            <View style={styles.notificationTexts}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>
            <Text style={styles.notificationTime}>
              {formatTime(notification.created_at)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.dismissButton} 
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RealtimeNotifications({ 
  onNotificationPress,
  maxVisible = 5 
}: RealtimeNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Initialize real-time manager
    realtimeManager.initialize(user.id);

    // Subscribe to real-time notifications
    const unsubscribe = realtimeManager.onNotification((notification) => {
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        
        // Add new notification at the beginning
        const newNotifications = [notification, ...prev];
        
        // Keep only maxVisible notifications
        return newNotifications.slice(0, maxVisible);
      });

      // Show alert for important notifications
      if (notification.type === 'friend_request') {
        Alert.alert(
          'New Friend Request! 👥',
          `${notification.message}`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'View', onPress: () => onNotificationPress?.(notification) },
          ]
        );
      }
    });

    return () => {
      unsubscribe();
      realtimeManager.cleanup();
    };
  }, [user?.id]);

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark notification as read
      await markAsRead(notification);
      
      // Handle different notification types
      if (onNotificationPress) {
        onNotificationPress(notification);
      } else {
        handleDefaultAction(notification);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleDefaultAction = (notification: Notification) => {
    switch (notification.type) {
      case 'friend_request':
        Alert.alert(
          'Friend Request',
          `${notification.message}\n\nGo to Friends screen to accept or decline.`,
          [{ text: 'OK' }]
        );
        break;
      case 'message':
        Alert.alert(
          'New Message',
          `${notification.message}\n\nTap to open conversation.`,
          [{ text: 'OK' }]
        );
        break;
      case 'achievement':
        Alert.alert(
          '🏆 Achievement Unlocked!',
          notification.message,
          [{ text: 'Awesome!' }]
        );
        break;
      default:
        Alert.alert(notification.title, notification.message);
    }
  };

  const markAsRead = async (notification: Notification) => {
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // TODO: Update in database
    console.log('Marking notification as read:', notification.id);
  };

  const handleDismiss = (notification: Notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  // Demo function to simulate notifications (for testing)
  const triggerDemoNotification = () => {
    const demoNotifications = [
      {
        id: `demo-${Date.now()}`,
        user_id: user?.id || '',
        type: 'achievement' as const,
        title: '🏆 Achievement Unlocked!',
        message: 'You completed your first weekly challenge!',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `demo-${Date.now() + 1}`,
        user_id: user?.id || '',
        type: 'friend_request' as const,
        title: '👥 New Friend Request',
        message: 'Sarah wants to connect with you!',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `demo-${Date.now() + 2}`,
        user_id: user?.id || '',
        type: 'message' as const,
        title: '💬 New Message',
        message: 'Alex: "Great workout today! Keep it up 💪"',
        read: false,
        created_at: new Date().toISOString(),
      },
    ];

    const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
    setNotifications(prev => [randomNotification, ...prev.slice(0, maxVisible - 1)]);
  };

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity onPress={triggerDemoNotification} style={styles.demoButton}>
          <Text style={styles.demoButtonText}>🔔 Test Notification</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onDismiss={handleDismiss}
            index={index}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.notificationsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    maxHeight: 400,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  demoButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  notificationsList: {
    flex: 1,
  },
  notificationContainer: {
    marginBottom: 8,
  },
  notification: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    elevation: 5,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
  socialNotification: {
    backgroundColor: '#1E3A8A',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  messageNotification: {
    backgroundColor: '#166534',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  achievementNotification: {
    backgroundColor: '#92400E',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  challengeNotification: {
    backgroundColor: '#7C2D12',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  defaultNotification: {
    backgroundColor: '#374151',
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationTexts: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationMessage: {
    color: '#E5E5E5',
    fontSize: 12,
    lineHeight: 16,
  },
  notificationTime: {
    color: '#A3A3A3',
    fontSize: 10,
    marginTop: 2,
  },
  dismissButton: {
    paddingLeft: 8,
    justifyContent: 'flex-start',
  },
  dismissButtonText: {
    color: '#A3A3A3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});