# Advanced Mobile Features Implementation Guide
## AR Achievement Celebrations, 360° Video Recording, and Smart Notifications

### **🎉 AR Achievement Celebrations**

Create immersive AR experiences when athletes achieve goals:

```typescript
// components/ARCelebration.tsx
import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface ARCelebrationProps {
  achievementType: 'goal_scored' | 'personal_best' | 'level_up';
  sport: string;
  visible: boolean;
  onComplete: () => void;
}

export default function ARCelebration({ achievementType, sport, visible, onComplete }: ARCelebrationProps) {
  const cameraRef = useRef<Camera>(null);

  const celebrationEffects = {
    goal_scored: {
      particles: 'fireworks',
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
      duration: 3000,
      sound: 'celebration_cheer.mp3'
    },
    personal_best: {
      particles: 'stars',
      colors: ['#9B59B6', '#3498DB', '#E74C3C'],
      duration: 2500,
      sound: 'achievement_fanfare.mp3'
    },
    level_up: {
      particles: 'explosion',
      colors: ['#F39C12', '#E67E22', '#D35400'],
      duration: 2000,
      sound: 'level_up_chime.mp3'
    }
  };

  const triggerARCelebration = async () => {
    const effect = celebrationEffects[achievementType];
    
    // Capture photo with AR overlay
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      
      // Apply AR effects overlay
      await applyAREffects(photo, effect);
      
      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      
      // Trigger celebration animation
      setTimeout(onComplete, effect.duration);
    }
  };

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={Camera.Constants.Type.back}
        onCameraReady={triggerARCelebration}
      />
      
      {/* AR Overlay Components */}
      <ParticleSystem 
        type={celebrationEffects[achievementType].particles}
        colors={celebrationEffects[achievementType].colors}
      />
      
      <AchievementBanner 
        text={`${sport.toUpperCase()} ${achievementType.replace('_', ' ').toUpperCase()}!`}
        sport={sport}
      />
    </View>
  );
}
```

### **🎥 360° Video Recording for Technique Analysis**

Advanced video capture with multi-angle analysis:

```typescript
// components/AdvancedVideoRecorder.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

interface VideoAnalysisProps {
  sport: string;
  onAnalysisComplete: (analysis: any) => void;
}

export default function AdvancedVideoRecorder({ sport, onAnalysisComplete }: VideoAnalysisProps) {
  const [recording, setRecording] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'technique' | 'power' | 'speed'>('technique');
  const cameraRef = useRef<Camera>(null);

  const startAdvancedRecording = async () => {
    if (!cameraRef.current) return;

    setRecording(true);
    
    const recordingOptions = {
      quality: Camera.Constants.VideoQuality['1080p'],
      maxDuration: 60, // 60 seconds max
      mute: false,
      videoBitrate: 5000000, // High quality for analysis
    };

    try {
      const recordingResult = await cameraRef.current.recordAsync(recordingOptions);
      
      // Process video for AI analysis
      await processVideoForAnalysis(recordingResult.uri, sport, analysisMode);
      
    } catch (error) {
      console.error('Recording error:', error);
    } finally {
      setRecording(false);
    }
  };

  const processVideoForAnalysis = async (videoUri: string, sport: string, mode: string) => {
    // Send to AI analysis backend
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'technique_analysis.mp4'
    } as any);
    formData.append('sport', sport);
    formData.append('analysis_mode', mode);

    try {
      const response = await fetch('/api/ai-analysis/video', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const analysis = await response.json();
      onAnalysisComplete(analysis);
      
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        ratio="16:9"
      />
      
      <View style={styles.controls}>
        <View style={styles.modeSelector}>
          {['technique', 'power', 'speed'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                analysisMode === mode && styles.selectedMode
              ]}
              onPress={() => setAnalysisMode(mode as any)}
            >
              <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.recordButton, recording && styles.recordingActive]}
          onPress={recording ? stopRecording : startAdvancedRecording}
        >
          <Text style={styles.recordText}>
            {recording ? 'ANALYZING...' : 'RECORD & ANALYZE'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <AICoachOverlay 
        visible={recording}
        sport={sport}
        analysisMode={analysisMode}
      />
    </View>
  );
}
```

### **🧠 Smart Notification System**

Advanced notification system with AI-powered relevance:

