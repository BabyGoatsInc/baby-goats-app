import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a service role client for admin operations
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// Create a regular client for JWT verification
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = 'profile-photos';

/**
 * Verify JWT token and extract user information
 */
async function verifyAuthToken(request: NextRequest): Promise<{ user: any; error: string | null }> {
  try {
    const authorization = request.headers.get('Authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authorization.replace('Bearer ', '');
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: 'Token verification failed' };
  }
}

/**
 * Sanitize and validate input to prevent XSS and injection attacks
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags and scripts
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Remove JavaScript protocols
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove potential command injection
    .replace(/[;&|`$(){}[\]]/g, '')
    // Escape special characters
    .replace(/[<>"']/g, (match) => {
      const map: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return map[match] || match;
    })
    // Limit length
    .substring(0, 255)
    .trim();
}

/**
 * Validate file name for security
 */
function validateFileName(fileName: string): { isValid: boolean; sanitizedName: string; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, sanitizedName: '', error: 'File name is required' };
  }

  // Sanitize the input first
  const sanitized = sanitizeInput(fileName);
  
  // Additional file name validation
  const validFileNameRegex = /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i;
  
  if (!validFileNameRegex.test(sanitized)) {
    return { 
      isValid: false, 
      sanitizedName: sanitized, 
      error: 'Invalid file name. Only alphanumeric characters, dots, hyphens, and underscores allowed with jpg/jpeg/png/webp extensions.' 
    };
  }

  // Check for path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    return { 
      isValid: false, 
      sanitizedName: sanitized, 
      error: 'Path traversal detected in file name' 
    };
  }

  return { isValid: true, sanitizedName: sanitized };
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Verify JWT token first
    const { user, error: authError } = await verifyAuthToken(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          details: authError || 'Authentication required' 
        }, 
        { status: 401 }
      );
    }

    const { action, ...payload } = await request.json();

    // 2. INPUT VALIDATION: Validate action parameter
    const allowedActions = ['upload', 'delete', 'setup_bucket'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Allowed actions: upload, delete, setup_bucket' 
      }, { status: 400 });
    }

    // 3. AUTHORIZATION: Ensure user can only access their own resources
    if (payload.userId && payload.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot access other user resources'
      }, { status: 403 });
    }

    switch (action) {
      case 'upload':
        return await handleUpload(payload, user.id);
      case 'delete':
        return await handleDelete(payload, user.id);
      case 'setup_bucket':
        return await setupBucket();
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function handleUpload(payload: { 
  userId?: string; 
  fileName: string; 
  fileData: string; 
  contentType: string; 
}, authenticatedUserId: string) {
  try {
    const { fileName, fileData, contentType } = payload;

    // INPUT VALIDATION: Validate and sanitize fileName
    const fileValidation = validateFileName(fileName);
    if (!fileValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: fileValidation.error 
      }, { status: 400 });
    }

    // INPUT VALIDATION: Validate contentType
    const allowedContentTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedContentTypes.includes(contentType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid content type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // INPUT VALIDATION: Validate fileData (base64)
    if (!fileData || typeof fileData !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file data' 
      }, { status: 400 });
    }

    // Check if base64 data is valid
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(fileData)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid base64 file data' 
      }, { status: 400 });
    }

    // Use authenticated user ID (prevent user ID spoofing)
    const userId = authenticatedUserId;

    // Ensure bucket exists first
    await ensureBucketExists();

    // Create the file path using sanitized file name
    const filePath = `${userId}/${fileValidation.sanitizedName}`;

    // Convert base64 to buffer with size validation
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(fileData, 'base64');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid base64 encoding' 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxFileSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds 5MB limit' 
      }, { status: 400 });
    }

    // Upload file using service role client
    const { data: uploadData, error: uploadError } = await supabaseServiceClient.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: uploadError.message 
      }, { status: 400 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServiceClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: uploadData.path,
    });

  } catch (error) {
    console.error('Upload handling error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}

async function handleDelete(payload: { filePath: string }, authenticatedUserId: string) {
  try {
    const { filePath } = payload;

    // INPUT VALIDATION: Validate filePath
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'File path is required' 
      }, { status: 400 });
    }

    // SECURITY: Sanitize file path and check for path traversal
    const sanitizedPath = sanitizeInput(filePath);
    
    // Check if path contains traversal attempts
    if (sanitizedPath.includes('..') || sanitizedPath.includes('\\')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file path: path traversal detected' 
      }, { status: 400 });
    }

    // AUTHORIZATION: Ensure user can only delete their own files
    if (!sanitizedPath.startsWith(`${authenticatedUserId}/`)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot delete files from other users'
      }, { status: 403 });
    }

    const { error } = await supabaseServiceClient.storage
      .from(STORAGE_BUCKET)
      .remove([sanitizedPath]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete handling error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }, { status: 500 });
  }
}

async function setupBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseServiceClient.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const bucket = buckets.find(b => b.name === STORAGE_BUCKET);
    
    if (!bucket) {
      // Create bucket
      const { error: createError } = await supabaseServiceClient.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        throw createError;
      }
    }

    // Set up RLS policies for the bucket
    await setupStoragePolicies();

    return NextResponse.json({ 
      success: true, 
      bucketExists: true,
      message: 'Storage bucket configured successfully' 
    });

  } catch (error) {
    console.error('Bucket setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bucket setup failed',
    }, { status: 500 });
  }
}

async function ensureBucketExists() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseServiceClient.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const bucket = buckets.find(b => b.name === STORAGE_BUCKET);
    
    if (!bucket) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseServiceClient.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        throw createError;
      }

      // Set up policies after creating bucket
      await setupStoragePolicies();
    }
  } catch (error) {
    console.error('Ensure bucket exists error:', error);
    // Don't throw here, let the upload continue and handle errors appropriately
  }
}

async function setupStoragePolicies() {
  try {
    // Note: Storage policies are typically set up through SQL in Supabase dashboard
    // This is a placeholder for policy setup if needed via API
    console.log('Storage policies should be configured in Supabase dashboard');
  } catch (error) {
    console.error('Policy setup error:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check_bucket') {
      // Check bucket status
      const { data: buckets, error } = await supabaseServiceClient.storage.listBuckets();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const bucket = buckets.find(b => b.name === STORAGE_BUCKET);
      
      return NextResponse.json({
        bucketExists: !!bucket,
        bucket: bucket || null,
        buckets: buckets.map(b => ({ id: b.id, name: b.name, public: b.public }))
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Storage check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}