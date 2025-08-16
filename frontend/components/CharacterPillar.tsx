import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CharacterPillar as PillarType, CHARACTER_PILLARS_CONFIG } from '../lib/goals';

interface CharacterPillarProps {
  pillar: PillarType;
  onPress?: () => void;
  compact?: boolean;
}

export default function CharacterPillar({ pillar, onPress, compact = false }: CharacterPillarProps) {
  const config = CHARACTER_PILLARS_CONFIG[pillar.name];
  const progressWidth = `${Math.min(pillar.progress_percentage, 100)}%`;

  const containerStyle = compact ? styles.compactContainer : styles.container;
  const titleStyle = compact ? styles.compactTitle : styles.title;
  
  const content = (
    <View style={[containerStyle, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.icon}>{config.icon}</Text>
          <View>
            <Text style={titleStyle}>{config.display_name}</Text>
            {!compact && (
              <Text style={styles.description}>{config.description}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.statsSection}>
          <Text style={styles.percentage}>{pillar.progress_percentage}%</Text>
          {!compact && (
            <Text style={styles.completionStats}>
              {pillar.completed_goals}/{pillar.total_goals} Goals
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: progressWidth,
                backgroundColor: config.color 
              }
            ]} 
          />
        </View>
      </View>

      {!compact && (
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{pillar.current_streak}</Text>
            <Text style={styles.metricLabel}>Current Streak</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{pillar.best_streak}</Text>
            <Text style={styles.metricLabel}>Best Streak</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{pillar.completed_goals}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
        </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  compactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
    maxWidth: 200,
  },
  statsSection: {
    alignItems: 'flex-end',
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  completionStats: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
});