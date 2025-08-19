import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// Import screens and components
import AuthScreen from './auth';
import OnboardingScreen from './onboarding';
import ChallengesIndexScreen from './challenges';
import ProfileIndexScreen from './profile';
import GoalsIndexScreen from './goals';
import AchievementsIndexScreen from './achievements';
import FeedScreen from './social/feed';
import FriendsScreen from './social/friends';
import SocialProfileScreen from './social/profile';
import TeamsScreen from './teams'; // New teams screen
import StreamingIndex from './streaming'; // New streaming screen

// Import components
import SocialNotifications from '../components/SocialNotifications';
import RealtimeNotifications from '../components/RealtimeNotifications';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;

type Screen = 'auth' | 'onboarding' | 'home' | 'challenges' | 'profile' | 'goals' | 'achievements' | 
              'social_feed' | 'social_friends' | 'social_profile' | 'social_messages' | 'social_leaderboards' | 'teams' | 'streaming';

export default function Index() {
  const { user, signOut, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setCurrentScreen('auth');
      } else if (showOnboarding) {
        setCurrentScreen('onboarding');
      } else {
        setCurrentScreen('home');
      }
    }
  }, [user, isLoading, showOnboarding]);

  const handleAuthSuccess = () => {
    setShowOnboarding(true);
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setCurrentScreen('home');
  };

  const MainApp = () => (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || 'Champion'}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => setCurrentScreen('profile')}>
              <Text style={styles.profileButtonText}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Arena Status */}
          <View style={styles.arenaSection}>
            <Text style={styles.sectionTitle}>⚡ THE ARENA</Text>
            <Text style={styles.arenaSubtitle}>Where champions are forged</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>CHALLENGES</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>847</Text>
                <Text style={styles.statLabel}>POINTS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>STREAK</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>🚀 CHAMPION ACTIONS</Text>
            
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setCurrentScreen('challenges')}
              >
                <Text style={styles.actionEmoji}>💪</Text>
                <Text style={styles.actionText}>CHALLENGES</Text>
                <Text style={styles.actionSubtext}>Push your limits</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setCurrentScreen('goals')}
              >
                <Text style={styles.actionEmoji}>🎯</Text>
                <Text style={styles.actionText}>PROGRESS</Text>
                <Text style={styles.actionSubtext}>Track your journey</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setCurrentScreen('achievements')}
              >
                <Text style={styles.actionEmoji}>🏆</Text>
                <Text style={styles.actionText}>ACHIEVEMENTS</Text>
                <Text style={styles.actionSubtext}>Unlock greatness</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setCurrentScreen('teams')}
              >
                <Text style={styles.actionEmoji}>👥</Text>
                <Text style={styles.actionText}>TEAMS</Text>
                <Text style={styles.actionSubtext}>Join forces</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.liveStreamingButton]}
                onPress={() => setCurrentScreen('streaming')}
              >
                <Text style={styles.actionEmoji}>🎥</Text>
                <Text style={[styles.actionText, styles.liveStreamingText]}>LIVE STREAMING</Text>
                <Text style={[styles.actionSubtext, styles.liveStreamingSubtext]}>Broadcast to champions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Connect With Champions */}
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>🤝 CONNECT WITH CHAMPIONS</Text>
            <Text style={styles.sectionSubtitle}>Build your network of elite young athletes</Text>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => setCurrentScreen('social_feed')}
              >
                <Text style={styles.socialButtonEmoji}>📢</Text>
                <Text style={styles.socialButtonText}>ACTIVITY FEED</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => setCurrentScreen('social_friends')}
              >
                <Text style={styles.socialButtonEmoji}>👥</Text>
                <Text style={styles.socialButtonText}>FRIENDS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => setCurrentScreen('social_profile')}
              >
                <Text style={styles.socialButtonEmoji}>👤</Text>
                <Text style={styles.socialButtonText}>MY PROFILE</Text>
              </TouchableOpacity>
            </View>

            {/* New Advanced Social Features */}
            <View style={styles.advancedSocialButtons}>
              <TouchableOpacity 
                style={styles.advancedSocialButton}
                onPress={() => setCurrentScreen('social_messages')}
              >
                <Text style={styles.advancedSocialButtonEmoji}>💬</Text>
                <Text style={styles.advancedSocialButtonText}>LIVE CHAT</Text>
                <Text style={styles.advancedSocialButtonSubtext}>Message friends</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedSocialButton}
                onPress={() => setCurrentScreen('social_leaderboards')}
              >
                <Text style={styles.advancedSocialButtonEmoji}>🏆</Text>
                <Text style={styles.advancedSocialButtonText}>LEADERBOARDS</Text>
                <Text style={styles.advancedSocialButtonSubtext}>Rankings & competition</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Real-time Notifications */}
          <RealtimeNotifications />

          {/* Social Notifications */}
          <SocialNotifications />

          {/* Elite Mindset */}
          <View style={styles.mindsetSection}>
            <Text style={styles.sectionTitle}>🧠 ELITE MINDSET</Text>
            <Text style={styles.mindsetQuote}>
              "Champions aren't made in comfort zones. Every rep, every challenge, every moment of discomfort is building the champion within you."
            </Text>
            <Text style={styles.mindsetAuthor}>- Baby Goats Elite Training</Text>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );

  const renderContent = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'challenges':
        return <ChallengesIndexScreen />;
      case 'profile':
        return <ProfileIndexScreen />;
      case 'goals':
        return <GoalsIndexScreen />;
      case 'achievements':
        return <AchievementsIndexScreen />;
      case 'social_feed':
        return <FeedScreen onBack={() => setCurrentScreen('home')} />;
      case 'social_friends':
        return <FriendsScreen onBack={() => setCurrentScreen('home')} />;
      case 'social_profile':
        return <SocialProfileScreen onBack={() => setCurrentScreen('home')} />;
      case 'teams':
        return <TeamsScreen />;
      case 'streaming':
        return <StreamingIndex onBack={() => setCurrentScreen('home')} />;
      case 'social_messages':
        return (
          <View style={styles.screenContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Live Chat & Messaging</Text>
            <Text style={styles.screenDescription}>
              Connect and chat with your friends in real-time. Stay motivated together!
            </Text>
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonEmoji}>💬</Text>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                Live messaging features are being developed. You'll be able to chat with friends, 
                share achievements, and motivate each other in real-time.
              </Text>
            </View>
          </View>
        );
      case 'social_leaderboards':
        return (
          <View style={styles.screenContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Leaderboards & Rankings</Text>
            <Text style={styles.screenDescription}>
              See how you rank among elite young athletes worldwide.
            </Text>
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonEmoji}>🏆</Text>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonText}>
                Competitive leaderboards are being developed. Track your progress against 
                other athletes and climb the rankings!
              </Text>
            </View>
          </View>
        );
      case 'home':
      default:
        return <MainApp />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Baby Goats...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  greeting: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },

  // Sections
  arenaSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  socialSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mindsetSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  arenaSubtitle: {
    color: '#EC1616',
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 22, 22, 0.3)',
  },
  statNumber: {
    color: '#EC1616',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actionSubtext: {
    color: '#CCCCCC',
    fontSize: 11,
    textAlign: 'center',
  },

  // Social Buttons
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialButtonEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Advanced Social Features Buttons
  advancedSocialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  advancedSocialButton: {
    backgroundColor: 'rgba(236, 22, 22, 0.1)',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 22, 22, 0.3)',
  },
  advancedSocialButtonEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  advancedSocialButtonText: {
    color: '#EC1616',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  advancedSocialButtonSubtext: {
    color: '#CCCCCC',
    fontSize: 11,
    textAlign: 'center',
  },

  // Mindset Section
  mindsetQuote: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  mindsetAuthor: {
    color: '#EC1616',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Sign Out
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  signOutText: {
    color: '#CCCCCC',
    fontSize: 14,
  },

  // Screen Container for Coming Soon screens
  screenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  screenDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  comingSoonEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  comingSoonTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: isTablet ? 500 : 300,
  },
});