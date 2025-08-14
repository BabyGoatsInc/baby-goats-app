import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConversationalAuth from './conversational';

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  parentEmail?: string;
  isParentApproved: boolean;
}

export default function Authentication({ onAuthSuccess, onBack }: AuthProps) {
  const [mode, setMode] = useState<'choice' | 'signup' | 'login'>('choice');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Show conversational signup
  if (mode === 'signup') {
    return (
      <ConversationalAuth 
        onAuthSuccess={onAuthSuccess}
        onBack={() => setMode('choice')}
      />
    );
  }

  // Show simple login (can be enhanced later)
  if (mode === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.gradient}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Welcome Back, Champion! 🏆</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // For now, create a mock user for demo
                const mockUser: UserProfile = {
                  id: 'returning_user',
                  email: 'champion@babygoats.com',
                  name: 'Returning Champion',
                  age: 16,
                  isParentApproved: true,
                };
                onAuthSuccess(mockUser);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Demo Sign In 🚀</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setMode('choice')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back to options</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show choice screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        {/* Elite Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Elite Branding */}
        <View style={styles.brandingSection}>
          <Text style={styles.brandName}>ATHLETES</Text>
          <Text style={styles.platformName}>Elite Development Platform</Text>
        </View>

        {/* Authentication Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>Access Your Development</Text>
          <Text style={styles.subtitle}>
            Continue your path to elite performance
          </Text>
        </View>

        {/* Choice Actions */}
        <View style={styles.choiceContainer}>
          <TouchableOpacity
            style={styles.primaryChoice}
            onPress={() => setMode('signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryChoiceText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryChoice}
            onPress={() => setMode('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryChoiceText}>Access Existing Account</Text>
          </TouchableOpacity>
        </View>

        {/* Platform Notice */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            Secure development environment for athletes of all levels
          </Text>
        </View>
      </View>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight || 40,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    marginBottom: 4,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  choiceContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  choiceButton: {
    width: 280,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  signupButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  loginButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  choiceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  choiceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  choiceSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  ageNotice: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  ageNoticeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    alignItems: 'center',
    padding: 12,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});