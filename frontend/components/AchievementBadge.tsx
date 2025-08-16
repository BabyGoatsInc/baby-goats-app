import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement, UserAchievement } from '../lib/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number; // 0-100 for unlocked achievements
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showProgress?: boolean;
}

export default function AchievementBadge({ 
  achievement, 
  userAchievement,
  progress = 0,
  size = 'medium',
  onPress,
  showProgress = true
}: AchievementBadgeProps) {
  
  const isEarned = !!userAchievement;
  const isHidden = achievement.is_hidden && !isEarned;
  
  const sizes = {
    small: { badge: 50, icon: 20, title: 12, progress: 3 },
    medium: { badge: 70, icon: 28, title: 14, progress: 4 },
    large: { badge: 90, icon: 36, title: 16, progress: 5 },
  };
  
  const currentSize = sizes[size];
  
  const getBadgeStyle = () => {
    const baseStyle = [
      styles.badge,
      {
        width: currentSize.badge,
        height: currentSize.badge,
        borderRadius: currentSize.badge / 2,
      }
    ];

    if (isHidden) {
      return [...baseStyle, styles.hiddenBadge];
    }

    if (isEarned) {
      return [...baseStyle, { 
        backgroundColor: achievement.badge_color,
        borderColor: achievement.badge_color,
        borderWidth: 3,
      }];
    }

    return [...baseStyle, styles.unlockedBadge];
  };

  const getIconStyle = () => ({
    fontSize: currentSize.icon,
    opacity: isHidden ? 0.3 : isEarned ? 1 : 0.5,
  });

  const getTitleStyle = () => [
    styles.title,
    { fontSize: currentSize.title },
    isEarned ? styles.earnedTitle : styles.unearnedTitle
  ];

  const getDifficultyColor = () => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0', 
      gold: '#FFD700',
      platinum: '#E5E4E2',
      legendary: '#B19CD9'
    };
    return colors[achievement.difficulty];
  };

  const getRarityIndicator = () => {
    const indicators = {
      common: '●',
      rare: '◆',
      epic: '★',
      legendary: '♦'
    };
    return indicators[achievement.rarity];
  };

  const content = (
    <View style={styles.container}>
      {/* Badge Circle */}
      <View style={getBadgeStyle()}>
        {showProgress && !isEarned && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressBar,
              {
                height: currentSize.progress,
                width: `${progress}%`,
                backgroundColor: achievement.badge_color
              }
            ]} />
          </View>
        )}
        
        <Text style={[styles.icon, getIconStyle()]}>
          {isHidden ? '?' : achievement.icon}
        </Text>
      </View>
      
      {/* Achievement Title */}
      <Text style={getTitleStyle()} numberOfLines={2}>
        {isHidden ? 'Hidden' : achievement.title}
      </Text>
      
      {/* Difficulty & Rarity Indicators */}
      {size !== 'small' && (
        <View style={styles.indicators}>
          <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor() }]} />
          <Text style={styles.rarityIndicator}>
            {getRarityIndicator()}
          </Text>
        </View>
      )}
      
      {/* Points */}
      {isEarned && size !== 'small' && (
        <Text style={styles.points}>+{achievement.points_awarded}</Text>
      )}
      
      {/* Progress Text */}
      {!isEarned && progress > 0 && showProgress && size !== 'small' && (
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
    maxWidth: 100,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hiddenBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  unlockedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  icon: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    lineHeight: 16,
  },
  earnedTitle: {
    color: '#FFFFFF',
  },
  unearnedTitle: {
    color: '#CCCCCC',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rarityIndicator: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  points: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressText: {
    color: '#FFE66D',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
});