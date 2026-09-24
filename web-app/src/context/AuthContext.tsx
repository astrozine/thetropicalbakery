'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  /** The assembled one-line address. Kept in step with the fields below. */
  address: string | null;
  delivery_zone: string | null;

  // A delivery address split into fields, so nobody has to guess at a CEP
  // and the weekly route can be grouped by neighbourhood.
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_reference: string | null;

  is_vegan: boolean;
  is_gluten_free: boolean;
  is_sugar_free: boolean;
  is_salt_free: boolean;
  is_oil_free: boolean;

  // The detailed picture (migration 19). The five booleans above are kept in
  // step with these, so older screens keep working. Ids: src/lib/dietary.ts.
  diet_tags: string[] | null;
  /** Allergen ids the person must avoid — the same ids each treat declares. */
  allergens_avoid: string[] | null;
  diet_notes: string | null;

  /** Never guessed at, never substituted — this one has to be exactly right. */
  allergies: string | null;
  birth_date: string | null;
  household_size: number | null;
  favorite_flavors: string | null;
  avoid_ingredients: string | null;
  how_found_us: string | null;
  marketing_opt_in: boolean | null;
}

export type OAuthProvider = 'google' | 'facebook';
export type LoginMethod = OAuthProvider | 'email' | 'phone';

/** Everything here reports problems as a returned message rather than throwing.
 *  These run in the middle of someone placing an order — a login hiccup must
 *  show a friendly line of Portuguese, never blow up the checkout. */
type Result = { error?: string };

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  availableMethods: LoginMethod[];
  signInWithProvider: (provider: OAuthProvider) => Promise<Result>;
  sendEmailLink: (email: string) => Promise<Result>;
  sendPhoneCode: (phone: string) => Promise<Result>;
  verifyPhoneCode: (phone: string, code: string) => Promise<Result>;
  signOut: () => Promise<void>;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Turns whatever a Brazilian customer types into the +55DDXXXXXXXXX format
 * that SMS requires. Accepts "(12) 99123-4567", "12991234567", "+55 12 99123 4567".
 * Returns null when it isn't a plausible Brazilian mobile.
 */
export function toBrazilianE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  const withoutCountry = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits;

  // DDD (2) + mobile number (9, always starting with 9 in Brazil)
  if (withoutCountry.length !== 11) return null;
  if (withoutCountry[2] !== '9') return null;

  return `+55${withoutCountry}`;
}

/** Pretty-prints a stored number back as (12) 99123-4567 for display. */
export function formatBrazilianPhone(input: string | null | undefined): string {
  if (!input) return '';
  const d = input.replace(/\D/g, '').replace(/^55/, '');
  if (d.length !== 11) return input;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableMethods, setAvailableMethods] = useState<LoginMethod[]>([]);

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

  // Ask Supabase which sign-in methods are actually switched on, so we never
  // show a button that would fail. Turning Facebook or phone login on in the
  // Supabase dashboard makes it appear here with no code change.
  useEffect(() => {
    const loadMethods = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        });
        const settings = await res.json();
        const enabled = (['google', 'facebook', 'phone', 'email'] as LoginMethod[])
          .filter(method => settings?.external?.[method]);
        setAvailableMethods(enabled);
      } catch {
        // Fall back to the two we know are configured rather than showing nothing.
        setAvailableMethods(['google', 'email']);
      }
    };

    loadMethods();
  }, []);

  const signInWithProvider = async (provider: OAuthProvider): Promise<Result> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // Come back to the page they were on — someone signing in mid-checkout
      // should land back in that checkout, not on the homepage.
      options: { redirectTo: window.location.href },
    });
    if (error) return { error: 'Não foi possível abrir o login. Tente novamente.' };
    return {};
  };

  const sendEmailLink = async (email: string): Promise<Result> => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { error: 'Digite um e-mail válido.' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.href },
    });

    if (error) {
      console.error('Email login error:', error);
      return {
        error: error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível enviar o e-mail. Tente novamente.',
      };
    }
    return {};
  };

  const sendPhoneCode = async (phone: string): Promise<Result> => {
    const e164 = toBrazilianE164(phone);
    if (!e164) {
      return { error: 'Digite o número com DDD, por exemplo (12) 99123-4567.' };
    }

    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });

    if (error) {
      console.error('Phone login error:', error);
      return {
        error: error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível enviar o código. Tente novamente.',
      };
    }
    return {};
  };

  const verifyPhoneCode = async (phone: string, code: string): Promise<Result> => {
    const e164 = toBrazilianE164(phone);
    if (!e164) return { error: 'Número inválido.' };

    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return { error: 'O código tem 6 dígitos.' };

    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: digits,
      type: 'sms',
    });

    if (error) {
      console.error('Phone verify error:', error);
      return { error: 'Código incorreto ou expirado. Peça um novo código.' };
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Deliberately never throws. This runs while an order is being placed, and a
  // profile sync problem must never be able to fail someone's purchase.
  const saveProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    // Only ever send columns we have a real value for. Sending `null` would
    // erase a detail the customer already gave us on an earlier order.
    const payload: Record<string, unknown> = { id: user.id, ...data };
    if (data.email === undefined && user.email) payload.email = user.email;
    if (data.phone === undefined && user.phone) {
      payload.phone = `+${user.phone.replace(/\D/g, '')}`;
    }

    let { error } = await supabase.from('user_profiles').upsert(payload);

    // Migration 19 not run yet: save everything else rather than nothing.
    if (error && /diet_tags|allergens_avoid|diet_notes/.test(error.message)) {
      delete payload.diet_tags;
      delete payload.allergens_avoid;
      delete payload.diet_notes;
      ({ error } = await supabase.from('user_profiles').upsert(payload));
    }

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
      availableMethods,
      signInWithProvider,
      sendEmailLink,
      sendPhoneCode,
      verifyPhoneCode,
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
