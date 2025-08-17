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

  // Authentication methods
  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || '',
            sport: userData.sport || '',
            grad_year: userData.grad_year || null,
          }
        }
      });

      if (error) {
        return { user: null, error };
      }

      // If signup successful and user exists, create profile
      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: userData.full_name || '',
          sport: userData.sport,
          grad_year: userData.grad_year,
          avatar_url: userData.avatar_url,
          parent_email: userData.parent_email,
          is_parent_approved: false,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
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
        return { user: null, error };
      }

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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        return { profile: null, error: 'No user logged in' };
      }

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { profile: null, error };
      }

      // Update local user state
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: updatedProfile.full_name || prev.full_name,
          sport: updatedProfile.sport || prev.sport,
          grad_year: updatedProfile.grad_year || prev.grad_year,
        };
      });

      return { profile: updatedProfile, error: null };
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