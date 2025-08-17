import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import LeaderboardCard from '../../components/LeaderboardCard';

interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: 'points' | 'achievements' | 'challenges' | 'streaks';
  scope: 'global' | 'sport' | 'region';
  time_period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  sport_filter?: string;
  topEntries: any[];
}

/**
 * Leaderboards Screen - Rankings & Competition System
 * Shows various leaderboards and user rankings
 */
export default function LeaderboardsScreen() {
  const { user } = useAuth();
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'global' | 'sport'>('all');

  // Load leaderboards
  const loadLeaderboards = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const params = new URLSearchParams({
        ...(selectedFilter === 'sport' && user?.profile?.sport && { sport: user.profile.sport }),
        ...(selectedFilter === 'global' && { scope: 'global' }),
      });

      const response = await fetch(`${backendUrl}/api/leaderboards?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboards');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaderboards(data.leaderboards || []);
      } else {
        throw new Error(data.error || 'Failed to load leaderboards');
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      Alert.alert('Error', 'Failed to load leaderboards');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, user?.profile?.sport]);

  useEffect(() => {
    loadLeaderboards();
  }, [loadLeaderboards]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboards(false);
  };

  const handleViewDetails = (leaderboard: Leaderboard) => {
    // Navigate to detailed leaderboard view (could be implemented as modal or new screen)
    Alert.alert(
      leaderboard.name,
      'Detailed leaderboard view coming soon!\n\nThis will show the full rankings with more stats and filtering options.',
      [{ text: 'OK' }]
    );
  };

  const filterButtons = [
    { key: 'all', label: 'All Leaderboards' },
    { key: 'global', label: 'Global Rankings' },
    { key: 'sport', label: `My Sport${user?.profile?.sport ? ` (${user.profile.sport})` : ''}` },
  ];

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.activeFilterButtonText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={styles.emptyTitle}>No leaderboards available</Text>
      <Text style={styles.emptyDescription}>
        Leaderboards will appear here as athletes complete challenges and earn achievements.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/challenges')}
      >
        <Text style={styles.emptyButtonText}>Complete Challenges</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <Text style={styles.statsTitle}>🌟 Your Competitive Journey</Text>
      <Text style={styles.statsDescription}>
        See how you rank among elite young athletes worldwide
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboards</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading leaderboards...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#EC1616']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {leaderboards.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {renderStatsHeader()}
                
                {leaderboards.map((leaderboard) => (
                  <LeaderboardCard
                    key={leaderboard.id}
                    leaderboard={leaderboard}
                    onViewDetails={handleViewDetails}
                    maxEntries={5}
                  />
                ))}

                {/* Competitive Motivation */}
                <View style={styles.motivationCard}>
                  <Text style={styles.motivationEmoji}>💪</Text>
                  <Text style={styles.motivationTitle}>Keep Climbing!</Text>
                  <Text style={styles.motivationText}>
                    Complete challenges, unlock achievements, and connect with friends to climb the leaderboards.
                  </Text>
                  <View style={styles.motivationButtons}>
                    <TouchableOpacity 
                      style={styles.motivationButton}
                      onPress={() => router.push('/challenges')}
                    >
                      <Text style={styles.motivationButtonText}>Take Challenges</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.motivationButton, styles.secondaryButton]}
                      onPress={() => router.push('/social/friends')}
                    >
                      <Text style={[styles.motivationButtonText, styles.secondaryButtonText]}>
                        Find Friends
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
    borderColor: '#EC1616',
  },
  filterButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#EC1616',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
  emptyButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  motivationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  motivationTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  motivationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  motivationButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EC1616',
  },
  motivationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#EC1616',
  },
});