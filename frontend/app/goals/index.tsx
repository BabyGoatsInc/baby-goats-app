import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import CharacterPillar from '../../components/CharacterPillar';
import ProgressChart from '../../components/ProgressChart';
import { 
  ProgressMetrics, 
  CharacterPillar as PillarType, 
  CHARACTER_PILLARS_CONFIG,
  ELITE_GOALS,
  calculateProgressPercentage 
} from '../../lib/goals';

interface GoalsTrackerProps {
  onBack?: () => void;
}

export default function GoalsTracker({ onBack }: GoalsTrackerProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock progress data for demonstration
  const mockProgressMetrics: ProgressMetrics = {
    total_goals_set: 9,
    total_goals_completed: 4,
    current_active_goals: 5,
    overall_completion_rate: 44,
    current_streak: 7,
    best_streak: 14,
    total_days_active: 23,
    average_completion_time: 12,
    character_pillars: [
      {
        name: 'resilient',
        display_name: 'RESILIENT',
        description: 'Mental toughness and bounce-back ability',
        color: '#4ECDC4',
        icon: '🛡️',
        total_goals: 3,
        completed_goals: 2,
        current_streak: 5,
        best_streak: 8,
        progress_percentage: 67,
      },
      {
        name: 'relentless',
        display_name: 'RELENTLESS',
        description: 'Unstoppable dedication and consistency',
        color: '#FF6B6B',
        icon: '⚡',
        total_goals: 3,
        completed_goals: 1,
        current_streak: 3,
        best_streak: 7,
        progress_percentage: 33,
      },
      {
        name: 'fearless',
        display_name: 'FEARLESS',
        description: 'Courage to push beyond comfort zones',
        color: '#FFE66D',
        icon: '🦁',
        total_goals: 3,
        completed_goals: 1,
        current_streak: 2,
        best_streak: 5,
        progress_percentage: 33,
      },
    ],
    recent_achievements: [
      {
        id: '1',
        title: 'Streak Master',
        description: 'Completed 7 days in a row',
        category: 'streak',
        icon: '🔥',
        earned_date: new Date().toISOString(),
        points_awarded: 50,
      },
      {
        id: '2', 
        title: 'Resilient Champion',
        description: 'Completed 2 resilient goals',
        category: 'pillar',
        icon: '🛡️',
        earned_date: new Date().toISOString(),
        points_awarded: 100,
      },
    ],
  };

  // Chart data for progress visualization
  const weeklyProgressData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [2, 3, 2, 4, 3, 5, 4],
      color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  const pillarProgressData = {
    labels: ['Resilient', 'Relentless', 'Fearless'],
    data: [0.67, 0.33, 0.33],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.userSection}>
            <Avatar
              imageUrl={user?.profile?.avatar_url}
              name={user?.profile?.full_name || user?.email}
              size="medium"
            />
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Progress Dashboard</Text>
              <Text style={styles.userName}>
                {user?.profile?.full_name || 'Elite Athlete'}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Overview Stats */}
          <View style={styles.statsOverview}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mockProgressMetrics.current_streak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mockProgressMetrics.total_goals_completed}</Text>
                <Text style={styles.statLabel}>Goals Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mockProgressMetrics.overall_completion_rate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{mockProgressMetrics.best_streak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>
          </View>

          {/* Character Development Pillars */}
          <View style={styles.pillarsSection}>
            <Text style={styles.sectionTitle}>Character Development</Text>
            
            {mockProgressMetrics.character_pillars.map((pillar) => (
              <CharacterPillar
                key={pillar.name}
                pillar={pillar}
                onPress={() => {
                  // Navigate to pillar detail screen
                  console.log('Navigate to', pillar.name);
                }}
              />
            ))}
          </View>

          {/* Progress Charts */}
          <View style={styles.chartsSection}>
            <Text style={styles.sectionTitle}>Progress Analytics</Text>
            
            {/* Time Period Selector */}
            <View style={styles.periodSelector}>
              {(['week', 'month', 'year'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ProgressChart
              type="line"
              data={weeklyProgressData}
              title="Daily Progress This Week"
              color="#4ECDC4"
            />

            <ProgressChart
              type="progress"
              data={pillarProgressData}
              title="Character Pillar Balance"
              color="#4ECDC4"
            />
          </View>

          {/* Recent Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            
            {mockProgressMetrics.recent_achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
                <View style={styles.achievementPoints}>
                  <Text style={styles.pointsText}>+{achievement.points_awarded}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  statsOverview: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  pillarsSection: {
    marginBottom: 32,
  },
  chartsSection: {
    marginBottom: 32,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#000000',
  },
  achievementsSection: {
    marginBottom: 40,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
  },
  achievementPoints: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
  },
});