import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Create a compatibility layer for AsyncStorage
const createCompatibleAsyncStorage = () => {
  try {
    // Try to import AsyncStorage dynamically to avoid server-side issues
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  } catch (error) {
    console.warn('AsyncStorage not available, using fallback storage');
    // Return a compatible fallback that works in server environments
    return {
      getItem: async (key: string) => {
        try {
          return typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage.getItem(key) 
            : null;
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch {
          // Silently fail in server environment
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch {
          // Silently fail in server environment
        }
      },
      clear: async () => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
          }
        } catch {
          // Silently fail in server environment
        }
      },
      getAllKeys: async () => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return Object.keys(window.localStorage);
          }
          return [];
        } catch {
          return [];
        }
      },
    };
  }
};

// Create Supabase client with compatibility layer
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCompatibleAsyncStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

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