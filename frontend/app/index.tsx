import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ImageBackground } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import EliteOnboarding from './onboarding/elite';
import DailyChallenges from './challenges/index';
import Authentication from './auth/index';
import UserProfileScreen from './profile/index';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type Screen = 'home' | 'auth' | 'onboarding' | 'challenges' | 'profile';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  parentEmail?: string;
  isParentApproved: boolean;
  sport?: string;
  interestLevel?: number;
  currentStreak?: number;
  totalChallengesCompleted?: number;
  pillarProgress?: {
    resilient: number;
    relentless: number;
    fearless: number;
  };
}

export default function Index() {
  console.log(EXPO_PUBLIC_BACKEND_URL, "EXPO_PUBLIC_BACKEND_URL");
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Animation values
  const glowAnimation = useSharedValue(0);
  const sweepAnimation = useSharedValue(0);

  useEffect(() => {
    // Start glow animation
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Start light sweep animation every 12 seconds
    sweepAnimation.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 10500 }) // Wait 10.5s before next sweep
      ),
      -1,
      false
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.6, 1]);
    const scale = interpolate(glowAnimation.value, [0, 1], [1, 1.02]);
    return {
      opacity,
      transform: [{ scale }]
    };
  });

  const animatedSweepStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      sweepAnimation.value,
      [0, 1],
      [-screenWidth, screenWidth * 1.5]
    );
    const opacity = interpolate(
      sweepAnimation.value,
      [0, 0.3, 0.7, 1],
      [0, 0.3, 0.3, 0]
    );
    return {
      transform: [{ translateX }],
      opacity
    };
  });

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setCurrentScreen('profile');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('home');
  };

  const handleScreenNavigation = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  // Authentication Screen
  if (currentScreen === 'auth') {
    return (
      <Authentication 
        onAuthSuccess={handleAuthSuccess}
        onBack={handleBackToHome}
      />
    );
  }

  // User Profile Screen
  if (currentScreen === 'profile' && user) {
    return (
      <UserProfileScreen 
        user={user}
        onNavigateTo={handleScreenNavigation}
        onLogout={handleLogout}
      />
    );
  }

  // Elite Onboarding Screen
  if (currentScreen === 'onboarding') {
    return (
      <EliteOnboarding 
        onComplete={() => setCurrentScreen('challenges')}
        onBack={handleBackToHome}
      />
    );
  }

  // Daily Challenges Screen
  if (currentScreen === 'challenges') {
    return (
      <DailyChallenges 
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  // Arena Glow Welcome Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B0D" />
      
      {/* Background with gradient overlay */}
      <LinearGradient
        colors={['#0A0B0D', 'rgba(10, 11, 13, 0.9)', 'rgba(10, 11, 13, 0.54)']}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      
      {/* Stadium bokeh background pattern */}
      <View style={styles.bokehPattern} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Title with glow effect */}
          <View style={styles.titleContainer}>
            {/* Glow background */}
            <Animated.View style={[styles.titleGlow, animatedGlowStyle]}>
              <LinearGradient
                colors={['rgba(58, 184, 255, 0.15)', 'rgba(109, 77, 255, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowGradient}
              />
            </Animated.View>
            
            {/* Light sweep effect */}
            <Animated.View style={[styles.lightSweep, animatedSweepStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sweepGradient}
              />
            </Animated.View>
            
            {/* Main title */}
            <Text style={[styles.title, isTablet && styles.titleTablet]}>
              BABY G.O.A.T.S
            </Text>
          </View>
          
          {/* Subheadline */}
          <Text style={[styles.subheadline, isTablet && styles.subheadlineTablet]}>
            Built for athletes obsessed with greatness.
          </Text>
          
          {/* Primary CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, isTablet && styles.ctaButtonTablet]}
            onPress={() => setCurrentScreen('auth')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.ctaButtonGradient}
            />
            <Text style={[styles.ctaText, isTablet && styles.ctaTextTablet]}>
              Begin
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '400',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 24,
  },
  beginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 4,
  },
  beginText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 2,
  },
});
