'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  delivery_zone: string | null;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;
}

export type AuthProvider = 'google' | 'facebook';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  availableProviders: AuthProvider[];
  signIn: (provider: AuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<AuthProvider[]>([]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Ask Supabase which social providers are actually configured, so we never
  // render a button that would fail. Enabling Facebook in the Supabase
  // dashboard makes its button appear with no code change.
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        });
        const settings = await res.json();
        const enabled = (['google', 'facebook'] as AuthProvider[])
          .filter(provider => settings?.external?.[provider]);
        setAvailableProviders(enabled);
      } catch {
        setAvailableProviders(['google']);
      }
    };

    loadProviders();
  }, []);

  const signIn = async (provider: AuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // Come back to the page they were on — someone signing in mid-checkout
      // should land back in that checkout, not on the homepage.
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Deliberately never throws. This runs while an order is being placed, and a
  // profile sync problem must never be able to fail someone's purchase.
  const saveProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, email: user.email, ...data });

    if (error) {
      console.error('Could not save profile:', error);
      return;
    }

    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      availableProviders,
      signIn,
      signOut,
      saveProfile,
    }}>
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
