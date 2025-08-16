import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityFeedItem, useActivityFeed } from '../../lib/socialSystem';
import Avatar from '../../components/Avatar';

interface ActivityFeedScreenProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

/**
 * Social Activity Feed Screen for Baby Goats
 * Shows real-time updates from friends and followed athletes
 */
export default function ActivityFeedScreen({ onBack, onViewProfile }: ActivityFeedScreenProps) {
  const { user } = useAuth();
  const { activities, loading, refetch } = useActivityFeed(user?.id || '');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'achievement_unlocked': return '🏆';
      case 'goal_completed': return '🎯';
      case 'new_photo': return '📸';
      case 'milestone_reached': return '🎉';
      case 'friend_added': return '👥';
      case 'challenge_completed': return '💪';
      default: return '⭐';
    }
  };

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'achievement_unlocked': return '#FFD700';
      case 'goal_completed': return '#4CAF50';
      case 'new_photo': return '#2196F3';
      case 'milestone_reached': return '#FF4081';
      case 'friend_added': return '#9C27B0';
      case 'challenge_completed': return '#FF5722';
      default: return '#666666';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderActivityItem = (activity: ActivityFeedItem) => {
    const profile = activity.userProfile;
    if (!profile) return null;

    const isOwnActivity = profile.id === user?.id;

    return (
      <View key={activity.id} style={styles.activityItem}>
        <TouchableOpacity onPress={() => onViewProfile?.(profile.id)}>
          <Avatar 
            uri={profile.avatar_url} 
            size={48} 
            style={styles.activityAvatar}
          />
        </TouchableOpacity>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <TouchableOpacity onPress={() => onViewProfile?.(profile.id)}>
              <Text style={styles.activityUsername}>
                {isOwnActivity ? 'You' : profile.displayName}
              </Text>
            </TouchableOpacity>
            <Text style={styles.activityTime}>
              {formatTimeAgo(activity.createdAt)}
            </Text>
          </View>

          <View style={styles.activityBody}>
            <View 
              style={[
                styles.activityIconContainer, 
                { backgroundColor: getActivityColor(activity.type) + '20' }
              ]}
            >
              <Text style={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </Text>
            </View>

            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
            </View>
          </View>

          {/* Activity Image */}
          {activity.imageUrl && (
            <View style={styles.activityImageContainer}>
              <Image 
                source={{ uri: activity.imageUrl }} 
                style={styles.activityImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Activity Metadata */}
          {activity.metadata && (
            <View style={styles.activityMetadata}>
              {activity.metadata.goalTitle && (
                <Text style={styles.metadataText}>
                  Goal: {activity.metadata.goalTitle}
                </Text>
              )}
              {activity.metadata.achievementType && (
                <Text style={styles.metadataText}>
                  Type: {activity.metadata.achievementType}
                </Text>
              )}
              {activity.metadata.progress && (
                <Text style={styles.metadataText}>
                  Progress: {activity.metadata.progress}%
                </Text>
              )}
            </View>
          )}

          {/* Reactions */}
          <View style={styles.activityActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>👏</Text>
              <Text style={styles.actionText}>Celebrate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💪</Text>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>
                Comment {activity.commentsCount > 0 && `(${activity.commentsCount})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Show existing reactions */}
          {activity.reactions && activity.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              <Text style={styles.reactionsText}>
                {activity.reactions.length} athlete{activity.reactions.length !== 1 ? 's' : ''} celebrated this
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity feed...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Activity Feed</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Feed Content */}
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📢</Text>
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptyDescription}>
              Add friends and follow other athletes to see their achievements, goals, and updates here!
            </Text>
            <TouchableOpacity style={styles.findFriendsButton}>
              <Text style={styles.findFriendsButtonText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            style={styles.feedScroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.feedContainer}>
              {/* Welcome Message */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Welcome to your feed! 🎉</Text>
                <Text style={styles.welcomeText}>
                  See what your friends are achieving and celebrate their successes together!
                </Text>
              </View>

              {/* Activity Items */}
              {activities.map(renderActivityItem)}

              {/* Load More */}
              <TouchableOpacity style={styles.loadMoreButton}>
                <Text style={styles.loadMoreText}>Load More Activities</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Safety Reminder */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyText}>
            🛡️ Be positive and supportive! All activity is monitored to keep our community safe.
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  findFriendsButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  findFriendsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedScroll: {
    flex: 1,
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeCard: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(236, 22, 22, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeTitle: {
    color: '#EC1616',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  activityAvatar: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: '#999999',
    fontSize: 12,
  },
  activityBody: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescription: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },
  activityImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activityImage: {
    width: '100%',
    height: 200,
  },
  activityMetadata: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  metadataText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 2,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  reactionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reactionsText: {
    color: '#999999',
    fontSize: 11,
    fontStyle: 'italic',
  },
  loadMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  safetyNotice: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  safetyText: {
    color: '#4CAF50',
    fontSize: 12,
    textAlign: 'center',
  },
});