import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SportSelection from './sport-selection';
import ExperienceLevel from './experience-level';
import GoalSetting from './goal-setting';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  difficulty: 'Foundation' | 'Growth' | 'Elite';
  icon: string;
  pillars: string[];
}

interface EliteOnboardingProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export default function EliteOnboarding({ onComplete, onBack }: EliteOnboardingProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [interestLevel, setInterestLevel] = useState(5);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const steps = [
    {
      title: "Every G.O.A.T.",
      subtitle: "Started as a Baby G.O.A.T.",
      description: "Champions aren't born. They're forged through mindset, dedication, and the courage to start.",
      buttonText: "Begin Your Journey",
      gradient: ['#1a1a2e', '#16213e', '#0f3460'],
      accentColor: '#ff6b6b',
    },
    {
      title: "What's Your Arena?",
      subtitle: "Every sport builds a different mental warrior",
      description: "Choose your battlefield and let's build your championship mindset.",
      buttonText: "Choose My Sport",
      gradient: ['#2d1b69', '#11998e', '#38ef7d'],
      accentColor: '#4ecdc4',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Reset animations for next step
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Move to sport selection
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSportSelected = (sport: Sport, interest: number) => {
    setSelectedSport(sport);
    setInterestLevel(interest);
    // Move to next step - Experience Level Assessment
    setCurrentStep(3); // Progress to Experience Level screen
    console.log(`Selected ${sport.name} with interest level ${interest}`);
  };

  const handleExperienceSelected = (experienceLevel: ExperienceLevel) => {
    setSelectedExperience(experienceLevel);
    // Move to Goal Setting screen
    setCurrentStep(4);
    console.log(`Selected experience level: ${experienceLevel.title}`);
  };

  const handleGoalsComplete = (goals: Goal[]) => {
    setSelectedGoals(goals);
    // Move to completion screen
    setCurrentStep(5);
    console.log(`Selected goals:`, goals.map(g => g.title));
  };

  // Show Sport Selection screen
  if (currentStep === 2) {
    return (
      <SportSelection 
        onNext={handleSportSelected}
        onBack={handleBack}
      />
    );
  }

  // Show Experience Level screen (placeholder)
  if (currentStep === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.mainTitle}>🎉 Onboarding Complete!</Text>
            <Text style={[styles.subtitle, { color: '#4ecdc4' }]}>
              Welcome to Baby Goats, {selectedSport?.name} champion!
            </Text>
            <Text style={styles.description}>
              You selected {selectedSport?.name} with passion level {interestLevel}/10! 
              Your journey to greatness begins now.
            </Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4ecdc4', marginTop: 40 }]}
              onPress={() => {
                // Complete onboarding and navigate
                console.log('Onboarding complete! Navigating...');
                if (onComplete) {
                  onComplete();
                } else {
                  console.log('No onComplete handler provided');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Start Training! 🚀</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={currentStepData.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? currentStepData.accentColor : 'rgba(255,255,255,0.3)',
                  transform: [{ scale: index === currentStep ? 1.2 : 1 }],
                },
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Athletic Silhouettes Animation (Step 1) */}
          {currentStep === 0 && (
            <View style={styles.heroSection}>
              <View style={styles.silhouettesContainer}>
                <AthleteSilhouette color="#ff6b6b" delay={0} />
                <AthleteSilhouette color="#4ecdc4" delay={300} />
                <AthleteSilhouette color="#45b7d1" delay={600} />
              </View>
            </View>
          )}

          {/* Sport Selection Preview (Step 2) */}
          {currentStep === 1 && (
            <View style={styles.heroSection}>
              <View style={styles.sportPreviewContainer}>
                <View style={styles.sportCard}>
                  <Text style={styles.sportEmoji}>🏀</Text>
                  <Text style={styles.sportName}>Basketball</Text>
                </View>
                <View style={styles.sportCard}>
                  <Text style={styles.sportEmoji}>⚽</Text>
                  <Text style={styles.sportName}>Soccer</Text>
                </View>
                <View style={styles.sportCard}>
                  <Text style={styles.sportEmoji}>🎾</Text>
                  <Text style={styles.sportName}>Tennis</Text>
                </View>
              </View>
            </View>
          )}

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{currentStepData.title}</Text>
            <Text style={[styles.subtitle, { color: currentStepData.accentColor }]}>
              {currentStepData.subtitle}
            </Text>
            <Text style={styles.description}>{currentStepData.description}</Text>
          </View>
        </Animated.View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: currentStepData.accentColor }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{currentStepData.buttonText}</Text>
          </TouchableOpacity>
        </View>

        {/* Inspiring Quote (Step 1 only) */}
        {currentStep === 0 && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>
              "The expert in anything was once a beginner."
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// Animated Athlete Silhouette Component
function AthleteSilhouette({ color, delay }: { color: string; delay: number }) {
  const [bounceAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const startBounce = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(startBounce, delay);
    return () => clearTimeout(timer);
  }, [bounceAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.silhouette,
        {
          backgroundColor: color,
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      <View style={[styles.silhouetteHead, { backgroundColor: color }]} />
    </Animated.View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 20,
    marginBottom: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  silhouettesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 120,
  },
  silhouette: {
    width: 50,
    height: 80,
    borderRadius: 25,
    marginHorizontal: 8,
    position: 'relative',
  },
  silhouetteHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: 8,
    left: 13,
  },
  sportPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
  },
  sportCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 80,
  },
  sportEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sportName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: screenWidth > 375 ? 42 : 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: screenWidth > 375 ? 28 : 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 12,
    maxWidth: 320,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  quoteContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  quote: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});