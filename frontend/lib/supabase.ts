import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Lazy-loaded Supabase client to avoid import-time AsyncStorage issues
let _supabaseClient: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient => {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  // Create storage adapter that works in both environments
  const createStorage = () => {
    // Server-side environment - return no-op storage
    if (typeof window === 'undefined') {
      return {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
        clear: async () => {},
        getAllKeys: async () => [],
      };
    }

    // Client-side environment - use appropriate storage
    try {
      // Try AsyncStorage first (React Native)
      const AsyncStorage = eval('require')('@react-native-async-storage/async-storage').default;
      return AsyncStorage;
    } catch {
      // Fallback to localStorage (web)
      try {
        return {
          getItem: async (key: string) => localStorage.getItem(key),
          setItem: async (key: string, value: string) => localStorage.setItem(key, value),
          removeItem: async (key: string) => localStorage.removeItem(key),
          clear: async () => localStorage.clear(),
          getAllKeys: async () => Object.keys(localStorage),
        };
      } catch {
        // Ultimate fallback - no-op storage
        return {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
          clear: async () => {},
          getAllKeys: async () => [],
        };
      }
    }
  };

  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorage(),
      autoRefreshToken: typeof window !== 'undefined',
      persistSession: typeof window !== 'undefined',
      detectSessionInUrl: false,
    },
  });

  return _supabaseClient;
};

// Export a getter function instead of direct client
export const getSupabase = () => createSupabaseClient();

// For backward compatibility, export as supabase
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = createSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

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