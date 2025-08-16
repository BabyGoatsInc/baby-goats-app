import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadProfilePhoto, PRESET_AVATARS, getAvatarById, setupStorageBucket, checkStorageBucket } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePhotoSelectorProps {
  currentAvatarUrl?: string;
  onPhotoSelected: (photoUrl: string) => void;
  onClose: () => void;
}

export default function ProfilePhotoSelector({ 
  currentAvatarUrl, 
  onPhotoSelected, 
  onClose 
}: ProfilePhotoSelectorProps) {
  const [selectedType, setSelectedType] = useState<'avatar' | 'photo'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const { user } = useAuth();

  // Initialize storage on component mount
  useEffect(() => {
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      console.log('🔄 Checking storage bucket status...');
      const status = await checkStorageBucket();
      
      if (status.exists) {
        console.log('✅ Storage bucket ready');
        setStorageReady(true);
      } else {
        console.log('🔄 Setting up storage bucket...');
        const setupResult = await setupStorageBucket();
        
        if (setupResult) {
          console.log('✅ Storage bucket setup completed');
          setStorageReady(true);
        } else {
          console.log('❌ Storage bucket setup failed');
          setStorageReady(false);
        }
      }
    } catch (error) {
      console.error('❌ Storage initialization error:', error);
      setStorageReady(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!cameraPermission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickPhoto = async () => {
    try {
      // Request media library permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!mediaPermission.granted) {
        Alert.alert('Permission Required', 'Photo library permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const processAndUploadPhoto = async (uri: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Process the image (crop to square, resize for optimal upload)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 400, height: 400 } }
        ],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      // Upload to Supabase Storage
      const uploadResult = await uploadProfilePhoto(
        user.id,
        manipulatedImage.uri,
        'photo'
      );

      if (uploadResult.success && uploadResult.url) {
        onPhotoSelected(uploadResult.url);
        Alert.alert('Success', 'Profile photo updated successfully!', [
          { text: 'OK', onPress: onClose }
        ]);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleConfirmAvatar = () => {
    if (selectedAvatar) {
      onPhotoSelected(selectedAvatar);
      Alert.alert('Success', 'Profile avatar updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Profile Photo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'avatar' && styles.typeButtonActive]}
            onPress={() => setSelectedType('avatar')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'avatar' && styles.typeButtonTextActive]}>
              Choose Avatar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'photo' && styles.typeButtonActive]}
            onPress={() => setSelectedType('photo')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'photo' && styles.typeButtonTextActive]}>
              Upload Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {selectedType === 'avatar' ? (
          <View style={styles.avatarSection}>
            <ScrollView style={styles.avatarGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarRow}>
                {PRESET_AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === avatar.url && styles.avatarOptionSelected
                    ]}
                    onPress={() => handleSelectAvatar(avatar.url)}
                  >
                    <Image source={{ uri: avatar.url }} style={styles.avatarImage} />
                    <Text style={styles.avatarName}>{avatar.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {selectedAvatar && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmAvatar}
              >
                <Text style={styles.confirmButtonText}>Use This Avatar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Upload Your Own Photo</Text>
            <Text style={styles.sectionSubtitle}>
              Take a new photo or choose from your gallery
            </Text>
            
            {storageReady === null ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadingText}>Initializing storage...</Text>
              </View>
            ) : storageReady === false ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ Storage not available</Text>
                <Text style={styles.errorSubtext}>
                  Please try again later or use preset avatars
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={initializeStorage}
                >
                  <Text style={styles.retryButtonText}>Retry Setup</Text>
                </TouchableOpacity>
              </View>
            ) : uploadingPhoto ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.uploadingText}>Uploading photo...</Text>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.photoButtonIcon}>📷</Text>
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handlePickPhoto}
                >
                  <Text style={styles.photoButtonIcon}>🖼️</Text>
                  <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  typeButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#000000',
  },
  avatarSection: {
    flex: 1,
  },
  avatarGrid: {
    flex: 1,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoSection: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  photoButtons: {
    width: '100%',
  },
  photoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});