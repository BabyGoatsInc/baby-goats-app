import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { socialSystem, AthleteProfile, FriendConnection } from '../../lib/socialSystem';
import { ErrorBoundary } from '../../lib/errorMonitoring';
import Avatar from '../../components/Avatar';

const { width } = Dimensions.get('window');

interface SocialProfileScreenProps {
  userId?: string; // If not provided, shows current user's profile
  onBack?: () => void;
}

/**
 * Enhanced Social Profile Screen for Baby Goats
 * Shows athlete profiles with social features, achievements, and interaction options
 */
export default function SocialProfileScreen({ userId, onBack }: SocialProfileScreenProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<FriendConnection | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const targetUserId = userId || user?.id;
  const isOwnProfile = targetUserId === user?.id;

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      
      // Load athlete profile
      const athleteProfile = await socialSystem.getAthleteProfile(targetUserId, user?.id);
      setProfile(athleteProfile);

      if (!isOwnProfile) {
        // Check friendship status
        const friends = await socialSystem.getFriends(user?.id || '');
        const friendConnection = friends.find(f => 
          (f.userId === targetUserId || f.friendId === targetUserId)
        );
        setFriendship(friendConnection || null);

        // Check follow status (mock for now)
        setIsFollowing(false);
      }

    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user?.id || !targetUserId) return;

    try {
      setActionLoading(true);
      const result = await socialSystem.sendFriendRequest(user.id, targetUserId);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadProfile(); // Reload to update friendship status
      } else {
        Alert.alert('Unable to Send Request', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.id || !targetUserId) return;

    try {
      setActionLoading(true);
      const result = await socialSystem.followAthlete(user.id, targetUserId);
      
      if (result.success) {
        setIsFollowing(true);
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to follow athlete');
    } finally {
      setActionLoading(false);
    }
  };

  const getFriendshipButtonConfig = () => {
    if (friendship?.status === 'accepted') {
      return {
        text: '👥 Friends',
        style: styles.friendsButton,
        textStyle: styles.friendsButtonText,
        onPress: () => Alert.alert('Friends', 'You are friends with this athlete!'),
      };
    } else if (friendship?.status === 'pending') {
      return {
        text: '⏳ Request Sent',
        style: styles.pendingButton,
        textStyle: styles.pendingButtonText,
        onPress: () => Alert.alert('Pending', 'Friend request is pending'),
      };
    } else {
      return {
        text: '+ Add Friend',
        style: styles.addFriendButton,
        textStyle: styles.addFriendButtonText,
        onPress: handleSendFriendRequest,
      };
    }
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#9C27B0';
      case 'elite': return '#FFD700';
      default: return '#666666';
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading athlete profile...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.loadingContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Go Back</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Avatar 
              uri={profile.avatar_url} 
              size={120} 
              style={styles.profileImage}
            />
            
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.displayName}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              
              {/* Sport and Experience Badge */}
              <View style={styles.sportContainer}>
                <LinearGradient
                  colors={[getExperienceBadgeColor(profile.experience_level), 
                          getExperienceBadgeColor(profile.experience_level) + '80']}
                  style={styles.sportBadge}
                >
                  <Text style={styles.sportText}>
                    {profile.sport} • {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
                  </Text>
                </LinearGradient>
              </View>

              {/* Age and Join Date */}
              <View style={styles.metaInfo}>
                {profile.age && (
                  <Text style={styles.metaText}>Age {profile.age}</Text>
                )}
                <Text style={styles.metaText}>Joined {formatJoinDate(profile.joinedAt)}</Text>
              </View>

              {/* Bio */}
              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={getFriendshipButtonConfig().style}
                onPress={getFriendshipButtonConfig().onPress}
                disabled={actionLoading}
              >
                <Text style={getFriendshipButtonConfig().textStyle}>
                  {getFriendshipButtonConfig().text}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollowToggle}
                disabled={actionLoading}
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Section */}
          {profile.stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Athlete Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.stats.goalsCompleted}</Text>
                  <Text style={styles.statLabel}>Goals Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.stats.totalAchievements}</Text>
                  <Text style={styles.statLabel}>Achievements</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.stats.currentStreak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.stats.friendsCount}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
              </View>
            </View>
          )}

          {/* Badges Section */}
          {profile.badges && profile.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.badgesContainer}>
                {profile.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeIcon}>🏆</Text>
                    <Text style={styles.badgeText}>{badge.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent Achievements */}
          {profile.recentAchievements && profile.recentAchievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionTitle}>Recent Achievements</Text>
              {profile.recentAchievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Text style={styles.achievementEmoji}>🎯</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Privacy Notice for Young Athletes */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyText}>
              🛡️ This is a safe space for young athletes. All interactions are monitored to ensure a positive environment.
            </Text>
          </View>
        </ScrollView>
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
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
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
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileImage: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#EC1616',
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    color: '#CCCCCC',
    fontSize: 16,
    marginBottom: 12,
  },
  sportContainer: {
    marginBottom: 12,
  },
  sportBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sportText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaText: {
    color: '#999999',
    fontSize: 14,
    marginHorizontal: 8,
  },
  bio: {
    color: '#DDDDDD',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  addFriendButton: {
    flex: 1,
    backgroundColor: '#EC1616',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  friendsButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  pendingButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#666666',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderColor: '#2196F3',
  },
  followingButtonText: {
    color: '#2196F3',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    color: '#EC1616',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  badgesSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(236, 22, 22, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
  achievementDate: {
    color: '#999999',
    fontSize: 12,
  },
  privacyNotice: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  privacyText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
});