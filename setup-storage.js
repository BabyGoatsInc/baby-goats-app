const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupStorage() {
  console.log('🔄 Setting up Supabase Storage...');
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const profilePhotosBucket = buckets.find(bucket => bucket.name === 'profile-photos');
    
    if (!profilePhotosBucket) {
      console.log('📁 Creating profile-photos bucket...');
      
      // Create bucket
      const { data: bucketData, error: createError } = await supabase.storage.createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }
    
    // Set up storage policies
    console.log('🔐 Setting up storage policies...');
    
    const policies = [
      // Allow public read access to profile photos
      `
      CREATE POLICY IF NOT EXISTS "Public Access for Profile Photos" ON storage.objects
      FOR SELECT USING (bucket_id = 'profile-photos');
      `,
      // Allow authenticated users to insert their own photos
      `
      CREATE POLICY IF NOT EXISTS "Authenticated users can upload profile photos" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'profile-photos' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
      `,
      // Allow users to update their own photos
      `
      CREATE POLICY IF NOT EXISTS "Users can update own profile photos" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'profile-photos'
        AND auth.role() = 'authenticated' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
      `,
      // Allow users to delete their own photos
      `
      CREATE POLICY IF NOT EXISTS "Users can delete own profile photos" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'profile-photos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
      `
    ];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { 
        query: policy.trim() 
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error('❌ Error creating policy:', error);
      }
    }
    
    console.log('✅ Storage policies configured');
    console.log('🎉 Supabase Storage setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Alternative approach using SQL directly if RPC doesn't work
async function setupStorageWithSQL() {
  console.log('🔄 Setting up storage policies with direct SQL...');
  
  try {
    // Enable RLS on storage.objects if not already enabled
    const { error: rlsError } = await supabase
      .from('storage.objects')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('⚠️ RLS might not be enabled on storage.objects');
    }
    
    console.log('✅ Storage setup complete (policies may need manual setup)');
    
  } catch (error) {
    console.error('❌ SQL setup failed:', error);
  }
}

if (require.main === module) {
  setupStorage().catch(console.error);
}

module.exports = { setupStorage };