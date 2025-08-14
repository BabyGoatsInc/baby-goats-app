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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getPerformanceLevel = (age: number) => {
    if (age <= 10) return 'DEVELOPING';
    if (age <= 13) return 'ADVANCING';
    return 'ELITE';
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

  const totalProgress = user.pillarProgress 
    ? user.pillarProgress.resilient + user.pillarProgress.relentless + user.pillarProgress.fearless
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Elite Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => onNavigateTo('home')} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>ATHLETE</Text>
            
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.logoutButton}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>Exit</Text>
            </TouchableOpacity>
          </View>

          {/* Athlete Identity */}
          <View style={styles.identitySection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.athleteName}>{user.name.toUpperCase()}</Text>
            <Text style={styles.performanceLevel}>{getPerformanceLevel(user.age)} ATHLETE</Text>
            <Text style={styles.ageInfo}>Age {user.age}</Text>
            
            {user.sport && (
              <View style={styles.sportBadge}>
                <Text style={styles.sportText}>{user.sport.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Performance Metrics */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>PERFORMANCE METRICS</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{user.currentStreak || 0}</Text>
                <Text style={styles.metricLabel}>Day Streak</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{totalProgress}</Text>
                <Text style={styles.metricLabel}>Development Points</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{user.totalChallengesCompleted || 0}</Text>
                <Text style={styles.metricLabel}>Protocols Completed</Text>
              </View>
            </View>
          </View>

          {/* Character Development */}
          {user.pillarProgress && (
            <View style={styles.developmentSection}>
              <Text style={styles.sectionTitle}>CHARACTER DEVELOPMENT</Text>
              
              <View style={styles.pillarList}>
                <View style={styles.pillarRow}>
                  <Text style={styles.pillarName}>RESILIENT</Text>
                  <View style={styles.pillarProgress}>
                    <View style={[styles.progressBar, { width: `${Math.min(user.pillarProgress.resilient * 5, 100)}%` }]} />
                  </View>
                  <Text style={styles.pillarValue}>{user.pillarProgress.resilient}</Text>
                </View>
                
                <View style={styles.pillarRow}>
                  <Text style={styles.pillarName}>RELENTLESS</Text>
                  <View style={styles.pillarProgress}>
                    <View style={[styles.progressBar, { width: `${Math.min(user.pillarProgress.relentless * 5, 100)}%` }]} />
                  </View>
                  <Text style={styles.pillarValue}>{user.pillarProgress.relentless}</Text>
                </View>
                
                <View style={styles.pillarRow}>
                  <Text style={styles.pillarName}>FEARLESS</Text>
                  <View style={styles.pillarProgress}>
                    <View style={[styles.progressBar, { width: `${Math.min(user.pillarProgress.fearless * 5, 100)}%` }]} />
                  </View>
                  <Text style={styles.pillarValue}>{user.pillarProgress.fearless}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Training Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>TRAINING ACCESS</Text>
            
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => onNavigateTo('challenges')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>Access Training Protocols</Text>
            </TouchableOpacity>

            {!user.sport && (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => onNavigateTo('onboarding')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionText}>Complete Assessment</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>PROFILE DATA</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>Active Development</Text>
            </View>
            
            {user.sport && user.interestLevel && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Commitment Level</Text>
                <Text style={styles.infoValue}>{user.interestLevel}/10</Text>
              </View>
            )}

            {!user.isParentApproved && user.parentEmail && (
              <View style={styles.approvalNotice}>
                <Text style={styles.approvalText}>
                  Guardian approval pending: {user.parentEmail}
                </Text>
              </View>
            )}
          </View>

          {/* Elite Quote */}
          <View style={styles.quoteSection}>
            <Text style={styles.quote}>
              "Excellence is not a skill, it's an attitude."
            </Text>
            <Text style={styles.quoteSource}>— Elite Performance Philosophy</Text>
          </View>
        </ScrollView>
      </Animated.View>
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