import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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
    const fileName = `${userId}/${imageType}_${timestamp}.jpg`;
    
    console.log(`🔄 Uploading to bucket: ${STORAGE_BUCKET}, filename: ${fileName}`);

    // Convert base64 to blob for upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      // If bucket doesn't exist, try to create it and retry
      if (uploadError.message.includes('Bucket not found') || uploadError.statusCode === '404') {
        console.log('🔄 Bucket not found, attempting to create...');
        
        const { error: createBucketError } = await supabase.storage
          .createBucket(STORAGE_BUCKET, { 
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            fileSizeLimit: 5242880, // 5MB
          });

        if (createBucketError) {
          console.error('❌ Failed to create bucket:', createBucketError);
          return { 
            success: false, 
            error: `Failed to create storage bucket: ${createBucketError.message}` 
          };
        }

        console.log('✅ Bucket created, retrying upload...');
        
        // Retry upload after creating bucket
        const { data: retryData, error: retryError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, decode(base64), {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (retryError) {
          console.error('❌ Retry upload error:', retryError);
          return { 
            success: false, 
            error: `Upload failed after bucket creation: ${retryError.message}` 
          };
        }

        console.log('✅ Upload successful on retry');
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(retryData.path);

        console.log('✅ Public URL generated:', publicUrl);
        
        return { 
          success: true, 
          url: publicUrl 
        };
      }
      
      return { 
        success: false, 
        error: uploadError.message 
      };
    }

    console.log('✅ Upload successful');
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uploadData.path);

    console.log('✅ Public URL generated:', publicUrl);
    
    return { 
      success: true, 
      url: publicUrl 
    };

  } catch (error) {
    console.error('❌ Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

// Helper function to decode base64 string to Uint8Array
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const deleteProfilePhoto = async (url: string): Promise<boolean> => {
  try {
    // For base64 URLs, we don't need to delete anything
    if (url.startsWith('data:image')) {
      return true;
    }

    // For Supabase Storage URLs
    if (url.includes(STORAGE_BUCKET)) {
      console.log('🔄 Deleting photo from storage...');
      
      // Extract the file path from the public URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === STORAGE_BUCKET);
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath]);

        if (error) {
          console.error('❌ Delete error:', error);
          return false;
        }

        console.log('✅ Photo deleted successfully');
        return true;
      }
    }

    console.log('⚠️ Photo deletion skipped - not a Supabase Storage URL');
    return true;
    
  } catch (error) {
    console.error('❌ Delete error:', error);
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