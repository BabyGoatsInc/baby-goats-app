import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, AuthUser, UserProfile } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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

  // Function to load user profile from database
  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading user profile:', error);
        setUser({
          id: authUser.id,
          email: authUser.email || '',
        });
      } else if (profile) {
        setUser({
          id: profile.id,
          email: profile.email || authUser.email || '',
          full_name: profile.full_name || '',
          sport: profile.sport,
          grad_year: profile.grad_year,
          email_verified: true,
          is_parent_approved: profile.is_parent_approved,
          created_at: profile.created_at,
        });
      } else {
        // No profile found, create minimal user object
        setUser({
          id: authUser.id,
          email: authUser.email || '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create minimal user object even if profile loading fails
      setUser({
        id: authUser.id,
        email: authUser.email || '',
      });
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Mock function - not needed with mock data
  const loadUserProfile = async (authUser: User) => {
    // This function is not needed with mock data
    setLoading(false);
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      // Mock signup - simulate successful registration
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
      
      // Mock signin - simulate successful login
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
      // Mock signout - clear user state
      setUser(null);
      setSession(null);
      console.log('✅ Mock user signed out successfully');
    } catch (error) {
      console.error('Mock signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<UserProfile>) => {
    try {
      // Mock profile creation
      const mockProfile: UserProfile = {
        id: profileData.id || 'mock-profile-' + Date.now(),
        full_name: profileData.full_name || 'Mock User',
        sport: profileData.sport,
        grad_year: profileData.grad_year,
        avatar_url: profileData.avatar_url,
      };

      console.log('✅ Mock profile created successfully');
      return { profile: mockProfile, error: null };
    } catch (error) {
      console.error('Mock error creating profile:', error);
      return { profile: null, error };
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        return { profile: null, error: 'No user logged in' };
      }

      // Mock profile update
      const updatedProfile: UserProfile = {
        id: user.id,
        full_name: profileData.full_name || user.full_name,
        sport: profileData.sport || user.sport,
        grad_year: profileData.grad_year || user.grad_year,
        avatar_url: profileData.avatar_url,
      };

      // Update local user state
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