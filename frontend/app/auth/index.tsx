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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🐐</Text>
              <Text style={styles.appName}>BABY GOATS</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Ready to Join the Champions?</Text>
            <Text style={styles.subtitle}>
              Your journey to greatness starts with a single choice
            </Text>
          </View>

          {/* Choice Buttons */}
          <View style={styles.choiceContainer}>
            <TouchableOpacity
              style={[styles.choiceButton, styles.signupButton]}
              onPress={() => setMode('signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>🚀</Text>
              <Text style={styles.choiceTitle}>I'm New Here!</Text>
              <Text style={styles.choiceSubtitle}>Join the Baby Goats family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceButton, styles.loginButton]}
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Text style={styles.choiceEmoji}>🏆</Text>
              <Text style={styles.choiceTitle}>Welcome Back!</Text>
              <Text style={styles.choiceSubtitle}>Continue your journey</Text>
            </TouchableOpacity>
          </View>

          {/* Age Notice */}
          <View style={styles.ageNotice}>
            <Text style={styles.ageNoticeText}>
              🌟 Open to athletes of all ages! We welcome everyone from young beginners to seasoned champions.
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={mode === 'signup' ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }]
                }
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                
                <View style={styles.logoContainer}>
                  <Text style={styles.logo}>🐐</Text>
                  <Text style={styles.appName}>BABY GOATS</Text>
                </View>
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>
                  {mode === 'signup' ? 'Join the Champions' : 'Welcome Back, Champion'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'signup' 
                    ? 'Every legend starts with the first step' 
                    : 'Continue your journey to greatness'
                  }
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name Field (Signup only) */}
                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Champion Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => setFormData({...formData, name: text})}
                      placeholder="What should we call you?"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* Age Field (Signup only) */}
                {mode === 'signup' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Age (8-16) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.age}
                      onChangeText={(text) => setFormData({...formData, age: text.replace(/[^0-9]/g, '')})}
                      placeholder="How old are you?"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                )}

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text.toLowerCase().trim()})}
                    placeholder="your.email@example.com"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    placeholder="Create a strong password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Parent Email (for under 13) */}
                {mode === 'signup' && parseInt(formData.age) > 0 && parseInt(formData.age) < 13 && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Parent/Guardian Email *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.parentEmail}
                      onChangeText={(text) => setFormData({...formData, parentEmail: text.toLowerCase().trim()})}
                      placeholder="parent@example.com"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={styles.helperText}>
                      🛡️ Required for safety - we'll send them an approval email
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonLoading]}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>
                    {loading 
                      ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...') 
                      : (mode === 'signup' ? '🚀 Start My Journey' : '🏆 Welcome Back')
                    }
                  </Text>
                </TouchableOpacity>

                {/* Toggle Mode */}
                <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>
                    {mode === 'signup' 
                      ? 'Already a champion? Sign In' 
                      : 'New here? Join the Champions'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Safety Notice */}
              {mode === 'signup' && (
                <View style={styles.safetyNotice}>
                  <Text style={styles.safetyTitle}>🛡️ Your Safety Matters</Text>
                  <Text style={styles.safetyText}>
                    Baby Goats is committed to keeping young athletes safe. We follow COPPA guidelines and require parent approval for athletes under 13.
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight || 40,
    minHeight: '100%',
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    minHeight: 50,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignItems: 'center',
    padding: 12,
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  safetyNotice: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  safetyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  safetyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});