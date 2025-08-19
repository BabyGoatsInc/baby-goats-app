import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

interface ConversationalAuthProps {
  onBack: () => void;
}

export default function ConversationalAuth({ onBack }: ConversationalAuthProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    parentEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const { signUp } = useAuth();

  const steps = [
    {
      id: 'welcome',
      question: "Elite Development Platform",
      subtitle: "Begin your transformation into tomorrow's champion",
      placeholder: "",
      type: 'welcome'
    },
    {
      id: 'name',
      question: "What should we call you, champion?",
      subtitle: "Your first name or what teammates call you",
      placeholder: "Enter your name",
      type: 'text',
      key: 'name'
    },
    {
      id: 'age',
      question: `Nice to meet you, ${formData.name}! 👋`,
      subtitle: "How old are you? (We welcome athletes of all ages!)",
      placeholder: "Enter your age",
      type: 'number',
      key: 'age'
    },
    {
      id: 'email',
      question: formData.age && parseInt(formData.age) < 13 
        ? "We'll need your parent's email for safety 🛡️"
        : "What's your email address?",
      subtitle: formData.age && parseInt(formData.age) < 13
        ? "Don't worry - we'll also get yours next!"
        : "We'll use this to keep your account secure",
      placeholder: formData.age && parseInt(formData.age) < 13 
        ? "parent@example.com" 
        : "your.email@example.com",
      type: 'email',
      key: formData.age && parseInt(formData.age) < 13 ? 'parentEmail' : 'email'
    },
    {
      id: 'email2',
      question: "Now, what's YOUR email?",
      subtitle: "This is for your personal account",
      placeholder: "your.email@example.com",
      type: 'email',
      key: 'email',
      showIf: () => formData.age && parseInt(formData.age) < 13 && formData.parentEmail
    },
    {
      id: 'password',
      question: "Create a strong password 🔒",
      subtitle: "Make it something only you'll remember",
      placeholder: "Enter your password",
      type: 'password',
      key: 'password'
    },
    {
      id: 'ready',
      question: `You're all set, ${formData.name}! 🎉`,
      subtitle: "Ready to start your champion journey?",
      type: 'completion'
    }
  ];

  // Filter steps based on conditions
  const getVisibleSteps = () => {
    return steps.filter(step => !step.showIf || step.showIf());
  };

  const visibleSteps = getVisibleSteps();
  const currentStepData = visibleSteps[currentStep];

  useEffect(() => {
    // Animate in each step
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const canContinue = () => {
    if (!currentStepData) return false;
    
    switch (currentStepData.type) {
      case 'welcome':
      case 'completion':
        return true;
      case 'text':
        return formData[currentStepData.key as keyof typeof formData].trim().length > 0;
      case 'number':
        return formData[currentStepData.key as keyof typeof formData].trim().length > 0;
      case 'email':
        const email = formData[currentStepData.key as keyof typeof formData];
        return email.includes('@') && email.includes('.');
      case 'password':
        return formData.password.length >= 6;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete signup
      await handleSignup();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    
    try {
      const age = parseInt(formData.age);
      
      // Sign up with real Supabase Auth
      const { user, error } = await signUp(formData.email, formData.password, {
        full_name: formData.name,
        age: age,
        parent_email: formData.parentEmail || undefined,
        sport: 'other', // Default sport, can be updated later
      });

      if (error) {
        console.error('Signup error:', error);
        Alert.alert(
          'Signup Error',
          error.message || 'Failed to create account. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (user) {
        if (!user.email_confirmed_at) {
          // Email confirmation required
          Alert.alert(
            'Check Your Email',
            'We sent you a confirmation email. Please check your inbox and click the link to activate your account.',
            [
              { text: 'OK', onPress: () => onAuthSuccess() }
            ]
          );
        } else {
          // Account created and confirmed
          Alert.alert(
            'Account Created!',
            'Your elite development account has been created successfully.',
            [
              { text: 'Continue', onPress: () => onAuthSuccess() }
            ]
          );
        }
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getGradient = () => {
    const gradients = [
      ['#667eea', '#764ba2'], // Welcome
      ['#f093fb', '#f5576c'], // Name
      ['#4facfe', '#00f2fe'], // Age  
      ['#43e97b', '#38f9d7'], // Email
      ['#ffecd2', '#fcb69f'], // Email 2
      ['#a8edea', '#fed6e3'], // Password
      ['#667eea', '#764ba2'], // Ready
    ];
    return gradients[currentStep] || gradients[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={getGradient()}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {visibleSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                      transform: [{ scale: index === currentStep ? 1.2 : 1 }],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Question Section */}
            <View style={styles.questionContainer}>
              <Text style={styles.question}>{currentStepData?.question}</Text>
              <Text style={styles.subtitle}>{currentStepData?.subtitle}</Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputContainer}>
              {currentStepData?.type === 'welcome' && (
                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeEmoji}>⚡</Text>
                  <Text style={styles.welcomeText}>
                    Join the next generation of elite athletes developing champion mindsets through proven methodologies.
                  </Text>
                </View>
              )}

              {currentStepData?.type === 'completion' && (
                <View style={styles.completionContent}>
                  <Text style={styles.completionEmoji}>🚀</Text>
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Here's what we know about you:</Text>
                    <Text style={styles.summaryItem}>👤 {formData.name}</Text>
                    <Text style={styles.summaryItem}>🎂 {formData.age} years old</Text>
                    <Text style={styles.summaryItem}>📧 {formData.email}</Text>
                    {formData.parentEmail && (
                      <Text style={styles.summaryItem}>👨‍👩‍👧‍👦 Parent: {formData.parentEmail}</Text>
                    )}
                  </View>
                </View>
              )}

              {['text', 'number', 'email', 'password'].includes(currentStepData?.type || '') && (
                <TextInput
                  style={styles.input}
                  value={formData[currentStepData.key as keyof typeof formData]}
                  onChangeText={(text) => updateFormData(currentStepData.key, text)}
                  placeholder={currentStepData.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  keyboardType={currentStepData.type === 'number' ? 'numeric' : currentStepData.type === 'email' ? 'email-address' : 'default'}
                  secureTextEntry={currentStepData.type === 'password'}
                  autoCapitalize={currentStepData.type === 'email' ? 'none' : 'words'}
                  autoFocus={true}
                />
              )}

              {/* Age Helper */}
              {currentStepData?.type === 'number' && formData.age && (
                <Text style={styles.helperText}>
                  {parseInt(formData.age) < 13 
                    ? "🛡️ We'll need parent approval for safety"
                    : "🎉 Perfect! You're ready to join Baby Goats"
                  }
                </Text>
              )}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={handlePrevious}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              {canContinue() && (
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={loading}
                  style={[styles.continueButton, loading && styles.loadingButton]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>
                    {loading 
                      ? 'Creating Account...' 
                      : currentStep === visibleSteps.length - 1 
                        ? '🚀 Start My Journey!' 
                        : 'Continue'
                    }
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight || 60,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    transition: 'all 0.3s ease',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  question: {
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
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    minWidth: 280,
    maxWidth: 320,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  loadingButton: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});