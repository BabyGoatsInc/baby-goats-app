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

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      // Try to get existing profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error);
      }

      const authUserData: AuthUser = {
        id: authUser.id,
        email: authUser.email!,
        profile: profile || undefined
      };

      setUser(authUserData);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
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
          email: data.user.email!,
          full_name: userData.full_name || '',
          age: userData.age,
          parent_email: userData.parent_email,
          is_parent_approved: userData.age ? (userData.age >= 13) : true,
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