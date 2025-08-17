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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Sport {
  id: string;
  name: string;
  emoji: string;
  mindset: string;
  gradient: string[];
}

interface SportSelectionProps {
  onNext: (selectedSport: Sport, interestLevel: number) => void;
  onBack: () => void;
}

export default function SportSelection({ onNext, onBack }: SportSelectionProps) {
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [interestLevel, setInterestLevel] = useState(5);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const sports: Sport[] = [
    { 
      id: 'basketball', 
      name: 'Basketball', 
      emoji: '🏀', 
      mindset: 'Teamwork builds legends',
      gradient: ['#ff6b6b', '#ff5722']
    },
    { 
      id: 'soccer', 
      name: 'Soccer', 
      emoji: '⚽', 
      mindset: 'Endurance creates champions',
      gradient: ['#4ecdc4', '#26a69a']
    },
    { 
      id: 'tennis', 
      name: 'Tennis', 
      emoji: '🎾', 
      mindset: 'Mental toughness wins',
      gradient: ['#45b7d1', '#2196f3']
    },
    { 
      id: 'swimming', 
      name: 'Swimming', 
      emoji: '🏊', 
      mindset: 'Discipline conquers all',
      gradient: ['#96ceb4', '#4caf50']
    },
    { 
      id: 'track', 
      name: 'Track & Field', 
      emoji: '🏃', 
      mindset: 'Every second counts',
      gradient: ['#feca57', '#ff9800']
    },
    { 
      id: 'football', 
      name: 'Football', 
      emoji: '🏈', 
      mindset: 'Strategy meets strength',
      gradient: ['#a29bfe', '#9c27b0']
    },
    { 
      id: 'baseball', 
      name: 'Baseball', 
      emoji: '⚾', 
      mindset: 'Patience leads to power',
      gradient: ['#fd79a8', '#e91e63']
    },
    { 
      id: 'gymnastics', 
      name: 'Gymnastics', 
      emoji: '🤸', 
      mindset: 'Precision creates perfection',
      gradient: ['#00b894', '#009688']
    },
  ];

  useEffect(() => {
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
  }, []);

  const handleSportSelect = (sport: Sport) => {
    setSelectedSport(sport);
  };

  const handleNext = () => {
    if (!selectedSport) {
      Alert.alert('Select Your Sport', 'Please choose your sport to continue your champion journey!');
      return;
    }
    onNext(selectedSport, interestLevel);
  };

  const getPassionMessage = (level: number) => {
    if (level <= 3) return { text: "Every great journey starts with curiosity 🌱", color: '#4ecdc4' };
    if (level <= 7) return { text: "Your passion is growing strong 🔥", color: '#feca57' };
    return { text: "Champion-level dedication detected! 🏆", color: '#ff6b6b' };
  };

  const passionMessage = getPassionMessage(interestLevel);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={selectedSport ? selectedSport.gradient : ['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: '#4ecdc4' }]} />
            <View style={[styles.progressDot, { backgroundColor: '#ff6b6b' }]} />
            <View style={[styles.progressDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>What's Your Arena?</Text>
              <Text style={styles.subtitle}>Every sport builds a different type of mental warrior</Text>
            </View>

            {/* Sports Grid */}
            <View style={styles.sportsGrid}>
              {sports.map((sport, index) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportCard,
                    selectedSport?.id === sport.id && styles.selectedSportCard,
                  ]}
                  onPress={() => handleSportSelect(sport)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedSport?.id === sport.id ? sport.gradient : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.sportCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                    <Text style={[
                      styles.sportName,
                      selectedSport?.id === sport.id && styles.selectedSportName
                    ]}>
                      {sport.name}
                    </Text>
                    <Text style={[
                      styles.sportMindset,
                      selectedSport?.id === sport.id && styles.selectedSportMindset
                    ]}>
                      {sport.mindset}
                    </Text>
                    
                    {selectedSport?.id === sport.id && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interest Level Slider */}
            {selectedSport && (
              <Animated.View
                style={[
                  styles.interestSection,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <Text style={styles.interestTitle}>
                  How passionate are you about {selectedSport.name}?
                </Text>
                
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View 
                      style={[
                        styles.sliderProgress, 
                        { 
                          width: `${interestLevel * 10}%`,
                          backgroundColor: passionMessage.color,
                        }
                      ]} 
                    />
                    <TouchableOpacity
                      style={[
                        styles.sliderThumb,
                        { 
                          left: `${(interestLevel - 1) * 11.11}%`,
                          backgroundColor: passionMessage.color,
                        }
                      ]}
                      {...getPanResponder()}
                    />
                  </View>
                  
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Just starting</Text>
                    <Text style={[styles.sliderValue, { color: passionMessage.color }]}>
                      {interestLevel}/10
                    </Text>
                    <Text style={styles.sliderLabel}>Completely obsessed</Text>
                  </View>
                  
                  <View style={styles.passionMessageContainer}>
                    <Text style={[styles.passionMessage, { color: passionMessage.color }]}>
                      {passionMessage.text}
                    </Text>
                  </View>
                </View>
                
                {/* Slider Touch Area */}
                <View style={styles.sliderTouchArea}>
                  {[1,2,3,4,5,6,7,8,9,10].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.sliderTouchZone}
                      onPress={() => setInterestLevel(value)}
                    />
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        {selectedSport && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: passionMessage.color }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                My Arena is {selectedSport.name}! ⚡
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// Simplified pan responder for slider
const getPanResponder = () => ({
  // This would be expanded with actual pan responder logic
  // For now, we'll use the touch zones approach
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight || 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: screenWidth > 375 ? 36 : 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  sportCard: {
    width: (screenWidth - 56) / 2,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 3,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
  selectedSportCard: {
    elevation: 6,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
  },
  sportCardGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 140,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  sportName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedSportName: {
    color: '#fff',
  },
  sportMindset: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedSportMindset: {
    color: 'rgba(255,255,255,0.9)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#feca57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  interestSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  interestTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 16,
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  sliderLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  passionMessageContainer: {
    alignItems: 'center',
  },
  passionMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sliderTouchArea: {
    position: 'absolute',
    top: 70,
    left: 24,
    right: 24,
    height: 40,
    flexDirection: 'row',
  },
  sliderTouchZone: {
    flex: 1,
    height: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
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
  },
});