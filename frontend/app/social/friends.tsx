import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  socialSystem, 
  FriendConnection, 
  AthleteProfile,
  useFriends 
} from '../../lib/socialSystem';
import Avatar from '../../components/Avatar';

interface FriendsScreenProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

/**
 * Friends Management Screen for Baby Goats
 * Shows friends list, friend requests, and search for new friends
 */
export default function FriendsScreen({ onBack, onViewProfile }: FriendsScreenProps) {
  const { user } = useAuth();
  const { friends, loading: friendsLoading, refetch: refetchFriends } = useFriends(user?.id || '');
  
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [pendingRequests, setPendingRequests] = useState<FriendConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AthleteProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPendingRequests();
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchQuery.trim() && activeTab === 'search') {
      searchAthletes();
    } else if (!searchQuery.trim()) {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const loadPendingRequests = async () => {
    if (!user?.id) return;

    try {
      const requests = await socialSystem.getPendingFriendRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    }
  };

  const searchAthletes = async () => {
    if (!user?.id || !searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await socialSystem.searchAthletes(searchQuery.trim(), user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search athletes');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      const result = await socialSystem.acceptFriendRequest(requestId, user.id);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadPendingRequests();
        refetchFriends();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleSendFriendRequest = async (toUserId: string) => {
    if (!user?.id) return;

    try {
      const result = await socialSystem.sendFriendRequest(user.id, toUserId);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh search results to update button states
        await searchAthletes();
      } else {
        Alert.alert('Unable to Send Request', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      refetchFriends();
      await loadPendingRequests();
    } finally {
      setRefreshing(false);
    }
  };

  const renderFriendItem = (friend: FriendConnection) => {
    const profile = friend.friendProfile;
    if (!profile) return null;

    return (
      <TouchableOpacity
        key={friend.id}
        style={styles.friendItem}
        onPress={() => onViewProfile?.(profile.id)}
      >
        <Avatar uri={profile.avatar_url} size={50} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{profile.displayName}</Text>
          <Text style={styles.friendMeta}>
            {profile.sport} • {profile.experience_level}
          </Text>
          {profile.stats && (
            <Text style={styles.friendStats}>
              {profile.stats.goalsCompleted} goals • {profile.stats.totalAchievements} achievements
            </Text>
          )}
        </View>
        <View style={styles.friendActions}>
          <Text style={styles.friendsLabel}>Friends</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPendingRequest = (request: FriendConnection) => {
    const profile = request.friendProfile;
    if (!profile) return null;

    return (
      <View key={request.id} style={styles.requestItem}>
        <Avatar uri={profile.avatar_url} size={50} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{profile.displayName}</Text>
          <Text style={styles.friendMeta}>
            {profile.sport} • {profile.experience_level}
          </Text>
          <Text style={styles.requestText}>Wants to be friends</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(request.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchResult = (athlete: AthleteProfile) => {
    return (
      <TouchableOpacity
        key={athlete.id}
        style={styles.searchItem}
        onPress={() => onViewProfile?.(athlete.id)}
      >
        <Avatar uri={athlete.avatar_url} size={50} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{athlete.displayName}</Text>
          <Text style={styles.friendMeta}>
            @{athlete.username} • {athlete.sport}
          </Text>
          {athlete.bio && (
            <Text style={styles.searchBio} numberOfLines={2}>
              {athlete.bio}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => handleSendFriendRequest(athlete.id)}
        >
          <Text style={styles.addFriendButtonText}>+ Add</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        if (friendsLoading) {
          return (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          );
        }

        if (friends.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyDescription}>
                Search for other young athletes to connect with and start building your network!
              </Text>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setActiveTab('search')}
              >
                <Text style={styles.searchButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {friends.map(renderFriendItem)}
          </ScrollView>
        );

      case 'requests':
        if (pendingRequests.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📬</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyDescription}>
                You don't have any friend requests at the moment.
              </Text>
            </View>
          );
        }

        return (
          <ScrollView>
            {pendingRequests.map(renderPendingRequest)}
          </ScrollView>
        );

      case 'search':
        return (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for athletes..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView>
                {searchResults.map(renderSearchResult)}
              </ScrollView>
            ) : searchQuery.trim().length > 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyDescription}>
                  Try searching with different keywords or sport names.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Search for friends</Text>
                <Text style={styles.emptyDescription}>
                  Enter a name, username, or sport to find other young athletes to connect with.
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

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
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends {friends.length > 0 && `(${friends.length})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyText}>
            🛡️ Remember: Only add people you know or trust. All friend activity is monitored for safety.
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EC1616',
  },
  tabText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  searchButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendMeta: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 2,
  },
  friendStats: {
    color: '#999999',
    fontSize: 12,
  },
  friendActions: {
    alignItems: 'center',
  },
  friendsLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestText: {
    color: '#EC1616',
    fontSize: 12,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchBio: {
    color: '#999999',
    fontSize: 12,
    marginTop: 4,
  },
  addFriendButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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