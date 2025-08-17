import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Universal storage adapter that works in both server and client environments
const createUniversalStorage = () => {
  // Check if we're in server-side environment
  if (typeof window === 'undefined') {
    // Server-side: return a no-op storage that prevents errors
    return {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
      clear: async () => {},
      getAllKeys: async () => [],
    };
  }
  
  // Client-side: try to use AsyncStorage, fallback to localStorage
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  } catch (error) {
    // Fallback to localStorage for web environments
    try {
      return {
        getItem: async (key: string) => localStorage.getItem(key),
        setItem: async (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: async (key: string) => localStorage.removeItem(key),
        clear: async () => localStorage.clear(),
        getAllKeys: async () => Object.keys(localStorage),
      };
    } catch (localStorageError) {
      // Ultimate fallback for environments without localStorage
      return {
        getItem: async (_key: string) => null,
        setItem: async (_key: string, _value: string) => {},
        removeItem: async (_key: string) => {},
        clear: async () => {},
        getAllKeys: async () => [],
      };
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createUniversalStorage(),
    autoRefreshToken: typeof window !== 'undefined', // Only auto-refresh on client-side
    persistSession: typeof window !== 'undefined',   // Only persist on client-side
    detectSessionInUrl: false, // Disable for React Native
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