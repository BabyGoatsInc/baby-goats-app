import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from "react-native";

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useFonts, SairaExtraCondensed_300Light } from '@expo-google-fonts/saira-extra-condensed';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';

import { AuthProvider } from '../contexts/AuthContext';
import EliteOnboarding from './onboarding/elite';
import DailyChallenges from './challenges/index';
import Authentication from './auth/index';
import UserProfileScreen from './profile/index';
import GoalsTracker from './goals/index';
import AchievementsGallery from './achievements/index';

// Offline capabilities imports
import { offlineManager } from '../lib/offlineManager';
import { offlineDataLayer } from '../lib/offlineDataLayer';
import { startCacheCleanup } from '../lib/apiCache';
import { performanceMonitor } from '../lib/performanceMonitor';
import OfflineIndicator from '../components/OfflineIndicator';

// Technical infrastructure imports
import { technicalInfrastructure } from '../lib/technicalInfrastructure';
import { ErrorBoundary } from '../lib/errorMonitoring';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type Screen = 'home' | 'auth' | 'onboarding' | 'challenges' | 'profile' | 'goals' | 'achievements';

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

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [offlineSystemReady, setOfflineSystemReady] = useState(false);

  // Load fonts
  let [fontsLoaded] = useFonts({
    SairaExtraCondensed_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  // Initialize offline capabilities and technical infrastructure
  useEffect(() => {
    async function initializeAppSystems() {
      try {
        console.log('🚀 Initializing Baby Goats comprehensive systems...');
        
        // Initialize all technical infrastructure systems
        await technicalInfrastructure.initializeAll();
        
        setOfflineSystemReady(true);
        console.log('✅ Baby Goats comprehensive systems ready!');
      } catch (error) {
        console.error('❌ Failed to initialize app systems:', error);
        // Continue without complete technical infrastructure but log the error
        setOfflineSystemReady(true);
      }
    }

    initializeAppSystems();
  }, []);

  // Load fonts
  let [fontsLoaded] = useFonts({
    SairaExtraCondensed_300Light,
    Inter_400Regular,
    Inter_500Medium,
  });

  // Animation values
  const navOpacity = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(30);
  const bodyOpacity = useSharedValue(0);
  const bodyTranslateY = useSharedValue(30);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(30);
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(30);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    if (fontsLoaded) {
      // Staggered animation sequence
      setTimeout(() => {
        navOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 200);
      
      setTimeout(() => {
        heroOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        heroTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
      }, 400);
      
      setTimeout(() => {
        bodyOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        bodyTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 800);
      
      setTimeout(() => {
        ctaOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        ctaTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 1200);
      
      setTimeout(() => {
        quoteOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        quoteTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 1600);
      
      setTimeout(() => {
        statsOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        statsTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 2000);
      
      setTimeout(() => {
        footerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      }, 2400);
    }
  }, [fontsLoaded]);

  const navAnimatedStyle = useAnimatedStyle(() => ({
    opacity: navOpacity.value
  }));

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }]
  }));

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyTranslateY.value }]
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }]
  }));

  const quoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslateY.value }]
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }]
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value
  }));

  const handleScreenNavigation = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  // Show loading if fonts aren't loaded yet
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Other screen components remain the same
  if (currentScreen === 'auth') {
    return (
      <Authentication 
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <UserProfileScreen 
        onNavigateTo={handleScreenNavigation}
      />
    );
  }

  if (currentScreen === 'onboarding') {
    return (
      <EliteOnboarding 
        onComplete={() => setCurrentScreen('challenges')}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === 'achievements') {
    return (
      <AchievementsGallery 
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === 'goals') {
    return (
      <GoalsTracker 
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === 'challenges') {
    return (
      <DailyChallenges 
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  // Luxury Home Page
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showDetails={false} />
      
      {/* Navigation */}
      <Animated.View style={[styles.navigation, navAnimatedStyle]}>
        <Text style={styles.brandName}>BABY GOATS</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => setCurrentScreen('goals')}>
            <Text style={styles.navLink}>PROGRESS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('achievements')}>
            <Text style={styles.navLink}>ACHIEVEMENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('onboarding')}>
            <Text style={styles.navLink}>ACADEMY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
            <Text style={styles.navLink}>MENTORSHIP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('challenges')}>
            <Text style={styles.navLink}>COMMUNITY</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroContent}>
          <Animated.View style={[styles.heroTitleContainer, heroAnimatedStyle]}>
            <Text style={styles.heroTitle}>Future</Text>
            <Text style={[styles.heroTitle, styles.heroTitleItalic]}>Legends</Text>
          </Animated.View>

          <Animated.View style={[styles.heroBodyContainer, bodyAnimatedStyle]}>
            <Text style={styles.heroBody}>
              Where young champions forge their path to greatness. Every legend started as a dream.
              Transform your potential into legendary performance through dedication, elite training,
              and unwavering belief.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.primaryCta}
              onPress={() => setCurrentScreen('auth')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryCtaText}>JOIN THE LEGACY</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCta}
              onPress={() => setCurrentScreen('onboarding')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryCtaText}>CHAMPION STORIES</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Inspirational Quote */}
          <Animated.View style={[styles.quoteSection, quoteAnimatedStyle]}>
            <View style={styles.quoteDivider} />
            <Text style={styles.quote}>
              "Champions aren't made in comfort zones"
            </Text>
            <Text style={styles.quoteAttribution}>
              — FOR THE NEXT GENERATION OF GOATS
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Stats Section */}
      <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>YOUNG ATHLETES</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>ELITE MENTORS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>DREAM SUPPORT</Text>
          </View>
        </View>
        
        {/* Elegant divider */}
        <View style={styles.elegantDivider} />
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <Text style={styles.footerTagline}>BUILDING CHAMPIONS SINCE 2024</Text>
        <View style={styles.socialLinks}>
          <TouchableOpacity>
            <Text style={styles.socialLink}>TIKTOK</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.socialLink}>INSTAGRAM</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.socialLink}>YOUTUBE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
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
  
  // Navigation
  navigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandName: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 4,
    fontFamily: 'SairaExtraCondensed_300Light',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 48 : 32,
  },
  navLink: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },

  // Hero Section
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: screenHeight,
  },
  heroContent: {
    maxWidth: isTablet ? 800 : 400,
    alignItems: 'center',
    width: '100%',
  },
  heroTitleContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 32 : 24,
  },
  heroTitle: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'SairaExtraCondensed_300Light',
    lineHeight: isTablet ? 52 : 36,
  },
  heroTitleItalic: {
    fontStyle: 'italic',
  },
  heroBodyContainer: {
    marginBottom: isTablet ? 48 : 40,
    paddingHorizontal: isTablet ? 40 : 0,
  },
  heroBody: {
    fontSize: isTablet ? 18 : 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: isTablet ? 28 : 24,
    fontWeight: '400',
    letterSpacing: 0.3,
    fontFamily: 'Inter_400Regular',
    maxWidth: isTablet ? 600 : 350,
  },

  // CTAs
  ctaContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: 'center',
    gap: 24,
    marginBottom: isTablet ? 64 : 48,
  },
  primaryCta: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: isTablet ? 48 : 40,
    backgroundColor: 'transparent',
    minWidth: isTablet ? 200 : 180,
    alignItems: 'center',
  },
  primaryCtaText: {
    fontSize: 12,
    color: '#EC1616', // Red color as specified
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
  secondaryCta: {
    paddingVertical: 16,
    paddingHorizontal: isTablet ? 48 : 40,
    minWidth: isTablet ? 200 : 180,
    alignItems: 'center',
  },
  secondaryCtaText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '400',
    letterSpacing: 2,
    textDecorationLine: 'underline',
    fontFamily: 'Inter_400Regular',
  },

  // Quote Section
  quoteSection: {
    alignItems: 'center',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    marginBottom: isTablet ? 64 : 48,
  },
  quoteDivider: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  quote: {
    fontSize: isTablet ? 24 : 20,
    color: '#AAAAAA',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '300',
    fontFamily: 'SairaExtraCondensed_300Light',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  quoteAttribution: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },

  // Stats Section
  statsContainer: {
    position: 'absolute',
    bottom: isTablet ? 96 : 120,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: isTablet ? 600 : 400,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: '#222222',
    paddingRight: 16,
  },
  statValue: {
    fontSize: isTablet ? 32 : 24,
    color: '#FFFFFF',
    fontWeight: '300',
    fontFamily: 'SairaExtraCondensed_300Light',
    marginBottom: 8,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  elegantDivider: {
    width: 96,
    height: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 32,
    opacity: 0.3,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
  socialLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  socialLink: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
});

export default function Index() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
