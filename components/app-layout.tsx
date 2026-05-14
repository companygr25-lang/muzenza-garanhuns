'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Sidebar } from './sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#121212]">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Breadcrumbs logic
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#333333] flex items-center justify-between px-8 bg-[#121212] sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500 font-medium">Painel de Controle</span>
            <span className="text-gray-500">/</span>
            <span className="font-bold text-white tracking-tight">{breadcrumb}</span>
          </div>
          <div className="flex items-center space-x-4">
             {/* Dynamic content could go here */}
             <div className="hidden md:flex items-center space-x-4">
               <div className="w-px h-6 bg-[#333333]"></div>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Status: Online</p>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
