import { supabase } from './supabase';

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
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${imageType}_${timestamp}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };

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
    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const userId = urlParts[urlParts.length - 2];
    const fullPath = `${userId}/${filename}`;
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fullPath]);

    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// Preset avatar URLs (we'll create these assets)
export const PRESET_AVATARS = [
  {
    id: 'athlete_1',
    name: 'Champion',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'athlete_2', 
    name: 'Rising Star',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'athlete_3',
    name: 'Elite Performer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'athlete_4',
    name: 'Future Legend',
    url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'athlete_5',
    name: 'Peak Athlete',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'athlete_6',
    name: 'Champion Spirit',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  },
];

export const getAvatarById = (id: string) => {
  return PRESET_AVATARS.find(avatar => avatar.id === id);
};