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
            
            <Text style={styles.headerTitle}>BABY GOATS</Text>
            
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
            <Text style={styles.performanceLevel}>{getPerformanceLevel(user.age)} BABY GOAT</Text>
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
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 4,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '400',
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
  },
  athleteName: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 8,
  },
  performanceLevel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 4,
  },
  ageInfo: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '300',
    marginBottom: 16,
  },
  sportBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sportText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1,
  },
  metricsSection: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 1,
    textAlign: 'center',
  },
  developmentSection: {
    marginBottom: 48,
  },
  pillarList: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pillarName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 1,
    width: 90,
  },
  pillarProgress: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    borderRadius: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  pillarValue: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '400',
    width: 24,
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: 48,
  },
  primaryAction: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 48,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '400',
  },
  approvalNotice: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  approvalText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
  quoteSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quote: {
    color: '#666666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '300',
  },
  quoteSource: {
    color: '#444444',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '400',
  },
});