```typescript
// lib/smartNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SmartNotificationConfig {
  userId: string;
  sport: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingGoals: string[];
  preferredTimes: string[];
}

class SmartNotificationSystem {
  private config: SmartNotificationConfig | null = null;
  
  async initialize(config: SmartNotificationConfig) {
    this.config = config;
    
    // Configure notification settings
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    // Register for push notifications
    await this.registerForPushNotifications();
    
    // Schedule smart reminders
    await this.scheduleSmartReminders();
  }

  async scheduleSmartReminders() {
    if (!this.config) return;

    // AI-powered training reminders based on optimal times
    const optimalTimes = await this.calculateOptimalTrainingTimes();
    
    for (const time of optimalTimes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to train, champion! 🏆`,
          body: `Ready for some ${this.config.sport} practice? Let's work on ${this.getRandomGoal()}!`,
          data: {
            type: 'training_reminder',
            sport: this.config.sport,
            priority: 'high'
          },
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          repeats: true,
        },
      });
    }
  }

  async sendAchievementNotification(achievement: any) {
    const celebrationMessages = {
      'goal_scored': `🎯 Amazing goal! You're becoming a ${this.config?.sport} superstar!`,
      'personal_best': `🌟 New personal best! Your hard work is paying off!`,
      'streak_milestone': `🔥 ${achievement.streak} day streak! You're on fire!`,
      'skill_improvement': `📈 Your ${achievement.skill} has improved by ${achievement.improvement}%!`
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Achievement Unlocked! 🎉',
        body: celebrationMessages[achievement.type] || 'Great job!',
        data: {
          type: 'achievement',
          achievement: achievement,
          celebrationType: 'ar_celebration'
        },
      },
      trigger: null, // Send immediately
    });
  }

  async sendCoachingTip() {
    if (!this.config) return;

    const tips = await this.getPersonalizedTips();
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💡 Pro Tip!',
        body: randomTip,
        data: {
          type: 'coaching_tip',
          sport: this.config.sport
        },
      },
      trigger: null,
    });
  }

  private async calculateOptimalTrainingTimes(): Promise<Array<{hour: number, minute: number}>> {
    // AI algorithm to determine best training times based on:
    // - Historical performance data
    // - User activity patterns  
    // - Circadian rhythm optimization for youth athletes
    
    const defaultTimes = [
      { hour: 16, minute: 0 }, // 4 PM - after school
      { hour: 18, minute: 30 }, // 6:30 PM - before dinner
    ];

    try {
      // Get user's historical training data
      const trainingHistory = await AsyncStorage.getItem(`training_history_${this.config?.userId}`);
      
      if (trainingHistory) {
        const history = JSON.parse(trainingHistory);
        return this.analyzeOptimalTimes(history);
      }
    } catch (error) {
      console.error('Error calculating optimal times:', error);
    }

    return defaultTimes;
  }

  private async getPersonalizedTips(): Promise<string[]> {
    if (!this.config) return [];

    const tipDatabase = {
      soccer: {
        beginner: [
          "Practice juggling the ball for better ball control! 🤹‍♂️",
          "Work on both feet - champions use both! ⚽",
          "Keep your head up when dribbling to see opportunities! 👀"
        ],
        intermediate: [
          "Practice passing with both the inside and outside of your foot! 🦶",
          "Work on first touch - control the ball quickly! ⚡",
          "Try shooting from different angles! 🎯"
        ],
        advanced: [
          "Master 1v1 moves like the step-over and cut! 🔥",
          "Practice crossing and finishing in the box! 📦",
          "Work on your weak foot until it's a strength! 💪"
        ]
      },
      basketball: {
        beginner: [
          "Practice dribbling with your eyes closed to improve feel! 👁️",
          "Work on proper shooting form - elbow under the ball! 🏀",
          "Practice layups from both sides of the basket! 🔄"
        ],
        intermediate: [
          "Master the triple threat position! ⚡",
          "Practice shooting off the dribble! 🏃‍♂️",
          "Work on defensive slides and stance! 🛡️"
        ],
        advanced: [
          "Develop advanced dribbling combos! 🌪️",
          "Practice contested shots and shot selection! 🎯",
          "Master help defense and rotations! 🔄"
        ]
      }
    };

    const sportTips = tipDatabase[this.config.sport as keyof typeof tipDatabase];
    if (sportTips && this.config.skillLevel in sportTips) {
      return sportTips[this.config.skillLevel as keyof typeof sportTips];
    }

    return ["Keep practicing and stay positive! 💪"];
  }

  private async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }
}
```

### **🎯 Smart Performance Analytics Dashboard**

Real-time analytics with AI insights:

```typescript
// components/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';

interface PerformanceData {
  weeklyScores: number[];
  skillBreakdown: { [key: string]: number };
  improvementPrediction: number[];
  goals: Array<{ name: string; progress: number; target: number }>;
}

export default function PerformanceDashboard({ userId, sport }: { userId: string; sport: string }) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [aiInsights, setAIInsights] = useState<string[]>([]);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadPerformanceData();
    getAIInsights();
  }, [userId]);

  const loadPerformanceData = async () => {
    try {
      const response = await fetch(`/api/ai-analysis/performance?user_id=${userId}&sport=${sport}`);
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const getAIInsights = async () => {
    try {
      const response = await fetch(`/api/ai-analysis/insights?user_id=${userId}`);
      const { insights } = await response.json();
      setAIInsights(insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const chartConfig = {
    backgroundColor: '#1E1E1E',
    backgroundGradientFrom: '#1E1E1E',
    backgroundGradientTo: '#1E1E1E',
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  if (!performanceData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your AI analysis... 🤖</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Performance Trend */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📈 Weekly Performance Trend</Text>
        <LineChart
          data={{
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              data: performanceData.weeklyScores,
              color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
              strokeWidth: 3
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>

      {/* AI Improvement Prediction */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>🔮 AI Performance Prediction</Text>
        <LineChart
          data={{
            labels: ['Now', '1mo', '2mo', '3mo'],
            datasets: [{
              data: performanceData.improvementPrediction,
              color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
              strokeWidth: 3
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`}}
          style={styles.chart}
        />
      </View>

      {/* Skill Breakdown */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>⚽ Skill Analysis Breakdown</Text>
        <BarChart
          data={{
            labels: Object.keys(performanceData.skillBreakdown),
            datasets: [{
              data: Object.values(performanceData.skillBreakdown)
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>

      {/* AI Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>🤖 AI Coach Insights</Text>
        {aiInsights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <MaterialIcons name="lightbulb-outline" size={20} color="#FFC107" />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>

      {/* Goals Progress */}
      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>🎯 Training Goals</Text>
        {performanceData.goals.map((goal, index) => (
          <View key={index} style={styles.goalCard}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(goal.progress / goal.target) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {goal.progress}/{goal.target} ({Math.round((goal.progress / goal.target) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  insightsContainer: {
    margin: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  insightText: {
    color: '#FFF',
    marginLeft: 12,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
});
```