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
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMode('choice')} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.brandingSection}>
            <Text style={styles.brandName}>ATHLETES</Text>
            <Text style={styles.platformName}>Access Account</Text>
          </View>
          
          <View style={styles.messageSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Continue your elite development</Text>
          </View>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // For now, create a mock user for demo
              const mockUser: UserProfile = {
                id: 'returning_user',
                email: 'champion@athletes.com',
                name: 'Returning Athlete',
                age: 16,
                isParentApproved: true,
              };
              onAuthSuccess(mockUser);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Access Development Platform</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setMode('choice')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Return to options</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.brandName}>BABY GOATS</Text>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 60,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '400',
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    fontWeight: '300',
  },
  choiceContainer: {
    marginBottom: 48,
  },
  primaryChoice: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryChoiceText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  secondaryChoice: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
  },
  secondaryChoiceText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  noticeContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  noticeText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    fontWeight: '300',
  },
  // Login screen styles
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  backLink: {
    alignItems: 'center',
    padding: 12,
  },
  backLinkText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '300',
  },
});