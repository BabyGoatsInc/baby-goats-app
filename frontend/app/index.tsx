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

  // Minimalist Home Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        <Text style={styles.brandName}>BABY GOATS</Text>
        <Text style={styles.tagline}>Built for Athletes Obsessed with Greatness.</Text>
        
        <TouchableOpacity
          style={styles.beginButton}
          onPress={() => setCurrentScreen('auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.beginText}>BEGIN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
