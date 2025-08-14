import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';

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

interface ProfileProps {
  user: UserProfile;
  onNavigateTo: (screen: 'challenges' | 'onboarding' | 'home') => void;
  onLogout: () => void;
}

export default function UserProfileScreen({ user, onNavigateTo, onLogout }: ProfileProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getAgeGroup = (age: number) => {
    if (age <= 10) return 'Young Champion';
    if (age <= 13) return 'Rising Star';
    return 'Future Elite';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Every champion started exactly where you are! 🌟",
      "Your journey to greatness begins with today! 🚀",
      "Champions aren't made overnight, they're made every day! ⚡",
      "The only way to become great is to start! 🔥",
      "Your potential is unlimited - let's unlock it! 🗝️"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const totalPillarProgress = user.pillarProgress 
    ? user.pillarProgress.resilient + user.pillarProgress.relentless + user.pillarProgress.fearless
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => onNavigateTo('home')} style={styles.backButton}>
                <Text style={styles.backText}>← Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#ff6b6b', '#feca57', '#4ecdc4']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {user.name.substring(0, 2).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileAgeGroup}>{getAgeGroup(user.age)}</Text>
              <Text style={styles.profileAge}>Age {user.age}</Text>
              
              {user.sport && (
                <View style={styles.sportBadge}>
                  <Text style={styles.sportText}>🏆 {user.sport} Athlete</Text>
                </View>
              )}

              {!user.isParentApproved && user.parentEmail && (
                <View style={styles.approvalNotice}>
                  <Text style={styles.approvalText}>
                    🛡️ Waiting for parent approval at {user.parentEmail}
                  </Text>
                </View>
              )}
            </View>

            {/* Motivational Message */}
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationMessage}>{getMotivationalMessage()}</Text>
            </View>

            {/* Progress Stats */}
            {totalPillarProgress > 0 && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Your Champion Progress</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.currentStreak || 0}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalPillarProgress}</Text>
                    <Text style={styles.statLabel}>Character Points</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.totalChallengesCompleted || 0}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                </View>

                {/* Pillar Progress */}
                {user.pillarProgress && (
                  <View style={styles.pillarContainer}>
                    <Text style={styles.pillarTitle}>Character Pillars</Text>
                    <View style={styles.pillarGrid}>
                      <View style={[styles.pillarCard, { backgroundColor: '#4ecdc4' }]}>
                        <Text style={styles.pillarIcon}>🛡️</Text>
                        <Text style={styles.pillarName}>RESILIENT</Text>
                        <Text style={styles.pillarCount}>{user.pillarProgress.resilient}</Text>
                      </View>
                      <View style={[styles.pillarCard, { backgroundColor: '#ff6b6b' }]}>
                        <Text style={styles.pillarIcon}>🔥</Text>
                        <Text style={styles.pillarName}>RELENTLESS</Text>
                        <Text style={styles.pillarCount}>{user.pillarProgress.relentless}</Text>
                      </View>
                      <View style={[styles.pillarCard, { backgroundColor: '#feca57' }]}>
                        <Text style={styles.pillarIcon}>⚡</Text>
                        <Text style={styles.pillarName}>FEARLESS</Text>
                        <Text style={styles.pillarCount}>{user.pillarProgress.fearless}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => onNavigateTo('challenges')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>🎯 Today's Challenge</Text>
              </TouchableOpacity>

              {!user.sport && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() => onNavigateTo('onboarding')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>⚡ Complete Onboarding</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.tertiaryAction]}
                onPress={() => {
                  Alert.alert(
                    '🚧 Coming Soon!',
                    'Training plans, achievements, and more features are being built by our champion developers!',
                    [{ text: 'Can\'t Wait!', style: 'default' }]
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>📊 View Achievements</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Profile Details</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Member Since:</Text>
                <Text style={styles.infoValue}>Today (Welcome!)</Text>
              </View>
              
              {user.sport && user.interestLevel && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Sport Passion:</Text>
                  <Text style={styles.infoValue}>{user.interestLevel}/10 🔥</Text>
                </View>
              )}
            </View>

            {/* Champion Quote */}
            <View style={styles.quoteContainer}>
              <Text style={styles.quote}>
                "Success isn't given. It's earned in the gym, on the field, and in every single choice you make."
              </Text>
              <Text style={styles.quoteAuthor}>— Champion's Mindset</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileAgeGroup: {
    fontSize: 16,
    color: '#feca57',
    fontWeight: '600',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  sportBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  sportText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  approvalNotice: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  approvalText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  motivationContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  motivationMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  pillarContainer: {
    marginTop: 10,
  },
  pillarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  pillarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pillarCard: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  pillarIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  pillarName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  pillarCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionContainer: {
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryAction: {
    backgroundColor: '#4ecdc4',
  },
  secondaryAction: {
    backgroundColor: '#ff6b6b',
  },
  tertiaryAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});