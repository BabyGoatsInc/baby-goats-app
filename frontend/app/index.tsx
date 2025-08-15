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
            <View style={styles.eyebrowContainer}>
              <Text style={styles.eyebrowFuture}>Future</Text>
              <Text style={styles.eyebrowLegends}>Legends</Text>
            </View>
            
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
                  JOIN THE LEGACY
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryCta, isTablet && styles.secondaryCtaTablet]}
                onPress={() => setCurrentScreen('onboarding')}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryCtaText, isTablet && styles.secondaryCtaTextTablet]}>
                  CHAMPION STORIES
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quote Section */}
          <View style={styles.quoteSection}>
            <Text style={[styles.quote, isTablet && styles.quoteTablet]}>
              "Champions aren't made in comfort zones"
            </Text>
            <View style={styles.kickerContainer}>
              <View style={styles.kickerLine} />
              <Text style={styles.kicker}>FOR THE NEXT GENERATION OF GOATS</Text>
            </View>
          </View>

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
    color: '#D23A3A',
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: 'System',
    marginBottom: 4,
  },
  eyebrowLegends: {
    fontSize: isTablet ? 18 : 16,
    color: '#D23A3A',
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
