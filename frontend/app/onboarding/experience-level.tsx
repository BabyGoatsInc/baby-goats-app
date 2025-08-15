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

interface ExperienceLevel {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  mindset: string;
  icon: string;
}

interface Sport {
  id: string;
  name: string;
  emoji: string;
  mindset: string;
  gradient: string[];
}

interface ExperienceLevelProps {
  sport: Sport;
  onNext: (experienceLevel: ExperienceLevel) => void;
  onBack: () => void;
}

export default function ExperienceLevel({ sport, onNext, onBack }: ExperienceLevelProps) {
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Load fonts
  let [fontsLoaded] = useFonts({
    SairaExtraCondensed_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  const experienceLevels: ExperienceLevel[] = [
    {
      id: 'beginner',
      title: 'EMERGING TALENT',
      description: 'New to the game, but hungry to learn',
      subtitle: 'Every champion started here',
      mindset: 'Growth mindset unlocks potential',
      icon: '🌱'
    },
    {
      id: 'intermediate',
      title: 'DEVELOPING ATHLETE', 
      description: 'Building skills and understanding',
      subtitle: 'Your foundation is strengthening',
      mindset: 'Consistency breeds excellence',
      icon: '💪'
    },
    {
      id: 'advanced',
      title: 'RISING COMPETITOR',
      description: 'Competing and pushing boundaries',
      subtitle: 'Your elite mindset is forming',
      mindset: 'Champions are made in pressure',
      icon: '🔥'
    },
    {
      id: 'elite',
      title: 'PROVEN CHAMPION',
      description: 'Elite level performance and leadership',
      subtitle: 'You inspire others to greatness',
      mindset: 'Legends leave legacies',
      icon: '👑'
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

  const handleNext = () => {
    if (selectedLevel) {
      onNext(selectedLevel);
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
            <View style={[styles.progressDot, { backgroundColor: '#EC1616' }]} />
            <View style={[styles.progressDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
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
              <Text style={styles.sportContext}>{sport.name} {sport.emoji}</Text>
              <Text style={styles.mainTitle}>What's Your Current Level?</Text>
              <Text style={styles.subtitle}>
                Honest self-assessment builds the strongest foundation
              </Text>
            </View>

            {/* Experience Level Cards */}
            <View style={styles.levelsContainer}>
              {experienceLevels.map((level, index) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.levelCard,
                    selectedLevel?.id === level.id && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedLevel(level)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.levelIcon}>{level.icon}</Text>
                      <View style={styles.cardTitles}>
                        <Text style={[
                          styles.levelTitle,
                          selectedLevel?.id === level.id && styles.selectedTitle
                        ]}>
                          {level.title}
                        </Text>
                        <Text style={[
                          styles.levelSubtitle,
                          selectedLevel?.id === level.id && styles.selectedSubtitle
                        ]}>
                          {level.subtitle}
                        </Text>
                      </View>
                      
                      {selectedLevel?.id === level.id && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[
                      styles.levelDescription,
                      selectedLevel?.id === level.id && styles.selectedDescription
                    ]}>
                      {level.description}
                    </Text>
                    
                    <View style={styles.mindsetContainer}>
                      <Text style={[
                        styles.mindsetText,
                        selectedLevel?.id === level.id && styles.selectedMindset
                      ]}>
                        "{level.mindset}"
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        {selectedLevel && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                Continue as {selectedLevel.title}
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
    marginBottom: 40,
  },
  sportContext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 2,
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
    maxWidth: 300,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  levelsContainer: {
    gap: 16,
  },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  selectedCard: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderColor: '#EC1616',
    borderWidth: 2,
  },
  cardContent: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  levelIcon: {
    fontSize: 28,
    marginTop: 4,
  },
  cardTitles: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
    fontFamily: 'SairaExtraCondensed_300Light',
  },
  selectedTitle: {
    color: '#EC1616',
  },
  levelSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedSubtitle: {
    color: '#CCCCCC',
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
  levelDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  selectedDescription: {
    color: '#FFFFFF',
  },
  mindsetContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  mindsetText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  selectedMindset: {
    color: '#CCCCCC',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  continueButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EC1616',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#EC1616',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_500Medium',
  },
});