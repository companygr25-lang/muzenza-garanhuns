'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabase';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'director';
  phone?: string;
  monthly_paid?: boolean;
  graduation?: string;
  avatar_url?: string;
  city?: string;
  country?: string;
  director_id?: string;
  pix_key?: string;
  pix_name?: string;
  pix_bank?: string;
}

interface AppConfig {
  logoUrl: string;
  cityName: string;
  countryName: string;
}

interface AuthContextType {
  user: UserData | null;
  userData: UserData | null; // Alias for backward compatibility
  isAdmin: boolean;
  loading: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  refreshUserData: () => void;
  appConfig: AppConfig;
  setAppConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    if (typeof window !== 'undefined') {
      const savedVisitor = localStorage.getItem('muzenza_visitor_config');
      if (savedVisitor) {
        try {
          return JSON.parse(savedVisitor);
        } catch (_) {}
      }
    }
    return {
      logoUrl: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
      cityName: 'GARANHUNS',
      countryName: 'PE'
    };
  });

  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'director' || user?.username?.toUpperCase() === 'BOLACHA';
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
          role: (data.role || 'user') as 'admin' | 'user' | 'director',
          phone: data.phone,
          monthly_paid: data.monthly_paid,
          graduation: data.graduation,
          avatar_url: data.avatar_url,
          city: data.city,
          country: data.country,
          director_id: data.director_id
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
        const parsed = JSON.parse(savedSession);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
        
        // Sincronizar silenciosamente com o banco de dados para garantir dados atualizados (como avatar_url)
        supabase
          .from('users')
          .select('*')
          .eq('id', parsed.id)
          .single()
          .then(({ data, error }: { data: any; error: any }) => {
            if (data && !error) {
              const updatedUser: UserData = {
                id: data.id,
                username: data.username,
                role: (data.role || 'user') as 'admin' | 'user' | 'director',
                phone: data.phone,
                monthly_paid: data.monthly_paid,
                graduation: data.graduation,
                avatar_url: data.avatar_url,
                city: data.city,
                country: data.country,
                director_id: data.director_id
              };
              setUser(updatedUser);
              localStorage.setItem('muzenza_session', JSON.stringify(updatedUser));
            }
          });
      } catch (e) {
        localStorage.removeItem('muzenza_session');
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  // Update appConfig dynamically when user logs in/out or changes
  useEffect(() => {
    if (!user) {
      // Check if visitor has selected a custom regional config
      const savedVisitor = localStorage.getItem('muzenza_visitor_config');
      if (savedVisitor) {
        try {
          const parsed = JSON.parse(savedVisitor);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAppConfig(parsed);
        } catch (_) {}
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAppConfig({
          logoUrl: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
          cityName: 'GARANHUNS',
          countryName: 'PE'
        });
      }
      return;
    }

    if (user.role === 'director') {
      setAppConfig({
        logoUrl: user.avatar_url || 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
        cityName: user.city || 'GARANHUNS',
        countryName: user.country || 'PE'
      });
    } else if (user.role === 'user' && user.director_id) {
      // Fetch director details to get their avatar and city
      supabase
        .from('users')
        .select('avatar_url, city, country')
        .eq('id', user.director_id)
        .single()
        .then(({ data }: any) => {
          if (data) {
            setAppConfig({
              logoUrl: data.avatar_url || 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
              cityName: data.city || 'Desconhecido',
              countryName: data.country || 'PE'
            });
          }
        });
    } else {
      // Default / Admin or null director_id
      setAppConfig({
        logoUrl: user.avatar_url || 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
        cityName: user.city || 'GARANHUNS',
        countryName: user.country || 'PE'
      });
    }
  }, [user]);

  // Handle Dynamic Title, Favicon & Apple-touch-icon in DOM
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const formattedCity = (appConfig.cityName || 'GARANHUNS').toUpperCase();
      const formattedCountry = (appConfig.countryName || 'PE').toUpperCase();
      document.title = `MUZENZA • ${formattedCity} - ${formattedCountry}`;

      // Update favicon URLs
      const favicons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (favicons.length > 0) {
        favicons.forEach(fav => {
          fav.href = appConfig.logoUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = appConfig.logoUrl;
        document.head.appendChild(link);
      }

      // Apple touch icon
      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = appConfig.logoUrl;
    }
  }, [appConfig]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData: user,
      isAdmin, 
      loading, 
      login, 
      logout,
      refreshUserData,
      appConfig,
      setAppConfig
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
