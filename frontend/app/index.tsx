import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import EliteOnboarding from './onboarding/elite';
import DailyChallenges from './challenges/index';
import Authentication from './auth/index';
import UserProfileScreen from './profile/index';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setCurrentScreen('profile'); // Show profile after successful auth
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
    return <EliteOnboarding />;
  }

  // Daily Challenges Screen
  if (currentScreen === 'challenges') {
    return <DailyChallenges />;
  }

  // Home Screen
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.appTitle}>BABY GOATS</Text>
            <Text style={styles.tagline}>Where Champions Begin</Text>
          </View>

          {/* User Status */}
          {user && (
            <View style={styles.userStatusContainer}>
              <Text style={styles.welcomeText}>Welcome back, {user.name}! 👋</Text>
              <TouchableOpacity
                style={styles.profileLinkButton}
                onPress={() => setCurrentScreen('profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.profileLinkText}>View Profile →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>
              Transform your mindset. Build championship habits. Join the elite community of young athletes ready to unleash their potential.
            </Text>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonSection}>
            {/* Authentication Flow */}
            {!user && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCurrentScreen('auth')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>🚀 Join Baby Goats</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: '#4ecdc4' }]}
                  onPress={() => setCurrentScreen('auth')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>🏆 Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Authenticated User Options */}
            {user && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCurrentScreen('challenges')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>🎯 Today's Challenge</Text>
                </TouchableOpacity>

                {!user.sport && (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#feca57' }]}
                    onPress={() => setCurrentScreen('onboarding')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>⚡ Complete Onboarding</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Demo Options for Visitors */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentScreen('onboarding')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Preview Onboarding</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentScreen('challenges')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Preview Challenges</Text>
            </TouchableOpacity>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>What Awaits You:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🧠</Text>
                <Text style={styles.featureText}>Champion Mindset Training</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Daily G.O.A.T. Challenges</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🏆</Text>
                <Text style={styles.featureText}>Elite Community Access</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>Safe & Parent-Approved</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#ff6b6b',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  userStatusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  profileLinkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileLinkText: {
    color: '#4ecdc4',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 280,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 280,
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresSection: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 16,
    color: '#4ecdc4',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0c0c",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: '#ff6b6b',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 280,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    minWidth: 280,
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresSection: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 16,
    color: '#4ecdc4',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
