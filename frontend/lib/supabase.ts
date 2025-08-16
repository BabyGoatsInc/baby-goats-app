import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ssdzlzlubzcknkoflgyf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types for TypeScript
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  age?: number;
  sport?: string;
  experience_level?: string;
  passion_level?: number;
  selected_goals?: string[];
  grad_year?: number;
  parent_email?: string;
  is_parent_approved?: boolean;
  onboarding_completed?: boolean;
  onboarding_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}