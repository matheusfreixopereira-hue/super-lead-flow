import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'supervisor' | 'closer' | 'sdr';

interface AuthContextType {
  user: User | null;
  profile: { display_name: string; email: string; role: string } | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
  isCloser: boolean;
  isSDR: boolean;
  canViewMarketing: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; email: string; role: string } | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, email, role')
      .eq('user_id', userId)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (roleData) {
      setRole(roleData as AppRole);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isCloser = role === 'closer';
  const isSDR = role === 'sdr';
  const canViewMarketing = isAdmin || isSupervisor;
  const canManageUsers = isAdmin || isSupervisor;

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading,
      signIn, signOut,
      isAdmin, isSupervisor, isCloser, isSDR,
      canViewMarketing, canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
