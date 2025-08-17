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
        // Create basic user object from auth user
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          sport: authUser.user_metadata?.sport,
          grad_year: authUser.user_metadata?.grad_year,
        });
      } else if (profile) {
        // User profile exists in database
        setUser({
          id: profile.id,
          email: profile.email || authUser.email || '',
          full_name: profile.full_name || '',
          sport: profile.sport,
          grad_year: profile.grad_year,
          email_verified: !!authUser.email_confirmed_at,
          is_parent_approved: profile.is_parent_approved,
          created_at: profile.created_at,
        });
      } else {
        // No profile found, create from auth user metadata
        const newUser = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          sport: authUser.user_metadata?.sport,
          grad_year: authUser.user_metadata?.grad_year,
        };
        setUser(newUser);
        
        // Create profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || '',
            sport: authUser.user_metadata?.sport,
            grad_year: authUser.user_metadata?.grad_year,
          });
          
        if (profileError) {
          console.warn('Error creating profile:', profileError);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to auth user data
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || '',
      });
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

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
          // Graceful fallback - continue with no authentication
          setLoading(false);
        }
      }
    };

    // Initialize authentication
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
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
        console.error('Signup error:', error);
        return { user: null, error };
      }

      // Profile will be created automatically via loadUserProfile when auth state changes
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