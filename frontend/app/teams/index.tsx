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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import TeamCard from '../../components/TeamCard';
import TeamChallengeCard from '../../components/TeamChallengeCard';

/**
 * Teams Screen - Group Challenges & Team Competitions
 * Main hub for team management and team challenges
 */
export default function TeamsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_teams' | 'discover' | 'challenges'>('my_teams');
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [publicTeams, setPublicTeams] = useState<any[]>([]);
  const [teamChallenges, setTeamChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data based on active tab
  const loadData = useCallback(async (showLoading = true) => {
    if (!user?.id) return;

    try {
      if (showLoading) setLoading(true);

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';

      if (activeTab === 'my_teams') {
        // Load user's teams
        const response = await fetch(`${backendUrl}/api/teams?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
        }
      } else if (activeTab === 'discover') {
        // Load public teams
        const params = new URLSearchParams({
          limit: '20',
          ...(searchQuery && { search: searchQuery })
        });
        
        const response = await fetch(`${backendUrl}/api/teams?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPublicTeams(data.teams || []);
        }
      } else if (activeTab === 'challenges') {
        // Load team challenges
        const params = new URLSearchParams({
          status: 'active',
          limit: '20',
          ...(user.id && { user_id: user.id })
        });
        
        const response = await fetch(`${backendUrl}/api/team-challenges?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTeamChallenges(data.challenges || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const handleTeamPress = (team: any) => {
    // Navigate to team details
    Alert.alert(
      team.name,
      `Team Details:\n\n${team.description || 'A competitive team focused on excellence.'}\n\nMembers: ${team.statistics?.total_members || 0}\nPoints: ${team.statistics?.total_points || 0}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => console.log('Navigate to team details') }
      ]
    );
  };

  const handleJoinTeam = async (team: any) => {
    Alert.alert(
      'Join Team',
      `Do you want to join "${team.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async () => {
            try {
              const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
              const response = await fetch(`${backendUrl}/api/team-members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  team_id: team.id,
                  user_id: user?.id
                })
              });

              if (response.ok) {
                const data = await response.json();
                Alert.alert('Success', data.message);
                loadData(false); // Refresh data
              } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to join team');
              }
            } catch (error) {
              console.error('Error joining team:', error);
              Alert.alert('Error', 'Failed to join team');
            }
          }
        }
      ]
    );
  };

  const handleCreateTeam = () => {
    Alert.alert(
      'Create Team',
      'Team creation feature coming soon!\n\nThis will allow you to:\n• Create your own team\n• Invite friends to join\n• Set team goals and challenges\n• Compete with other teams',
      [{ text: 'OK' }]
    );
  };

  const handleChallengePress = (challenge: any) => {
    Alert.alert(
      challenge.title,
      `${challenge.description}\n\nTarget: ${challenge.target_value} ${challenge.target_metric}\nReward: ${challenge.team_points_reward} team points\nDuration: ${challenge.duration_days} days`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => console.log('Navigate to challenge details') }
      ]
    );
  };

  const handleRegisterForChallenge = (challenge: any) => {
    if (userTeams.length === 0) {
      Alert.alert(
        'No Teams',
        'You need to join or create a team before you can register for team challenges.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Find Teams', onPress: () => setActiveTab('discover') }
        ]
      );
      return;
    }

    if (userTeams.length === 1) {
      // Auto-select the only team
      registerTeamForChallenge(userTeams[0].team.id, challenge);
    } else {
      // Show team selection
      Alert.alert(
        'Select Team',
        'Choose which team to register for this challenge:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...userTeams.slice(0, 3).map((membership) => ({
            text: membership.team.name,
            onPress: () => registerTeamForChallenge(membership.team.id, challenge)
          }))
        ]
      );
    }
  };

  const registerTeamForChallenge = async (teamId: string, challenge: any) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/team-challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          team_challenge_id: challenge.id,
          team_id: teamId,
          user_id: user?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success!', data.message);
        loadData(false); // Refresh challenges
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to register for challenge');
      }
    } catch (error) {
      console.error('Error registering for challenge:', error);
      Alert.alert('Error', 'Failed to register for challenge');
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my_teams' && styles.activeTabButton]}
          onPress={() => setActiveTab('my_teams')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'my_teams' && styles.activeTabButtonText]}>
            My Teams
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'discover' && styles.activeTabButton]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'discover' && styles.activeTabButtonText]}>
            Discover Teams
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'challenges' && styles.activeTabButton]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'challenges' && styles.activeTabButtonText]}>
            Team Challenges
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderMyTeams = () => (
    <ScrollView
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Teams ({userTeams.length})</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
          <Text style={styles.createButtonText}>+ Create Team</Text>
        </TouchableOpacity>
      </View>

      {userTeams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No Teams Yet</Text>
          <Text style={styles.emptyDescription}>
            Join or create a team to start competing with friends and taking on group challenges!
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setActiveTab('discover')}>
            <Text style={styles.emptyButtonText}>Discover Teams</Text>
          </TouchableOpacity>
        </View>
      ) : (
        userTeams.map((membership) => (
          <TeamCard
            key={membership.team.id}
            team={membership.team}
            onPress={handleTeamPress}
          />
        ))
      )}
    </ScrollView>
  );

  const renderDiscoverTeams = () => (
    <ScrollView
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Public Teams</Text>
        <Text style={styles.sectionSubtitle}>
          {publicTeams.length} teams available
        </Text>
      </View>

      {publicTeams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No Teams Found</Text>
          <Text style={styles.emptyDescription}>
            Try adjusting your search or check back later for new teams.
          </Text>
        </View>
      ) : (
        publicTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onPress={handleTeamPress}
            showJoinButton={true}
            onJoin={handleJoinTeam}
          />
        ))
      )}
    </ScrollView>
  );

  const renderTeamChallenges = () => (
    <ScrollView
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Team Challenges</Text>
        <Text style={styles.sectionSubtitle}>
          {teamChallenges.length} active challenges
        </Text>
      </View>

      {teamChallenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>No Active Challenges</Text>
          <Text style={styles.emptyDescription}>
            Team challenges will appear here when available. Check back soon!
          </Text>
        </View>
      ) : (
        teamChallenges.map((challenge) => (
          <TeamChallengeCard
            key={challenge.id}
            challenge={challenge}
            participation={challenge.user_team_participations?.[0]}
            onPress={handleChallengePress}
            onRegister={handleRegisterForChallenge}
            showRegisterButton={!challenge.user_team_participations?.length}
          />
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Hub</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        {renderTabButtons()}

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'my_teams' && renderMyTeams()}
            {activeTab === 'discover' && renderDiscoverTeams()}
            {activeTab === 'challenges' && renderTeamChallenges()}
          </>
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
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
    borderColor: '#EC1616',
  },
  tabButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
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
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  createButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    backgroundColor: '#EC1616',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
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
});