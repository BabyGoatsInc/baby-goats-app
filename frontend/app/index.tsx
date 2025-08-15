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
    paddingVertical: isTablet ? 80 : 60,
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: isTablet ? 16 : 14,
    color: '#D23A3A',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: isTablet ? 32 : 24,
    fontFamily: 'System',
  },
  heroContent: {
    marginBottom: isTablet ? 48 : 40,
  },
  heroBody: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  heroBodyTablet: {
    fontSize: 22,
    lineHeight: 34,
  },
  ctaContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: 'center',
    gap: isTablet ? 24 : 16,
  },
  primaryCta: {
    backgroundColor: '#D23A3A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: isTablet ? 180 : 160,
    alignItems: 'center',
  },
  primaryCtaTablet: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    minWidth: 200,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  primaryCtaTextTablet: {
    fontSize: 18,
  },
  secondaryCta: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: isTablet ? 180 : 160,
    alignItems: 'center',
  },
  secondaryCtaTablet: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    minWidth: 200,
  },
  secondaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  secondaryCtaTextTablet: {
    fontSize: 18,
  },

  // Quote Section
  quoteSection: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 80 : 60,
    alignItems: 'center',
    backgroundColor: 'rgba(210, 58, 58, 0.05)',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: isTablet ? 80 : 60,
  },
  quote: {
    fontSize: isTablet ? 32 : 24,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: -0.5,
    lineHeight: isTablet ? 40 : 32,
    marginBottom: 16,
    fontFamily: 'System', // Saira Extra Condensed fallback
  },
  quoteTablet: {
    fontSize: 36,
    lineHeight: 44,
  },
  kicker: {
    fontSize: 14,
    color: '#B3B3B3',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 60 : 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222326',
    marginBottom: isTablet ? 80 : 60,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: isTablet ? 48 : 36,
    color: '#D23A3A',
    fontWeight: '300',
    letterSpacing: -1,
    marginBottom: 8,
    fontFamily: 'System', // Saira Extra Condensed fallback
  },
  statValueTablet: {
    fontSize: 56,
  },
  statLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  statLabelTablet: {
    fontSize: 14,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: isTablet ? 60 : 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#222326',
  },
  footerTagline: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 24,
    fontFamily: 'System',
  },
  socialLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  socialText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'System',
  },
  socialDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#222326',
  },
});
