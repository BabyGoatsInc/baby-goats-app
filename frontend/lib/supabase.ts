import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Create a robust storage solution that works in all environments
const createUniversalStorage = () => {
  // Server-side environment detection
  if (typeof window === 'undefined') {
    // Server-side: return no-op storage to prevent errors
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      clear: async () => {},
      getAllKeys: async () => [],
    };
  }

  // Client-side: Progressive storage detection
  try {
    // Try to detect if we're in React Native environment
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // React Native environment - use AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      return AsyncStorage.default || AsyncStorage;
    } else {
      // Web environment - use localStorage with async interface
      return {
        getItem: async (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Silently fail if localStorage is not available
          }
        },
        removeItem: async (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Silently fail
          }
        },
        clear: async () => {
          try {
            localStorage.clear();
          } catch {
            // Silently fail
          }
        },
        getAllKeys: async () => {
          try {
            return Object.keys(localStorage);
          } catch {
            return [];
          }
        },
      };
    }
  } catch (error) {
    console.warn('Storage detection failed, using fallback:', error);
    // Ultimate fallback for any edge cases
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      clear: async () => {},
      getAllKeys: async () => [],
    };
  }
};

// Lazy initialization to avoid import-time issues
let _supabaseClient: SupabaseClient | null = null;

const createSupabaseClient = () => {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  try {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: createUniversalStorage(),
        autoRefreshToken: typeof window !== 'undefined',
        persistSession: typeof window !== 'undefined',
        detectSessionInUrl: false, // Disable for React Native
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Return a fallback mock client to prevent crashes
    _supabaseClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
        eq: function() { return this; },
        single: function() { return this; },
      }),
    } as any;
  }

  return _supabaseClient;
};

// Export the client getter
export const getSupabaseClient = () => createSupabaseClient();

// Export a proxy for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = createSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Export TypeScript interfaces
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  sport?: string;
  grad_year?: number;
  email_verified?: boolean;
  is_parent_approved?: boolean;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  sport?: string;
  grad_year?: number;
  avatar_url?: string;
  location?: string;
  bio?: string;
  parent_email?: string;
  is_parent_approved?: boolean;
  created_at?: string;
}