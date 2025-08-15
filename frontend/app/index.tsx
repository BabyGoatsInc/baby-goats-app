import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from "react-native";

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
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

  // Animation values for luxury entrance
  const navOpacity = useSharedValue(0);
  const navTranslateY = useSharedValue(-20);
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(40);
  const bodyOpacity = useSharedValue(0);
  const bodyTranslateY = useSharedValue(30);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(20);
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(20);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(30);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Orchestrated entrance animations
    navOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    navTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });

    heroOpacity.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    heroTranslateY.value = withDelay(300, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));

    bodyOpacity.value = withDelay(600, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    bodyTranslateY.value = withDelay(600, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));

    ctaOpacity.value = withDelay(900, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    ctaTranslateY.value = withDelay(900, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));

    quoteOpacity.value = withDelay(1200, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    quoteTranslateY.value = withDelay(1200, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));

    statsOpacity.value = withDelay(1500, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    statsTranslateY.value = withDelay(1500, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));

    footerOpacity.value = withDelay(2000, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  // Animated styles
  const navAnimatedStyle = useAnimatedStyle(() => ({
    opacity: navOpacity.value,
    transform: [{ translateY: navTranslateY.value }]
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

  // Other screen components remain the same
  if (currentScreen === 'auth') {
    return (
      <Authentication 
        onAuthSuccess={handleAuthSuccess}
        onBack={handleBackToHome}
      />
    );
  }

  if (currentScreen === 'profile' && user) {
    return (
      <UserProfileScreen 
        user={user}
        onNavigateTo={handleScreenNavigation}
        onLogout={handleLogout}
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
      
      {/* Navigation */}
      <Animated.View style={[styles.navigation, navAnimatedStyle]}>
        <Text style={styles.brandName}>BABY GOATS</Text>
        <View style={styles.navLinks}>
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
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    marginBottom: isTablet ? 48 : 32,
  },
  heroTitle: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'System',
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
    fontWeight: '300',
    letterSpacing: 0.3,
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    fontFamily: 'System',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  quoteAttribution: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'System',
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
    fontFamily: 'System',
    marginBottom: 8,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'System',
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
    fontFamily: 'System',
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
    fontFamily: 'System',
  },
});
