import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export const STORAGE_BUCKET = 'profile-photos';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Get backend URL from environment
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const uploadProfilePhoto = async (
  userId: string, 
  imageUri: string,
  imageType: 'photo' | 'avatar' = 'photo'
): Promise<UploadResult> => {
  try {
    console.log('🔄 Starting photo upload process...');
    
    // Process the image (resize and compress)
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 400, height: 400 } }],
      { 
        compress: 0.7, 
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log('✅ Image processed successfully');

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create filename
    const timestamp = new Date().getTime();
    const fileName = `${imageType}_${timestamp}.jpg`;
    
    console.log(`🔄 Uploading via backend API: ${fileName}`);

    // Use backend storage API
    const uploadResponse = await fetch(`${BACKEND_URL}/api/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload',
        userId: userId,
        fileName: fileName,
        fileData: base64,
        contentType: 'image/jpeg',
      }),
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('❌ Backend upload error:', errorData);
      return { 
        success: false, 
        error: errorData.error || 'Upload failed' 
      };
    }

    const result = await uploadResponse.json();

    if (result.success && result.url) {
      console.log('✅ Upload successful via backend API:', result.url);
      return { 
        success: true, 
        url: result.url 
      };
    } else {
      console.error('❌ Backend API returned error:', result.error);
      return { 
        success: false, 
        error: result.error || 'Upload failed' 
      };
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const deleteProfilePhoto = async (url: string): Promise<boolean> => {
  try {
    // For base64 URLs, we don't need to delete anything
    if (url.startsWith('data:image')) {
      return true;
    }

    // For Supabase Storage URLs
    if (url.includes(STORAGE_BUCKET)) {
      console.log('🔄 Deleting photo from storage via backend...');
      
      // Extract the file path from the public URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === STORAGE_BUCKET);
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Use backend storage API for deletion
        const deleteResponse = await fetch(`${BACKEND_URL}/api/storage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            filePath: filePath,
          }),
        });

        if (!deleteResponse.ok) {
          console.error('❌ Backend delete error:', deleteResponse.status);
          return false;
        }

        const result = await deleteResponse.json();
        
        if (result.success) {
          console.log('✅ Photo deleted successfully via backend API');
          return true;
        } else {
          console.error('❌ Backend API delete failed:', result.error);
          return false;
        }
      }
    }

    console.log('⚠️ Photo deletion skipped - not a Supabase Storage URL');
    return true;
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    return false;
  }
};

// Setup storage bucket via backend API
export const setupStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🔄 Setting up storage bucket via backend...');
    
    const setupResponse = await fetch(`${BACKEND_URL}/api/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'setup_bucket',
      }),
    });

    if (!setupResponse.ok) {
      console.error('❌ Backend setup error:', setupResponse.status);
      return false;
    }

    const result = await setupResponse.json();
    
    if (result.success) {
      console.log('✅ Storage bucket setup completed via backend API');
      return true;
    } else {
      console.error('❌ Backend API setup failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    return false;
  }
};

// Check storage bucket status via backend API
export const checkStorageBucket = async (): Promise<{ exists: boolean; error?: string }> => {
  try {
    const checkResponse = await fetch(`${BACKEND_URL}/api/storage?action=check_bucket`);

    if (!checkResponse.ok) {
      return { exists: false, error: 'Failed to check bucket status' };
    }

    const result = await checkResponse.json();
    return { exists: result.bucketExists };
    
  } catch (error) {
    console.error('❌ Bucket check error:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Check failed' };
  }
};

// Preset avatar URLs (using high-quality images)
export const PRESET_AVATARS = [
  {
    id: 'athlete_1',
    name: 'Champion',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
  {
    id: 'athlete_2', 
    name: 'Rising Star',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
  {
    id: 'athlete_3',
    name: 'Elite Performer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
  {
    id: 'athlete_4',
    name: 'Future Legend',
    url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
  {
    id: 'athlete_5',
    name: 'Peak Athlete',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
  {
    id: 'athlete_6',
    name: 'Champion Spirit',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  },
];

export const getAvatarById = (id: string) => {
  return PRESET_AVATARS.find(avatar => avatar.id === id);
};