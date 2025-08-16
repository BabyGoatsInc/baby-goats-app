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
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import AchievementBadge from '../../components/AchievementBadge';
import AchievementUnlock from '../../components/AchievementUnlock';
import { 
  ELITE_ACHIEVEMENTS,
  CHARACTER_LEVELS,
  Achievement,
  UserAchievement,
  UserLevel,
  calculateAchievementProgress,
  calculateUserLevel,
  getAchievementsByCategory
} from '../../lib/achievements';

interface AchievementsGalleryProps {
  onBack?: () => void;
}

export default function AchievementsGallery({ onBack }: AchievementsGalleryProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'earned' | 'streak' | 'pillar' | 'milestone'>('all');
  const [showUnlock, setShowUnlock] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Mock user achievements data - in real app this would come from backend
  const mockUserAchievements: UserAchievement[] = [
    {
      id: '1',
      user_id: user?.id || 'demo',
      achievement_id: 'streak_fire_3',
      earned_date: new Date().toISOString(),
      progress_when_earned: 100,
      achievement: ELITE_ACHIEVEMENTS.find(a => a.id === 'streak_fire_3')!,
    },
    {
      id: '2',
      user_id: user?.id || 'demo',
      achievement_id: 'first_goal',
      earned_date: new Date().toISOString(),
      progress_when_earned: 100,
      achievement: ELITE_ACHIEVEMENTS.find(a => a.id === 'first_goal')!,
    },
    {
      id: '3',
      user_id: user?.id || 'demo',
      achievement_id: 'resilient_foundation',
      earned_date: new Date().toISOString(),
      progress_when_earned: 100,
      achievement: ELITE_ACHIEVEMENTS.find(a => a.id === 'resilient_foundation')!,
    },
  ];

  // Mock user stats for progress calculation
  const mockUserStats = {
    streak_count: 5,
    goals_completed: 8,
    pillar_goals: {
      resilient: 6,
      relentless: 1,
      fearless: 1,
    },
    total_points: 375,
    days_active: 12,
    pillar_levels: {
      resilient: 2,
      relentless: 1,
      fearless: 1,
    }
  };

  // Calculate user levels for each pillar
  const userLevels: Record<string, UserLevel> = {
    resilient: calculateUserLevel('resilient', 350),
    relentless: calculateUserLevel('relentless', 150),
    fearless: calculateUserLevel('fearless', 100),
  };

  // Filter achievements based on category
  const getFilteredAchievements = () => {
    const earnedIds = mockUserAchievements.map(ua => ua.achievement_id);
    
    let achievements = ELITE_ACHIEVEMENTS;

    switch (selectedCategory) {
      case 'earned':
        achievements = ELITE_ACHIEVEMENTS.filter(a => earnedIds.includes(a.id));
        break;
      case 'streak':
        achievements = getAchievementsByCategory('streak');
        break;
      case 'pillar':
        achievements = getAchievementsByCategory('pillar');
        break;
      case 'milestone':
        achievements = getAchievementsByCategory('milestone');
        break;
      default:
        // Show all except hidden achievements unless earned
        achievements = ELITE_ACHIEVEMENTS.filter(a => !a.is_hidden || earnedIds.includes(a.id));
    }

    return achievements.map(achievement => {
      const userAchievement = mockUserAchievements.find(ua => ua.achievement_id === achievement.id);
      const progress = calculateAchievementProgress(achievement, mockUserStats);
      
      return {
        achievement,
        userAchievement,
        progress: progress.progress_percentage,
        isEarned: !!userAchievement,
      };
    });
  };

  const filteredAchievements = getFilteredAchievements();
  const earnedCount = mockUserAchievements.length;
  const totalCount = ELITE_ACHIEVEMENTS.filter(a => !a.is_hidden).length;
  const totalPoints = mockUserAchievements.reduce((sum, ua) => sum + ua.achievement.points_awarded, 0);

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowUnlock(true);
  };

  const handleTestUnlock = () => {
    // Demo function to show achievement unlock animation
    const nextAchievement = ELITE_ACHIEVEMENTS.find(a => 
      !mockUserAchievements.some(ua => ua.achievement_id === a.id)
    );
    
    if (nextAchievement) {
      setSelectedAchievement(nextAchievement);
      setShowUnlock(true);
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'earned', label: 'Earned', icon: '✅' },
    { id: 'streak', label: 'Streaks', icon: '🔥' },
    { id: 'pillar', label: 'Pillars', icon: '⚡' },
    { id: 'milestone', label: 'Milestones', icon: '🎯' },
  ];

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
              <Text style={styles.welcomeText}>Achievement Gallery</Text>
              <Text style={styles.userName}>
                {user?.profile?.full_name || 'Elite Athlete'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{earnedCount}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          
          <TouchableOpacity style={styles.statCard} onPress={handleTestUnlock}>
            <Text style={styles.statValue}>🎉</Text>
            <Text style={styles.statLabel}>Test Unlock</Text>
          </TouchableOpacity>
        </View>

        {/* Character Levels */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Character Levels</Text>
          <View style={styles.levelsGrid}>
            {Object.entries(userLevels).map(([pillar, level]) => {
              const pillarLevels = CHARACTER_LEVELS[pillar as keyof typeof CHARACTER_LEVELS];
              const currentLevelInfo = pillarLevels[level.current_level - 1];
              
              return (
                <View key={pillar} style={styles.levelCard}>
                  <Text style={styles.levelIcon}>{currentLevelInfo.badge_icon}</Text>
                  <Text style={styles.levelTitle}>{pillar.toUpperCase()}</Text>
                  <Text style={styles.levelName}>{level.current_title}</Text>
                  <View style={styles.levelProgress}>
                    <View 
                      style={[
                        styles.levelProgressFill, 
                        { 
                          width: `${level.level_progress_percentage}%`,
                          backgroundColor: currentLevelInfo.badge_color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.levelPoints}>
                    {level.current_points} / {level.current_points + level.points_to_next_level}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id as any)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Achievements Grid */}
        <ScrollView style={styles.achievementsGrid} showsVerticalScrollIndicator={false}>
          <View style={styles.achievementsContainer}>
            {filteredAchievements.map(({ achievement, userAchievement, progress, isEarned }) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                userAchievement={userAchievement}
                progress={progress}
                size="large"
                onPress={() => handleAchievementPress(achievement)}
                showProgress={true}
              />
            ))}
          </View>
          
          {filteredAchievements.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No achievements in this category yet</Text>
              <Text style={styles.emptyStateSubtext}>Keep training to unlock more!</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Achievement Unlock Modal */}
      <AchievementUnlock
        achievement={selectedAchievement}
        isVisible={showUnlock}
        onClose={() => {
          setShowUnlock(false);
          setSelectedAchievement(null);
        }}
      />
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
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
  },
  levelsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  levelsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  levelCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  levelIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  levelTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  levelName: {
    color: '#CCCCCC',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  levelProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelPoints: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000000',
  },
  achievementsGrid: {
    flex: 1,
    paddingHorizontal: 20,
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#CCCCCC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 14,
  },
});