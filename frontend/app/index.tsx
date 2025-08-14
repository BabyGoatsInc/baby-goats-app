import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
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

  // Elite Home Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        {/* Elite Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>BABY GOATS</Text>
          <Text style={styles.tagline}>Elite Development Platform</Text>
        </View>

        {/* User Status */}
        {user && (
          <View style={styles.userStatusContainer}>
            <Text style={styles.welcomeText}>Welcome back, {user.name}</Text>
            <TouchableOpacity
              style={styles.profileLink}
              onPress={() => setCurrentScreen('profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.profileLinkText}>View Performance →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mission Statement */}
        <View style={styles.missionSection}>
          <Text style={styles.missionText}>
            Transform potential into performance. Master the mental game. Join the elite.
          </Text>
        </View>

        {/* Elite Actions */}
        <View style={styles.actionsSection}>
          {/* Authentication Flow */}
          {!user && (
            <>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => setCurrentScreen('auth')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>Begin Elite Training</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => setCurrentScreen('auth')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionText}>Access Account</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Authenticated User Options */}
          {user && (
            <>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => setCurrentScreen('challenges')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>Training Protocol</Text>
              </TouchableOpacity>

              {!user.sport && (
                <TouchableOpacity
                  style={styles.progressAction}
                  onPress={() => setCurrentScreen('onboarding')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.progressActionText}>Complete Assessment</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Demo Access */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Explore Platform</Text>
            <TouchableOpacity
              style={styles.demoAction}
              onPress={() => setCurrentScreen('onboarding')}
              activeOpacity={0.8}
            >
              <Text style={styles.demoActionText}>Assessment Process</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.demoAction}
              onPress={() => setCurrentScreen('challenges')}
              activeOpacity={0.8}
            >
              <Text style={styles.demoActionText}>Training Protocols</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Elite Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Platform Capabilities</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon} />
              <Text style={styles.featureText}>Mental Performance</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon} />
              <Text style={styles.featureText}>Elite Protocols</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon} />
              <Text style={styles.featureText}>Performance Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon} />
              <Text style={styles.featureText}>Secure Development</Text>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 60,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  userStatusContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  profileLink: {
    alignSelf: 'flex-start',
  },
  profileLinkText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '400',
  },
  missionSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  missionText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    fontWeight: '300',
  },
  actionsSection: {
    marginBottom: 48,
  },
  primaryAction: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginBottom: 24,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
  progressAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 4,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressActionText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
  },
  demoSection: {
    alignItems: 'center',
  },
  demoLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  demoAction: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  demoActionText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  featuresSection: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 4,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 8,
  },
  featureText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
