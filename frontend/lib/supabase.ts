// Temporarily disabled real Supabase client to avoid AsyncStorage compatibility issues
// This is a stub implementation that prevents import-time crashes

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

// Mock Supabase client that prevents crashes
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: function() { return this; },
    single: function() { return this; },
  }),
};

export const getSupabase = () => supabase;

// Export types for backward compatibility
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