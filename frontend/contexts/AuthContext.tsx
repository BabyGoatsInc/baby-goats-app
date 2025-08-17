import React, { createContext, useContext, useEffect, useState } from 'react';
// import { supabase, AuthUser, UserProfile } from '../lib/supabase';
// import { Session, User } from '@supabase/supabase-js';

// Temporary mock types for testing
interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  sport?: string;
  grad_year?: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  sport?: string;
  grad_year?: number;
  avatar_url?: string;
}

interface Session {
  user: AuthUser;
  access_token: string;
}

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ profile: UserProfile | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock initialization - for testing social features without Supabase
  useEffect(() => {
    setTimeout(() => {
      // Create a mock user for testing social features
      const mockUser: AuthUser = {
        id: 'mock-user-123',
        email: 'athlete@babygoats.com',
        full_name: 'Elite Athlete',
        sport: 'Soccer',
        grad_year: 2025,
      };
      
      const mockSession: Session = {
        user: mockUser,
        access_token: 'mock-token-123'
      };
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
    }, 1000);
  }, []);

  // Mock function - not needed with mock data
  const loadUserProfile = async (authUser: User) => {
    // This function is not needed with mock data
    setLoading(false);
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Signup error:', error);
        return { user: null, error };
      }

      // If user is created and confirmed, create profile
      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email
        console.log('✅ User created, email confirmation required');
        return { user: data.user, error: null };
      }

      // If user is immediately confirmed, create profile
      if (data.user && data.user.email_confirmed_at) {
        const profileData: Partial<UserProfile> = {
          id: data.user.id,
          full_name: userData.full_name || '',
          age: userData.age,
          parent_email: userData.parent_email,
          is_parent_approved: userData.age ? (userData.age >= 13) : true,
          sport: userData.sport || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await createProfile(profileData);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        return { user: null, error };
      }

      console.log('✅ User signed in successfully');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return { profile: null, error };
      }

      console.log('✅ Profile created successfully');
      return { profile: data, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { profile: null, error };
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        return { profile: null, error: 'No user logged in' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { profile: null, error };
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, profile: data } : null);
      
      console.log('✅ Profile updated successfully');
      return { profile: data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { profile: null, error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}