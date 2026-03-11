'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRequestRef = useRef(0);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      profileRequestRef.current += 1;
      setProfile(null);
      return;
    }

    const requestId = profileRequestRef.current + 1;
    profileRequestRef.current = requestId;
    const sb = getSupabaseClient();
    if (!sb) { setProfile(null); return; }
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('aura_balance, username')
        .eq('id', userId)
        .single();
      if (requestId !== profileRequestRef.current) return;
      if (error || !data) {
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch {
      if (requestId !== profileRequestRef.current) return;
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setProfile(null); setLoading(false); return; }

    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) loadProfile(u.id);
      else {
        profileRequestRef.current += 1;
        setProfile(null);
      }
    });

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      else {
        profileRequestRef.current += 1;
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email, password, username) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    profileRequestRef.current += 1;
    setUser(null);
    setProfile(null);
  };
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const refreshProfile = useCallback(() => {
    if (userRef.current?.id) loadProfile(userRef.current.id);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, loadProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
