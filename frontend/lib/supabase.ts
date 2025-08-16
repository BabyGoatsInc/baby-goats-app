import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Conditionally create Supabase client only in proper React Native environment
let supabaseClient: any = null;

const createSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    } catch (error) {
      console.warn('Supabase client creation failed:', error);
      // Create a mock client for server-side rendering
      supabaseClient = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: null } }),
        },
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
        }),
      };
    }
  }
  return supabaseClient;
};

export const supabase = createSupabaseClient();

// Database types matching the actual Supabase schema
export interface UserProfile {
  id: string;
  full_name: string;
  sport?: string;
  grad_year?: number;
  hero_name?: string;
  hero_reason?: string;
  avatar_url?: string;
  age?: number;
  team_name?: string;
  jersey_number?: string;
  parent_email?: string;
  is_parent_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}