import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { useFonts, SairaExtraCondensed_300Light } from '@expo-google-fonts/saira-extra-condensed';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  difficulty: 'Foundation' | 'Growth' | 'Elite';
  icon: string;
  pillars: string[];
}

interface Sport {
  id: string;
  name: string;
  emoji: string;
  mindset: string;
  gradient: string[];
}

interface ExperienceLevel {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  mindset: string;
  icon: string;
}

interface GoalSettingProps {
  sport: Sport;
  experienceLevel: ExperienceLevel;
  onComplete: (selectedGoals: Goal[]) => void;
  onBack: () => void;
}

export default function GoalSetting({ sport, experienceLevel, onComplete, onBack }: GoalSettingProps) {
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Load fonts
  let [fontsLoaded] = useFonts({
    SairaExtraCondensed_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  const goals: Goal[] = [
    {
      id: 'skill_mastery',
      title: 'SKILL MASTERY',
      description: 'Master fundamental techniques and build muscle memory',
      timeframe: '3-6 months',
      difficulty: 'Foundation',
      icon: '🎯',
      pillars: ['Technical', 'Discipline']
    },
    {
      id: 'mental_toughness',
      title: 'MENTAL RESILIENCE',
      description: 'Develop unshakeable focus and emotional control',
      timeframe: '6-12 months',
      difficulty: 'Growth',
      icon: '🧠',
      pillars: ['Mental', 'Resilience']
    },
    {
      id: 'leadership',
      title: 'TEAM LEADERSHIP',
      description: 'Inspire and elevate teammates through example',
      timeframe: '12+ months',
      difficulty: 'Elite',
      icon: '👑',
      pillars: ['Leadership', 'Communication']
    },
    {
      id: 'performance_peak',
      title: 'PEAK PERFORMANCE',
      description: 'Consistently perform at your highest level under pressure',
      timeframe: '6-18 months',
      difficulty: 'Elite',
      icon: '⚡',
      pillars: ['Performance', 'Consistency']
    },
    {
      id: 'injury_prevention',
      title: 'BODY OPTIMIZATION',
      description: 'Build strength, mobility, and injury resilience',
      timeframe: '3-12 months',
      difficulty: 'Foundation',
      icon: '💪',
      pillars: ['Physical', 'Recovery']
    },
    {
      id: 'competition_success',
      title: 'COMPETITIVE EXCELLENCE',
      description: 'Dominate in competition and high-stakes moments',
      timeframe: '6-24 months',
      difficulty: 'Growth',
      icon: '🏆',
      pillars: ['Competition', 'Strategy']
    }
  ];

  useEffect(() => {
    if (fontsLoaded) {
      // Entrance animations
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  const handleGoalToggle = (goal: Goal) => {
    setSelectedGoals(prev => {
      const isSelected = prev.some(g => g.id === goal.id);
      if (isSelected) {
        return prev.filter(g => g.id !== goal.id);
      } else {
        // Limit to 3 goals maximum
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, goal];
      }
    });
  };

  const handleComplete = () => {
    if (selectedGoals.length > 0) {
      onComplete(selectedGoals);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Foundation': return '#4ECDC4';
      case 'Growth': return '#FFA500';
      case 'Elite': return '#EC1616';
      default: return '#CCCCCC';
    }
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.progressDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.progressDot, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.progressDot, { backgroundColor: '#EC1616' }]} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.sportContext}>
                {sport.name} {sport.emoji} • {experienceLevel.title}
              </Text>
              <Text style={styles.mainTitle}>Set Your Championship Goals</Text>
              <Text style={styles.subtitle}>
                Choose up to 3 focus areas that will define your path to greatness
              </Text>
              <Text style={styles.selectionCounter}>
                {selectedGoals.length}/3 selected
              </Text>
            </View>

            {/* Goals Grid */}
            <View style={styles.goalsContainer}>
              {goals.map((goal, index) => {
                const isSelected = selectedGoals.some(g => g.id === goal.id);
                const isDisabled = !isSelected && selectedGoals.length >= 3;
                
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      isSelected && styles.selectedGoalCard,
                      isDisabled && styles.disabledGoalCard,
                    ]}
                    onPress={() => handleGoalToggle(goal)}
                    activeOpacity={isDisabled ? 0.3 : 0.8}
                    disabled={isDisabled}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.goalIcon}>{goal.icon}</Text>
                        <View style={styles.cardTitles}>
                          <Text style={[
                            styles.goalTitle,
                            isSelected && styles.selectedGoalTitle
                          ]}>
                            {goal.title}
                          </Text>
                          <View style={styles.difficultyBadge}>
                            <Text style={[
                              styles.difficultyText,
                              { color: getDifficultyColor(goal.difficulty) }
                            ]}>
                              {goal.difficulty.toUpperCase()}
                            </Text>
                            <Text style={styles.timeframe}>• {goal.timeframe}</Text>
                          </View>
                        </View>
                        
                        {isSelected && (
                          <View style={styles.selectedIndicator}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={[
                        styles.goalDescription,
                        isSelected && styles.selectedGoalDescription
                      ]}>
                        {goal.description}
                      </Text>
                      
                      <View style={styles.pillarsContainer}>
                        {goal.pillars.map((pillar, idx) => (
                          <View key={idx} style={styles.pillarTag}>
                            <Text style={styles.pillarText}>{pillar}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Motivation Section */}
            <View style={styles.motivationSection}>
              <View style={styles.motivationDivider} />
              <Text style={styles.motivationQuote}>
                "Champions don't become great by accident. They become great by design."
              </Text>
              <Text style={styles.motivationAttribution}>— ELITE MINDSET PRINCIPLE</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        {selectedGoals.length > 0 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                BEGIN MY CHAMPIONSHIP JOURNEY
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    fontFamily: 'Inter_400Regular',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sportContext: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: isTablet ? 36 : 32,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    fontFamily: 'SairaExtraCondensed_300Light',
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  selectionCounter: {
    fontSize: 14,
    color: '#EC1616',
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  selectedGoalCard: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderColor: '#EC1616',
    borderWidth: 2,
  },
  disabledGoalCard: {
    opacity: 0.3,
  },
  cardContent: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  goalIcon: {
    fontSize: 28,
    marginTop: 4,
  },
  cardTitles: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 1,
    fontFamily: 'SairaExtraCondensed_300Light',
  },
  selectedGoalTitle: {
    color: '#EC1616',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
  },
  timeframe: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EC1616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalDescription: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  selectedGoalDescription: {
    color: '#FFFFFF',
  },
  pillarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pillarTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillarText: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Inter_400Regular',
  },
  motivationSection: {
    alignItems: 'center',
    paddingTop: 32,
  },
  motivationDivider: {
    width: 96,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 24,
  },
  motivationQuote: {
    fontSize: 18,
    color: '#CCCCCC',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'SairaExtraCondensed_300Light',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  motivationAttribution: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  completeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EC1616',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#EC1616',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_500Medium',
  },
});