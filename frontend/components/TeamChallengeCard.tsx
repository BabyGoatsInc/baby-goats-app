import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'collaborative' | 'competitive' | 'relay' | 'cumulative';
  sport?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  min_team_size: number;
  max_team_size: number;
  target_metric: string;
  target_value: number;
  team_points_reward: number;
  individual_points_reward: number;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TeamChallengeProgress {
  id: string;
  current_progress: number;
  completion_percentage: number;
  status: 'registered' | 'active' | 'completed' | 'failed' | 'withdrawn';
  registered_at: string;
  completed_at?: string;
  final_score?: number;
  team_rank?: number;
  points_earned: number;
}

interface TeamChallengeCardProps {
  challenge: TeamChallenge;
  participation?: TeamChallengeProgress;
  onPress?: (challenge: TeamChallenge) => void;
  onRegister?: (challenge: TeamChallenge) => void;
  showRegisterButton?: boolean;
  compact?: boolean;
}

export default function TeamChallengeCard({ 
  challenge, 
  participation,
  onPress, 
  onRegister,
  showRegisterButton = false,
  compact = false 
}: TeamChallengeCardProps) {

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'collaborative': return '🤝';
      case 'competitive': return '⚡';
      case 'relay': return '🔄';
      case 'cumulative': return '📈';
      default: return '💪';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      case 'elite': return '#9C27B0';
      default: return '#FF9800';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'basketball': return '🏀';
      case 'soccer': return '⚽';
      case 'baseball': return '⚾';
      case 'tennis': return '🎾';
      case 'track': return '🏃‍♂️';
      case 'swimming': return '🏊‍♂️';
      case 'volleyball': return '🏐';
      case 'general': return '🏃‍♂️';
      default: return '🏃‍♂️';
    }
  };

  const formatTargetValue = (metric: string, value: number) => {
    switch (metric) {
      case 'total_challenges_completed':
        return `${value} challenges`;
      case 'total_points':
        return `${value} points`;
      case 'average_accuracy_percentage':
        return `${value}% accuracy`;
      case 'total_distance_km':
        return `${value} km`;
      case 'total_time_minutes':
        return `${value} minutes`;
      case 'team_collaboration_score':
        return `${value} collaboration points`;
      default:
        return `${value}`;
    }
  };

  const getTimeRemaining = () => {
    if (!challenge.end_date) return null;
    
    const endDate = new Date(challenge.end_date);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ended';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h remaining`;
    } else {
      return 'Ending soon';
    }
  };

  const isRegistered = !!participation;
  const isCompleted = participation?.status === 'completed';
  const progressPercentage = participation?.completion_percentage || 0;

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={() => onPress?.(challenge)}
        activeOpacity={0.8}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>
            {getChallengeTypeIcon(challenge.challenge_type)}
          </Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {challenge.title}
            </Text>
            <Text style={styles.compactMeta}>
              {challenge.team_points_reward} pts • {challenge.min_team_size}-{challenge.max_team_size} members
            </Text>
          </View>
          {isRegistered && (
            <View style={[
              styles.compactStatus,
              isCompleted ? styles.completedStatus : styles.activeStatus
            ]}>
              <Text style={styles.compactStatusText}>
                {isCompleted ? '✓' : `${Math.round(progressPercentage)}%`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(challenge)}
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={['rgba(236, 22, 22, 0.1)', 'rgba(0, 0, 0, 0.05)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>
              {getChallengeTypeIcon(challenge.challenge_type)}
            </Text>
            <Text style={styles.challengeType}>
              {challenge.challenge_type.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.badges}>
            {challenge.sport && challenge.sport !== 'general' && (
              <View style={styles.sportBadge}>
                <Text style={styles.sportIcon}>
                  {getSportIcon(challenge.sport)}
                </Text>
              </View>
            )}
            <View style={[
              styles.difficultyBadge, 
              { backgroundColor: getDifficultyColor(challenge.difficulty_level) }
            ]}>
              <Text style={styles.difficultyText}>
                {challenge.difficulty_level.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {challenge.title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>
          {challenge.description}
        </Text>

        {/* Challenge Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target:</Text>
            <Text style={styles.detailValue}>
              {formatTargetValue(challenge.target_metric, challenge.target_value)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Team Size:</Text>
            <Text style={styles.detailValue}>
              {challenge.min_team_size}-{challenge.max_team_size} members
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {challenge.duration_days} days
            </Text>
          </View>
        </View>

        {/* Progress Bar (if participating) */}
        {isRegistered && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Team Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? '#4CAF50' : '#EC1616'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {participation?.current_progress || 0} / {challenge.target_value}
            </Text>
          </View>
        )}

        {/* Rewards */}
        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🏆</Text>
            <Text style={styles.rewardText}>
              {challenge.team_points_reward} team points
            </Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardText}>
              {challenge.individual_points_reward} individual points
            </Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeContainer}>
          {getTimeRemaining() && (
            <Text style={styles.timeRemaining}>
              ⏰ {getTimeRemaining()}
            </Text>
          )}
          {challenge.creator && (
            <Text style={styles.creator}>
              Created by {challenge.creator.full_name}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isRegistered ? (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                isCompleted ? styles.completedBadge : styles.activeBadge
              ]}>
                <Text style={styles.statusText}>
                  {isCompleted ? '✅ Completed' : '⚡ Active'}
                </Text>
              </View>
              {isCompleted && participation?.points_earned && (
                <Text style={styles.pointsEarned}>
                  +{participation.points_earned} points earned!
                </Text>
              )}
            </View>
          ) : showRegisterButton ? (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => onRegister?.(challenge)}
              activeOpacity={0.7}
            >
              <Text style={styles.registerButtonText}>
                Register Team
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  challengeType: {
    color: '#EC1616',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportBadge: {
    marginRight: 8,
  },
  sportIcon: {
    fontSize: 18,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#999999',
    fontSize: 13,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    color: '#EC1616',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  rewardIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rewardText: {
    color: '#CCCCCC',
    fontSize: 13,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRemaining: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '500',
  },
  creator: {
    color: '#999999',
    fontSize: 11,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsEarned: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#EC1616',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Compact styles
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactMeta: {
    color: '#999999',
    fontSize: 11,
  },
  compactStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  activeStatus: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
  },
  completedStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  compactStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});