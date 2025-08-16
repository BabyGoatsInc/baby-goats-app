import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

export const STORAGE_BUCKET = 'profile-photos';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadProfilePhoto = async (
  userId: string, 
  imageUri: string,
  imageType: 'photo' | 'avatar' = 'photo'
): Promise<UploadResult> => {
  try {
    // For demo purposes, we'll process the image and return a base64 URL
    // In production, this would upload to Supabase Storage
    
    // Process the image (resize and compress)
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 400, height: 400 } }],
      { 
        compress: 0.7, 
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true
      }
    );

    if (manipulatedImage.base64) {
      const base64Url = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      
      // In a real implementation, you would upload to Supabase Storage here:
      // const { data, error } = await supabase.storage
      //   .from(STORAGE_BUCKET)
      //   .upload(filename, blob, {
      //     cacheControl: '3600',
      //     upsert: true,
      //     contentType: 'image/jpeg'
      //   });

      console.log('✅ Photo processed successfully (using base64 for demo)');
      return { 
        success: true, 
        url: base64Url 
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to process image' 
      };
    }

  } catch (error) {
    console.error('Upload error:', error);
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

    // For Supabase Storage URLs (when implemented)
    // Extract filename from URL and delete from storage
    console.log('Photo deletion not implemented for demo');
    return true;
    
  } catch (error) {
    console.error('Delete error:', error);
    return false;
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