'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabase';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  phone?: string;
  monthly_paid?: boolean;
  graduation?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAdmin: boolean;
  loading: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || user?.username?.toUpperCase() === 'BOLACHA';
  }, [user]);

  const login = useCallback((userData: UserData) => {
    setUser(userData);
    localStorage.setItem('muzenza_session', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('muzenza_session');
    // Also clear supabase auth just in case
    supabase.auth.signOut();
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        const updatedUser: UserData = {
          id: data.id,
          username: data.username,
          role: (data.role || 'user') as 'admin' | 'user',
          phone: data.phone,
          monthly_paid: data.monthly_paid,
          graduation: data.graduation
        };
        setUser(updatedUser);
        localStorage.setItem('muzenza_session', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do usuário:", err);
    }
  }, [user]);

  useEffect(() => {
    const savedSession = localStorage.getItem('muzenza_session');
    if (savedSession) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('muzenza_session');
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      loading, 
      login, 
      logout,
      refreshUserData 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
