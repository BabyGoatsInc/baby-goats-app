import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enableWebP?: boolean;
}

export interface OptimizedImage {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

/**
 * Comprehensive image optimization for Baby Goats app
 * Optimizes for storage, performance, and mobile data usage
 */
export class ImageOptimizer {
  
  static defaultOptions: ImageOptimizationOptions = {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    format: 'jpeg',
    enableWebP: Platform.OS === 'web', // Use WebP on web for better compression
  };

  /**
   * Profile photo specific optimization
   * Optimized for avatar display and storage efficiency
   */
  static async optimizeProfilePhoto(
    imageUri: string,
    options?: Partial<ImageOptimizationOptions>
  ): Promise<OptimizedImage> {
    const profileOptions: ImageOptimizationOptions = {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.85,
      format: 'jpeg',
      ...options,
    };

    return this.optimizeImage(imageUri, profileOptions);
  }

  /**
   * Highlight/content image optimization
   * Optimized for display quality while maintaining reasonable size
   */
  static async optimizeContentImage(
    imageUri: string,
    options?: Partial<ImageOptimizationOptions>
  ): Promise<OptimizedImage> {
    const contentOptions: ImageOptimizationOptions = {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      format: 'jpeg',
      ...options,
    };

    return this.optimizeImage(imageUri, contentOptions);
  }

  /**
   * Thumbnail optimization
   * Heavily optimized for lists and previews
   */
  static async optimizeThumbnail(
    imageUri: string,
    options?: Partial<ImageOptimizationOptions>
  ): Promise<OptimizedImage> {
    const thumbnailOptions: ImageOptimizationOptions = {
      maxWidth: 150,
      maxHeight: 150,
      quality: 0.7,
      format: 'jpeg',
      ...options,
    };

    return this.optimizeImage(imageUri, thumbnailOptions);
  }

  /**
   * Core image optimization function
   */
  static async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      
      // Get original image info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      if (!originalInfo.exists) {
        throw new Error('Image file not found');
      }

      // Determine optimal format
      const format = this.determineOptimalFormat(finalOptions);
      
      // Resize and compress
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: finalOptions.maxWidth,
              height: finalOptions.maxHeight,
            },
          },
        ],
        {
          compress: finalOptions.quality,
          format: format as ImageManipulator.SaveFormat,
          base64: true, // Always include base64 for storage
        }
      );

      // Get optimized file size
      const optimizedInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      
      const result: OptimizedImage = {
        uri: manipulatedImage.uri,
        base64: manipulatedImage.base64,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        fileSize: optimizedInfo.size || 0,
        format: format,
      };

      // Log compression ratio for monitoring
      const compressionRatio = originalInfo.size && optimizedInfo.size 
        ? ((originalInfo.size - optimizedInfo.size) / originalInfo.size * 100).toFixed(1)
        : '0';
      
      console.log(`📸 Image optimized: ${compressionRatio}% size reduction (${originalInfo.size} → ${optimizedInfo.size} bytes)`);

      return result;

    } catch (error) {
      console.error('❌ Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine optimal image format based on platform and options
   */
  private static determineOptimalFormat(options: ImageOptimizationOptions): string {
    if (options.enableWebP && Platform.OS === 'web') {
      return 'webp';
    }
    
    return options.format || 'jpeg';
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Progressive image loading utility
   * Returns low-quality placeholder while full image loads
   */
  static async generateProgressiveImages(imageUri: string): Promise<{
    thumbnail: OptimizedImage;
    medium: OptimizedImage;
    full: OptimizedImage;
  }> {
    const [thumbnail, medium, full] = await Promise.all([
      this.optimizeThumbnail(imageUri),
      this.optimizeImage(imageUri, { maxWidth: 400, maxHeight: 400, quality: 0.6 }),
      this.optimizeContentImage(imageUri),
    ]);

    return { thumbnail, medium, full };
  }

  /**
   * Batch optimize multiple images with progress callback
   */
  static async batchOptimize(
    imageUris: string[],
    options: ImageOptimizationOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<OptimizedImage[]> {
    const results: OptimizedImage[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      try {
        const optimized = await this.optimizeImage(imageUris[i], options);
        results.push(optimized);
        
        if (onProgress) {
          onProgress(i + 1, imageUris.length);
        }
      } catch (error) {
        console.error(`❌ Failed to optimize image ${i}:`, error);
        // Continue with other images
      }
    }

    return results;
  }
}

/**
 * Memory-efficient image cache for optimized images
 */
export class ImageCache {
  private static cache = new Map<string, OptimizedImage>();
  private static maxCacheSize = 50; // Maximum number of cached images
  
  static get(key: string): OptimizedImage | null {
    return this.cache.get(key) || null;
  }
  
  static set(key: string, image: OptimizedImage): void {
    // LRU eviction: remove oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, image);
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}