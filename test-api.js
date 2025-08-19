// Simple test to check if our APIs can connect to Supabase
const { createServerComponentClient } = require('@supabase/auth-helpers-nextjs');

console.log('Testing Supabase connection...');

// Test basic connection
async function testConnection() {
  try {
    const supabase = createServerComponentClient({ 
      cookies: () => ({}), // Mock cookies for testing
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

    // Test direct table access
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Success! Friendships table accessible:', data);
    }

  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();