import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a service role client for admin operations
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

const STORAGE_BUCKET = 'profile-photos';

export async function POST(request: NextRequest) {
  try {
    const { action, ...payload } = await request.json();

    switch (action) {
      case 'upload':
        return await handleUpload(payload);
      case 'delete':
        return await handleDelete(payload);
      case 'setup_bucket':
        return await setupBucket();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpload(payload: { 
  userId: string; 
  fileName: string; 
  fileData: string; 
  contentType: string; 
}) {
  try {
    const { userId, fileName, fileData, contentType } = payload;

    // Ensure bucket exists first
    await ensureBucketExists();

    // Create the file path
    const filePath = `${userId}/${fileName}`;

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

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

async function handleDelete(payload: { filePath: string }) {
  try {
    const { filePath } = payload;

    const { error } = await supabaseServiceClient.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

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