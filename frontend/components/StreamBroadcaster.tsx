import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { streamingManager, LiveStream } from '../lib/streaming';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StreamBroadcasterProps {
  onClose: () => void;
  existingStream?: LiveStream;
}

export default function StreamBroadcaster({ onClose, existingStream }: StreamBroadcasterProps) {
  const { user } = useAuth();
  const cameraRef = useRef<Camera>(null);
  
  // Stream state
  const [stream, setStream] = useState<LiveStream | null>(existingStream || null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  
  // Camera state
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(!existingStream);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Timer refs
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewerUpdateRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getCameraPermissions();
    
    return () => {
      cleanupTimers();
    };
  }, []);

  useEffect(() => {
    if (stream) {
      setViewerCount(stream.viewer_count || 0);
      if (stream.status === 'live') {
        setIsStreaming(true);
        startStreamTimer();
        startViewerUpdates();
      }
    }
  }, [stream]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
  };

  const cleanupTimers = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    if (viewerUpdateRef.current) {
      clearInterval(viewerUpdateRef.current);
    }
  };

  const startStreamTimer = () => {
    durationTimerRef.current = setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);
  };

  const startViewerUpdates = () => {
    viewerUpdateRef.current = setInterval(async () => {
      if (stream) {
        try {
          const viewers = await streamingManager.getViewers(stream.id);
          setViewerCount(viewers.activeViewerCount);
        } catch (error) {
          console.error('Failed to update viewer count:', error);
        }
      }
    }, 10000); // Update every 10 seconds
  };

  const handleCreateStream = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Error', 'Please enter a stream title');
      return;
    }

    try {
      setLoading(true);
      const newStream = await streamingManager.createStream({
        title: streamTitle.trim(),
        description: streamDescription.trim(),
        category: selectedCategory,
        chat_enabled: chatEnabled
      });
      
      setStream(newStream);
      setShowCreateModal(false);
      Alert.alert('Success', 'Stream created! Ready to go live?', [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Go Live!', onPress: () => startBroadcast() }
      ]);
    } catch (error) {
      console.error('Failed to create stream:', error);
      Alert.alert('Error', 'Failed to create stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startBroadcast = async () => {
    if (!stream) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Update stream status to live
      const updatedStream = await streamingManager.updateStream(stream.id, {
        status: 'live'
      });
      
      setStream(updatedStream);
      setIsStreaming(true);
      setStreamDuration(0);
      startStreamTimer();
      startViewerUpdates();
      
      Alert.alert('🔴 You\'re Live!', 'Your stream is now broadcasting to all champions!');
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      Alert.alert('Error', 'Failed to start broadcasting. Please try again.');
    }
  };

  const stopBroadcast = async () => {
    Alert.alert(
      'End Stream',
      'Are you sure you want to end your live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              if (stream) {
                await streamingManager.updateStream(stream.id, { status: 'ended' });
              }
              
              setIsStreaming(false);
              cleanupTimers();
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              Alert.alert('Stream Ended', 'Your stream has been ended successfully.', [
                { text: 'OK', onPress: onClose }
              ]);
            } catch (error) {
              console.error('Failed to end stream:', error);
              Alert.alert('Error', 'Failed to end stream properly.');
            }
          }
        }
      ]
    );
  };

  const toggleCamera = () => {
    setCameraType(current => 
      current === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlashMode(current =>
      current === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const categories = streamingManager.getStreamCategories();

  if (hasCameraPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        {/* Top Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topOverlay}
        >
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {isStreaming && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
                <Text style={styles.durationText}>{formatDuration(streamDuration)}</Text>
              </View>
            )}
            
            <View style={styles.viewerInfo}>
              <Text style={styles.viewerCount}>👥 {viewerCount}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stream Info Overlay */}
        {stream && (
          <View style={styles.streamInfoOverlay}>
            <Text style={styles.streamTitleOverlay} numberOfLines={2}>
              {stream.title}
            </Text>
            {stream.description && (
              <Text style={styles.streamDescriptionOverlay} numberOfLines={1}>
                {stream.description}
              </Text>
            )}
          </View>
        )}

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Text style={styles.controlButtonText}>
                {flashMode === Camera.Constants.FlashMode.on ? '🔦' : '💡'}
              </Text>
            </TouchableOpacity>

            {/* Main Action Button */}
            {!isStreaming ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={startBroadcast}
                disabled={!stream}
              >
                <Text style={styles.actionButtonText}>GO LIVE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={stopBroadcast}
              >
                <Text style={styles.actionButtonText}>END STREAM</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Camera>

      {/* Create Stream Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Stream</Text>
              <TouchableOpacity
                onPress={handleCreateStream}
                disabled={loading || !streamTitle.trim()}
              >
                <Text style={[
                  styles.modalCreateText,
                  (!streamTitle.trim() || loading) && styles.modalCreateTextDisabled
                ]}>
                  {loading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stream Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={streamTitle}
                  onChangeText={setStreamTitle}
                  placeholder="Enter your stream title..."
                  placeholderTextColor="#666666"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={streamDescription}
                  onChangeText={setStreamDescription}
                  placeholder="Tell viewers what your stream is about..."
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.categoryButtonSelected
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={[
                        styles.categoryText,
                        selectedCategory === category.id && styles.categoryTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Enable Chat</Text>
                  <TouchableOpacity
                    style={[styles.switch, chatEnabled && styles.switchActive]}
                    onPress={() => setChatEnabled(!chatEnabled)}
                  >
                    <View style={[styles.switchThumb, chatEnabled && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Allow viewers to chat during your stream
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Camera
  camera: {
    flex: 1,
  },
  
  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Overlays
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 22, 22, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  viewerInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewerCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  streamInfoOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  streamTitleOverlay: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streamDescriptionOverlay: {
    color: '#CCCCCC',
    fontSize: 14,
  },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#EC1616',
  },
  stopButton: {
    backgroundColor: '#666666',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseText: {
    color: '#EC1616',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCreateText: {
    color: '#EC1616',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCreateTextDisabled: {
    color: '#666666',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputHint: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Categories
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
    borderColor: '#EC1616',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#EC1616',
    fontWeight: '600',
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#EC1616',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
});