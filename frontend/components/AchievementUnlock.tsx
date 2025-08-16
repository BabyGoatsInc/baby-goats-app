import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Animated, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Achievement } from '../lib/achievements';

const { width, height } = Dimensions.get('window');

interface AchievementUnlockProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function AchievementUnlock({ 
  achievement, 
  isVisible, 
  onClose 
}: AchievementUnlockProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible && achievement) {
      // Achievement unlock animation sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale up badge with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        // Sparkle effect
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Glow pulse effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        )
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      sparkleAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [isVisible, achievement]);

  if (!achievement) return null;

  const getDifficultyStyle = () => {
    const styles = {
      bronze: { backgroundColor: '#CD7F32', borderColor: '#A0522D' },
      silver: { backgroundColor: '#C0C0C0', borderColor: '#A9A9A9' },
      gold: { backgroundColor: '#FFD700', borderColor: '#DAA520' },
      platinum: { backgroundColor: '#E5E4E2', borderColor: '#D3D3D3' },
      legendary: { backgroundColor: '#B19CD9', borderColor: '#9370DB' }
    };
    return styles[achievement.difficulty];
  };

  const getRarityText = () => {
    const rarities = {
      common: 'ACHIEVEMENT UNLOCKED',
      rare: 'RARE ACHIEVEMENT UNLOCKED',
      epic: 'EPIC ACHIEVEMENT UNLOCKED',
      legendary: '🌟 LEGENDARY ACHIEVEMENT UNLOCKED 🌟'
    };
    return rarities[achievement.rarity];
  };

  const getSparkles = () => {
    return Array.from({ length: 12 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.sparkle,
          {
            opacity: sparkleAnim,
            transform: [
              {
                rotate: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
              {
                translateX: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos((i * 30) * Math.PI / 180) * 80],
                }),
              },
              {
                translateY: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin((i * 30) * Math.PI / 180) * 80],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>
    ));
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.touchableOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            
            {/* Achievement Badge with Glow */}
            <View style={styles.badgeContainer}>
              <Animated.View 
                style={[
                  styles.glowRing, 
                  getDifficultyStyle(),
                  { 
                    opacity: glowAnim,
                    transform: [{ 
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2]
                      })
                    }]
                  }
                ]} 
              />
              
              <View style={[styles.badge, { backgroundColor: achievement.badge_color }]}>
                <Text style={styles.badgeIcon}>{achievement.icon}</Text>
              </View>
              
              {/* Sparkles around badge */}
              <View style={styles.sparkleContainer}>
                {getSparkles()}
              </View>
            </View>

            {/* Achievement Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.rarityText}>{getRarityText()}</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              
              {achievement.unlock_message && (
                <Text style={styles.unlockMessage}>"{achievement.unlock_message}"</Text>
              )}
              
              <View style={styles.rewardContainer}>
                <Text style={styles.pointsText}>+{achievement.points_awarded} Points</Text>
                <View style={[styles.difficultyBadge, getDifficultyStyle()]}>
                  <Text style={styles.difficultyText}>
                    {achievement.difficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  badgeIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 16,
    color: '#FFD700',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  rarityText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  achievementDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 280,
  },
  unlockMessage: {
    color: '#FFE66D',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    maxWidth: 260,
    lineHeight: 20,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pointsText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});