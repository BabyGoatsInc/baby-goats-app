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
    backgroundColor: '#0B0C0E',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222326',
  },
  brandName: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'System', // Saira Extra Condensed fallback
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navText: {
    fontSize: 14,
    color: '#B3B3B3',
    fontWeight: '400',
    fontFamily: 'System', // Inter fallback
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 120 : 80,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrowContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 48 : 32,
  },
  eyebrowFuture: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'System',
    marginBottom: 4,
  },
  eyebrowLegends: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 2,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  heroContent: {
    marginBottom: isTablet ? 56 : 48,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  heroBody: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '300',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  heroBodyTablet: {
    fontSize: 22,
    lineHeight: 34,
    paddingHorizontal: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 32 : 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryCta: {
    borderWidth: 1,
    borderColor: '#D23A3A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 2,
    minWidth: isTablet ? 200 : 160,
    alignItems: 'center',
  },
  primaryCtaTablet: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 220,
  },
  primaryCtaText: {
    color: '#D23A3A',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 1.5,
    fontFamily: 'System',
  },
  primaryCtaTextTablet: {
    fontSize: 14,
    letterSpacing: 1.8,
  },
  secondaryCta: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 2,
    minWidth: isTablet ? 200 : 160,
    alignItems: 'center',
  },
  secondaryCtaTablet: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 220,
  },
  secondaryCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 1.5,
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  secondaryCtaTextTablet: {
    fontSize: 14,
    letterSpacing: 1.8,
  },

  // Quote Section
  quoteSection: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 100 : 80,
    alignItems: 'center',
    marginBottom: isTablet ? 100 : 80,
  },
  quote: {
    fontSize: isTablet ? 32 : 26,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: isTablet ? 42 : 34,
    marginBottom: isTablet ? 32 : 24,
    fontFamily: 'System',
    maxWidth: 600,
  },
  quoteTablet: {
    fontSize: 36,
    lineHeight: 46,
  },
  kickerContainer: {
    alignItems: 'center',
  },
  kickerLine: {
    width: 40,
    height: 1,
    backgroundColor: '#333333',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 80 : 60,
    borderTopWidth: 1,
    borderColor: '#222326',
    marginBottom: isTablet ? 100 : 80,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: isTablet ? 48 : 36,
    color: '#FFFFFF',
    fontWeight: '300',
    letterSpacing: -1,
    marginBottom: 12,
    fontFamily: 'System',
  },
  statValueTablet: {
    fontSize: 56,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'System',
    lineHeight: 16,
  },
  statLabelTablet: {
    fontSize: 12,
    letterSpacing: 1.2,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 80 : 60,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#222326',
  },
  footerTagline: {
    fontSize: 11,
    color: '#666666',
    marginBottom: isTablet ? 40 : 32,
    fontFamily: 'System',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socialLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLink: {
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: 8,
  },
  socialText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socialDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#222326',
  },
});
