import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Challenge {
  id: string;
  title: string;
  description: string;
  pillar: 'resilient' | 'relentless' | 'fearless';
  type: 'physical' | 'mental' | 'character' | 'skill';
  points: number;
  timeEstimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalChallengesCompleted: number;
  pillarProgress: {
    resilient: number;
    relentless: number;
    fearless: number;
  };
  completedToday: boolean;
  lastCompletedDate: string;
}

export default function DailyChallenges({ onBack }: { onBack?: () => void } = {}) {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentStreak: 5, // Mock data for demo
    longestStreak: 12,
    totalChallengesCompleted: 45,
    pillarProgress: { resilient: 15, relentless: 18, fearless: 12 },
    completedToday: false, // Allow users to complete today's challenge
    lastCompletedDate: '2024-01-12' // Yesterday, so today's challenge is available
  });
  
  const [animationValue] = useState(new Animated.Value(0));
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCompletionOptions, setShowCompletionOptions] = useState(false);

  // Challenge Database - Start with 15 core challenges
  const challenges: Challenge[] = [
    // RESILIENT Challenges
    {
      id: 'r1',
      title: 'Bounce Back Strong',
      description: 'After your next mistake in practice or a game, immediately do 10 jumping jacks and say "I learn from every challenge!"',
      pillar: 'resilient',
      type: 'mental',
      points: 20,
      timeEstimate: '5 min',
      difficulty: 'easy'
    },
    {
      id: 'r2', 
      title: 'Growth Mindset Journal',
      description: 'Write down 3 things you struggled with today and how each struggle made you stronger.',
      pillar: 'resilient',
      type: 'character',
      points: 25,
      timeEstimate: '10 min',
      difficulty: 'medium'
    },
    {
      id: 'r3',
      title: 'Comeback Drill',
      description: 'Practice your sport skill for 15 minutes, focusing only on the areas you find most difficult.',
      pillar: 'resilient',
      type: 'physical',
      points: 30,
      timeEstimate: '15 min',
      difficulty: 'medium'
    },
    {
      id: 'r4',
      title: 'Failure Friend',
      description: 'Share a recent failure with a teammate or friend and explain what you learned from it.',
      pillar: 'resilient',
      type: 'character',
      points: 25,
      timeEstimate: '5 min',
      difficulty: 'easy'
    },
    {
      id: 'r5',
      title: 'Pressure Practice',
      description: 'Practice your sport while someone counts down from 10, simulating pressure situations.',
      pillar: 'resilient',
      type: 'skill',
      points: 35,
      timeEstimate: '20 min',
      difficulty: 'hard'
    },

    // RELENTLESS Challenges
    {
      id: 'rl1',
      title: 'Extra Rep Challenge',
      description: 'During practice or workout, when you think you\'re done, do 5 more reps of your last exercise.',
      pillar: 'relentless',
      type: 'physical',
      points: 25,
      timeEstimate: '5 min',
      difficulty: 'medium'
    },
    {
      id: 'rl2',
      title: 'Wake Up Champion',
      description: 'Set your alarm 15 minutes earlier and use that time for visualization or light stretching.',
      pillar: 'relentless',
      type: 'character',
      points: 30,
      timeEstimate: '15 min',
      difficulty: 'hard'
    },
    {
      id: 'rl3',
      title: 'Never Quit Drill',
      description: 'Pick one skill and practice it until you get it right 10 times in a row, no matter how long it takes.',
      pillar: 'relentless',
      type: 'skill',
      points: 40,
      timeEstimate: '30+ min',
      difficulty: 'hard'
    },
    {
      id: 'rl4',
      title: 'Consistency Check',
      description: 'Do the same 5-minute routine (stretches, skills, etc.) at the exact same time as yesterday.',
      pillar: 'relentless',
      type: 'physical',
      points: 20,
      timeEstimate: '5 min',
      difficulty: 'easy'
    },
    {
      id: 'rl5',
      title: 'Champion\'s Schedule',
      description: 'Plan tomorrow\'s training schedule tonight and stick to it 100%.',
      pillar: 'relentless',
      type: 'character',
      points: 25,
      timeEstimate: '10 min',
      difficulty: 'medium'
    },

    // FEARLESS Challenges
    {
      id: 'f1',
      title: 'Comfort Zone Crusher',
      description: 'Try a skill or technique you\'ve been avoiding because it seems too hard.',
      pillar: 'fearless',
      type: 'skill',
      points: 35,
      timeEstimate: '15 min',
      difficulty: 'hard'
    },
    {
      id: 'f2',
      title: 'Leader Voice',
      description: 'Speak up and encourage a teammate during practice, even if you\'re usually quiet.',
      pillar: 'fearless',
      type: 'character',
      points: 30,
      timeEstimate: '5 min',
      difficulty: 'medium'
    },
    {
      id: 'f3',
      title: 'Pressure Moment',
      description: 'Volunteer to go first in a drill or take the important shot/play when the opportunity comes.',
      pillar: 'fearless',
      type: 'mental',
      points: 35,
      timeEstimate: '5 min',
      difficulty: 'hard'
    },
    {
      id: 'f4',
      title: 'Ask the Question',
      description: 'Ask your coach a question about improving, even if you think it might sound basic.',
      pillar: 'fearless',
      type: 'character',
      points: 20,
      timeEstimate: '2 min',
      difficulty: 'easy'
    },
    {
      id: 'f5',
      title: 'New Move Challenge',
      description: 'Learn and attempt a new technique by watching a video and practicing it 20 times.',
      pillar: 'fearless',
      type: 'skill',
      points: 30,
      timeEstimate: '20 min',
      difficulty: 'medium'
    }
  ];

  useEffect(() => {
    // Select today's challenge
    selectTodaysChallenge();
    
    // Start entrance animation
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const selectTodaysChallenge = () => {
    // Simple algorithm: rotate through challenges based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const challengeIndex = dayOfYear % challenges.length;
    setCurrentChallenge(challenges[challengeIndex]);
  };

  const completeChallenge = () => {
    if (!currentChallenge || userProgress.completedToday) return;

    // Update user progress
    const newProgress = {
      ...userProgress,
      currentStreak: userProgress.currentStreak + 1,
      totalChallengesCompleted: userProgress.totalChallengesCompleted + 1,
      completedToday: true,
      lastCompletedDate: new Date().toISOString().split('T')[0],
      pillarProgress: {
        ...userProgress.pillarProgress,
        [currentChallenge.pillar]: userProgress.pillarProgress[currentChallenge.pillar] + 1
      }
    };

    // Update longest streak if necessary
    if (newProgress.currentStreak > newProgress.longestStreak) {
      newProgress.longestStreak = newProgress.currentStreak;
    }

    setUserProgress(newProgress);
    setShowCelebration(true);
    
    // Show celebration longer and then show completion options
    setTimeout(() => {
      setShowCelebration(false);
      setShowCompletionOptions(true);
    }, 3000);
  };

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'resilient': return '#4ecdc4'; // Teal
      case 'relentless': return '#ff6b6b'; // Red
      case 'fearless': return '#feca57'; // Yellow
      default: return '#666';
    }
  };

  const getPillarGradient = (pillar: string) => {
    switch (pillar) {
      case 'resilient': return ['#4ecdc4', '#26a69a'];
      case 'relentless': return ['#ff6b6b', '#e74c3c'];
      case 'fearless': return ['#feca57', '#f39c12'];
      default: return ['#666', '#444'];
    }
  };

  const getPillarIcon = (pillar: string) => {
    switch (pillar) {
      case 'resilient': return '🛡️';
      case 'relentless': return '🔥';
      case 'fearless': return '⚡';
      default: return '🎯';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  if (!currentChallenge) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Animated.View style={[styles.content, { opacity: animationValue }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Elite Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                if (onBack) {
                  onBack();
                } else {
                  console.log('No back handler provided');
                }
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>TRAINING PROTOCOLS</Text>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Performance Status */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusNumber}>{userProgress.currentStreak}</Text>
                <Text style={styles.statusText}>Day Streak</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Text style={styles.statusNumber}>{userProgress.longestStreak}</Text>
                <Text style={styles.statusText}>Peak Streak</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Text style={styles.statusNumber}>{userProgress.totalChallengesCompleted}</Text>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Character Development Status */}
          <View style={styles.developmentSection}>
            <Text style={styles.developmentTitle}>CHARACTER DEVELOPMENT</Text>
            
            <View style={styles.pillarsList}>
              {(['resilient', 'relentless', 'fearless'] as const).map((pillar) => (
                <View key={pillar} style={styles.pillarRow}>
                  <Text style={styles.pillarName}>{pillar.toUpperCase()}</Text>
                  <View style={styles.pillarProgress}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${Math.min(userProgress.pillarProgress[pillar] * 5, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.pillarValue}>{userProgress.pillarProgress[pillar]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's Protocol */}
          <View style={styles.protocolSection}>
            <Text style={styles.protocolLabel}>Today's Protocol</Text>
            
            <View style={styles.protocolCard}>
              <View style={styles.protocolHeader}>
                <View style={styles.protocolMeta}>
                  <View style={styles.pillarBadge}>
                    <Text style={styles.pillarBadgeText}>
                      {currentChallenge.pillar.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.protocolTags}>
                    <View style={[styles.tag, { backgroundColor: getDifficultyColor(currentChallenge.difficulty) }]}>
                      <Text style={styles.tagText}>{currentChallenge.difficulty.toUpperCase()}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{currentChallenge.timeEstimate}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>+{currentChallenge.points}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.protocolContent}>
                <Text style={styles.protocolTitle}>{currentChallenge.title.toUpperCase()}</Text>
                <Text style={styles.protocolDescription}>{currentChallenge.description}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.executeButton,
                  userProgress.completedToday && styles.completedButton
                ]}
                onPress={completeChallenge}
                disabled={userProgress.completedToday}
                activeOpacity={0.8}
              >
                <Text style={styles.executeButtonText}>
                  {userProgress.completedToday ? 'PROTOCOL COMPLETED' : 'EXECUTE PROTOCOL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Training Guidelines */}
          <View style={styles.guidelinesSection}>
            <Text style={styles.guidelinesTitle}>Training Guidelines</Text>
            <View style={styles.guidelinesList}>
              <Text style={styles.guidelineItem}>• Focus on form and technique over speed</Text>
              <Text style={styles.guidelineItem}>• Mental preparation is equally important</Text>
              <Text style={styles.guidelineItem}>• Seek guidance when needed - true strength</Text>
              <Text style={styles.guidelineItem}>• Consistency builds champions</Text>
            </View>
          </View>
        </ScrollView>

        {/* Achievement Overlay */}
        {showCelebration && (
          <View style={styles.achievementOverlay}>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>PROTOCOL COMPLETED</Text>
              <Text style={styles.achievementMessage}>
                {currentChallenge.pillar.toUpperCase()} development advanced
              </Text>
              <Text style={styles.achievementPoints}>+{currentChallenge.points} points</Text>
            </View>
          </View>
        )}

        {/* Completion Options */}
        {showCompletionOptions && (
          <View style={styles.completionOverlay}>
            <View style={styles.completionContent}>
              <Text style={styles.completionTitle}>TRAINING COMPLETE</Text>
              <Text style={styles.completionMessage}>
                Excellent execution. Your {currentChallenge.pillar.toUpperCase()} attribute has been strengthened.
              </Text>
              
              <View style={styles.completionActions}>
                <TouchableOpacity
                  style={styles.completionButton}
                  onPress={() => {
                    setShowCompletionOptions(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completionButtonText}>Review Progress</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryCompletionButton}
                  onPress={() => {
                    setShowCompletionOptions(false);
                    console.log('Navigate to next protocol');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryCompletionText}>Continue Training</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 40,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  pillarContainer: {
    marginBottom: 30,
  },
  pillarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  pillarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pillarItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  pillarCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pillarIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  pillarCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  challengeContainer: {
    marginBottom: 30,
  },
  challengeCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  challengeHeader: {
    marginBottom: 20,
  },
  challengeMetadata: {
    marginBottom: 16,
  },
  pillarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  pillarBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  challengeContent: {
    marginBottom: 24,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  challengeDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  tipsList: {
    // No additional styles needed
  },
  tipItem: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completionOptionsContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 30,
    maxWidth: 340,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  completionButtons: {
    width: '100%',
  },
  completionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryCompletionButton: {
    backgroundColor: '#4ecdc4',
  },
  secondaryCompletionButton: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});