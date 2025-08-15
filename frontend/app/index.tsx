import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ScrollView } from "react-native";
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
  const fadeInAnimation = useSharedValue(0);

  useEffect(() => {
    // Start subtle glow animation
    glowAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Fade in animation
    fadeInAnimation.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.3, 0.6]);
    return { opacity };
  });

  const animatedFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeInAnimation.value,
    transform: [{ translateY: interpolate(fadeInAnimation.value, [0, 1], [20, 0]) }]
  }));

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

  // BABY GOATS Landing Page
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C0E" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0B0C0E', '#1A1B1E', '#0B0C0E']}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandName}>BABY GOATS</Text>
            <View style={styles.nav}>
              <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('onboarding')}>
                <Text style={styles.navText}>Academy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('profile')}>
                <Text style={styles.navText}>Mentorship</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('challenges')}>
                <Text style={styles.navText}>Community</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, animatedFadeStyle]}>
            <Text style={styles.eyebrow}>Future Legends</Text>
            
            <View style={styles.heroContent}>
              <Text style={[styles.heroBody, isTablet && styles.heroBodyTablet]}>
                Where young champions forge their path to greatness. Every legend started as a dream. Transform your potential into legendary performance through dedication, elite training, and unwavering belief.
              </Text>
            </View>

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={[styles.primaryCta, isTablet && styles.primaryCtaTablet]}
                onPress={() => setCurrentScreen('auth')}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryCtaText, isTablet && styles.primaryCtaTextTablet]}>
                  Join the Legacy
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryCta, isTablet && styles.secondaryCtaTablet]}
                onPress={() => setCurrentScreen('onboarding')}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryCtaText, isTablet && styles.secondaryCtaTextTablet]}>
                  Champion Stories
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quote Section */}
          <Animated.View style={[styles.quoteSection, animatedGlowStyle]}>
            <Text style={[styles.quote, isTablet && styles.quoteTablet]}>
              Champions aren't made in comfort zones
            </Text>
            <Text style={styles.kicker}>For the next generation of GOATs</Text>
          </Animated.View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet]}>1000+</Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet]}>Young Athletes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet]}>50+</Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet]}>Elite Mentors</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet]}>24/7</Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet]}>Dream Support</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTagline}>Building champions since 2024</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialLink}>
                <Text style={styles.socialText}>TikTok</Text>
              </TouchableOpacity>
              <View style={styles.socialDivider} />
              <TouchableOpacity style={styles.socialLink}>
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
              <View style={styles.socialDivider} />
              <TouchableOpacity style={styles.socialLink}>
                <Text style={styles.socialText}>YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1B1F',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bokehContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bokehParticle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(58, 184, 255, 0.3)',
  },
  particle1: {
    width: 80,
    height: 80,
    top: '15%',
    left: '20%',
    backgroundColor: 'rgba(58, 184, 255, 0.4)',
  },
  particle2: {
    width: 60,
    height: 60,
    top: '25%',
    right: '15%',
    backgroundColor: 'rgba(109, 77, 255, 0.3)',
  },
  particle3: {
    width: 100,
    height: 100,
    top: '45%',
    left: '10%',
    backgroundColor: 'rgba(58, 184, 255, 0.2)',
  },
  particle4: {
    width: 40,
    height: 40,
    top: '60%',
    right: '25%',
    backgroundColor: 'rgba(58, 184, 255, 0.5)',
  },
  particle5: {
    width: 120,
    height: 120,
    bottom: '20%',
    right: '10%',
    backgroundColor: 'rgba(109, 77, 255, 0.2)',
  },
  particle6: {
    width: 70,
    height: 70,
    bottom: '30%',
    left: '15%',
    backgroundColor: 'rgba(58, 184, 255, 0.3)',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: isTablet ? 22 : 14,
  },
  titleGlow: {
    position: 'absolute',
    top: -30,
    left: -40,
    right: -40,
    bottom: -30,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 80,
  },
  lightSweep: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 120,
    left: -60,
  },
  sweepGradient: {
    flex: 1,
    borderRadius: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.5,
    fontFamily: 'System',
    lineHeight: 42,
    textShadowColor: 'rgba(58, 184, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleTablet: {
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 80,
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: isTablet ? 56 : 48,
    letterSpacing: 0.3,
    fontFamily: 'System',
    lineHeight: 22,
    maxWidth: 320,
  },
  subheadlineTablet: {
    fontSize: 20,
    lineHeight: 28,
    maxWidth: 480,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(58, 184, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: isTablet ? 24 : 20,
  },
  ctaButtonTablet: {
    height: 56,
    paddingHorizontal: 64,
    paddingVertical: 18,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A1B1F',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  ctaTextTablet: {
    fontSize: 18,
    letterSpacing: 0.8,
  },
  secondaryLink: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
  },
  secondaryLinkTextTablet: {
    fontSize: 16,
  },
});
