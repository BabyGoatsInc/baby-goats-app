import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  previous_rank?: number;
  rank_change: number;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    sport?: string;
    grad_year?: number;
  };
}

interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: 'points' | 'achievements' | 'challenges' | 'streaks';
  scope: 'global' | 'sport' | 'region';
  time_period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  sport_filter?: string;
  entries: LeaderboardEntry[];
}

interface UserPosition {
  rank: number;
  score: number;
  rank_change: number;
}

interface LeaderboardCardProps {
  leaderboard: Leaderboard;
  showFullList?: boolean;
  onViewDetails?: (leaderboard: Leaderboard) => void;
  maxEntries?: number;
}

export default function LeaderboardCard({ 
  leaderboard, 
  showFullList = false, 
  onViewDetails,
  maxEntries = 5 
}: LeaderboardCardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const params = new URLSearchParams({
        id: leaderboard.id,
        limit: showFullList ? '100' : maxEntries.toString(),
        ...(user?.id && { user_id: user.id })
      });

      const response = await fetch(`${backendUrl}/api/leaderboards?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.leaderboard?.entries || []);
        setUserPosition(data.userPosition);
      } else {
        throw new Error(data.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Use provided entries if available, otherwise load from API
    if (leaderboard.entries && leaderboard.entries.length > 0) {
      setEntries(leaderboard.entries.slice(0, maxEntries));
    } else {
      loadLeaderboardData();
    }
  }, [leaderboard.id, showFullList, maxEntries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'points': return '🏆';
      case 'achievements': return '🎖️';
      case 'challenges': return '💪';
      case 'streaks': return '🔥';
      default: return '📊';
    }
  };

  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'all_time': return 'All Time';
      default: return period;
    }
  };

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange > 0) return '📈';
    if (rankChange < 0) return '📉';
    return '➖';
  };

  const getRankChangeColor = (rankChange: number) => {
    if (rankChange > 0) return '#4CAF50';
    if (rankChange < 0) return '#F44336';
    return '#999999';
  };

  const formatScore = (score: number, type: string) => {
    switch (type) {
      case 'points':
        return `${score.toLocaleString()} pts`;
      case 'achievements':
        return `${score} achievements`;
      case 'challenges':
        return `${score} challenges`;
      case 'streaks':
        return `${score} day streak`;
      default:
        return score.toString();
    }
  };

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[
      styles.entryRow,
      item.user.id === user?.id && styles.userEntryRow
    ]}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText,
          item.user.id === user?.id && styles.userRankText,
          item.rank <= 3 && styles.topRankText
        ]}>
          #{item.rank}
        </Text>
        
        {item.rank_change !== 0 && (
          <View style={styles.rankChangeContainer}>
            <Text style={[
              styles.rankChangeText,
              { color: getRankChangeColor(item.rank_change) }
            ]}>
              {getRankChangeIcon(item.rank_change)}
            </Text>
          </View>
        )}
      </View>

      {/* User Info */}
      <Avatar 
        uri={item.user.avatar_url} 
        size={40} 
        name={item.user.full_name}
      />
      
      <View style={styles.userInfo}>
        <Text style={[
          styles.userName,
          item.user.id === user?.id && styles.userNameHighlight
        ]} numberOfLines={1}>
          {item.user.full_name}
          {item.user.id === user?.id && ' (You)'}
        </Text>
        
        {item.user.sport && (
          <Text style={styles.userSport}>
            {item.user.sport}
            {item.user.grad_year && ` • Class of ${item.user.grad_year}`}
          </Text>
        )}
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          item.user.id === user?.id && styles.userScoreText
        ]}>
          {formatScore(item.score, leaderboard.type)}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(leaderboard.type)}</Text>
          <View>
            <Text style={styles.leaderboardTitle} numberOfLines={1}>
              {leaderboard.name}
            </Text>
            <Text style={styles.timePeriod}>
              {getTimePeriodLabel(leaderboard.time_period)}
            </Text>
          </View>
        </View>

        {!showFullList && onViewDetails && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => onViewDetails(leaderboard)}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {leaderboard.description && (
        <Text style={styles.description} numberOfLines={2}>
          {leaderboard.description}
        </Text>
      )}

      {/* User Position (if not in visible list) */}
      {userPosition && userPosition.rank > maxEntries && !showFullList && (
        <View style={styles.userPositionCard}>
          <Text style={styles.userPositionText}>
            Your Position: #{userPosition.rank} • {formatScore(userPosition.score, leaderboard.type)}
          </Text>
          {userPosition.rank_change !== 0 && (
            <Text style={[
              styles.userPositionChange,
              { color: getRankChangeColor(userPosition.rank_change) }
            ]}>
              {getRankChangeIcon(userPosition.rank_change)} {Math.abs(userPosition.rank_change)} spots
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📊</Text>
      <Text style={styles.emptyText}>No rankings yet</Text>
      <Text style={styles.emptySubtext}>
        Complete challenges and earn achievements to appear on the leaderboard!
      </Text>
    </View>
  );

  return (
    <LinearGradient 
      colors={['rgba(236, 22, 22, 0.1)', 'rgba(0, 0, 0, 0.3)']}
      style={styles.container}
    >
      {renderHeader()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : entries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          scrollEnabled={showFullList}
          nestedScrollEnabled={showFullList}
          refreshControl={
            showFullList ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#EC1616']}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  leaderboardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timePeriod: {
    color: '#EC1616',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  viewAllButton: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EC1616',
  },
  viewAllText: {
    color: '#EC1616',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  userPositionCard: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderWidth: 1,
    borderColor: '#EC1616',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  userPositionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  userPositionChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userEntryRow: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(236, 22, 22, 0.3)',
  },
  rankContainer: {
    minWidth: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRankText: {
    color: '#EC1616',
  },
  topRankText: {
    color: '#FFD700',
  },
  rankChangeContainer: {
    marginTop: 2,
  },
  rankChangeText: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userNameHighlight: {
    color: '#EC1616',
  },
  userSport: {
    color: '#999999',
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userScoreText: {
    color: '#EC1616',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
});