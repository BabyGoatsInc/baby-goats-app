import React, { createContext, useContext, useEffect, useState } from 'react';
// Temporarily using mock authentication while resolving AsyncStorage compatibility
// import { supabase, AuthUser, UserProfile } from '../lib/supabase';
// import { Session, User } from '@supabase/supabase-js';

// Mock types for stable operation
interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
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

  // Initialize with working authentication (mock for stability)
  useEffect(() => {
    setTimeout(() => {
      // Create a mock user for testing social features
      const mockUser: AuthUser = {
        id: 'stable-user-123',
        email: 'athlete@babygoats.com',
        full_name: 'Elite Athlete',
        sport: 'Soccer',
        grad_year: 2025,
      };
      
      const mockSession: Session = {
        user: mockUser,
        access_token: 'stable-token-123'
      };
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
    }, 1000);
  }, []);

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      console.log('✅ Mock signup successful for:', email);
      
      const mockUser: User = {
        id: 'mock-user-' + Date.now(),
        email: email,
      };

      return { user: mockUser, error: null };
    } catch (error) {
      console.error('Mock signup error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('✅ Mock signin successful for:', email);
      
      const mockUser: User = {
        id: 'mock-user-signin-' + Date.now(),
        email: email,
      };

      return { user: mockUser, error: null };
    } catch (error) {
      console.error('Mock signin error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setSession(null);
      console.log('✅ Mock user signed out successfully');
    } catch (error) {
      console.error('Mock signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        return { profile: null, error: 'No user logged in' };
      }

      const updatedProfile: UserProfile = {
        id: user.id,
        full_name: profileData.full_name || user.full_name || '',
        sport: profileData.sport || user.sport,
        grad_year: profileData.grad_year || user.grad_year,
        avatar_url: profileData.avatar_url,
      };

      setUser(prev => prev ? { ...prev, ...updatedProfile } : null);
      
      console.log('✅ Mock profile updated successfully');
      return { profile: updatedProfile, error: null };
    } catch (error) {
      console.error('Mock error updating profile:', error);
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