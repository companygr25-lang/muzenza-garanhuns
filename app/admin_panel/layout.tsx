'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Avoid flickering spinner if we already have a user
  if (loading && !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#121212]">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If loading is finished but no user, the useEffect will handle redirect
  if (!user && !loading) return null;

  // We have a user OR we are still loading but have a user (session refresh)
  // Breadcrumbs logic moves down to after user check
  const pathParts = pathname.split('/').filter(Boolean);
  // pathParts will be e.g. ["admin_panel", "users"]
  const breadcrumb = pathParts[pathParts[0] === 'admin_panel' ? 1 : 0] || 'Dashboard';
  const displayBreadcrumb = breadcrumb.charAt(0).toUpperCase() + breadcrumb.slice(1);

  return (
    <div className="flex min-h-screen bg-[#121212] selection:bg-brand-red">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-[#333333] flex items-center justify-between px-8 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500 font-medium">Painel de Controle</span>
            <span className="text-gray-500">/</span>
            <span className="font-bold text-white tracking-tight">{displayBreadcrumb}</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex items-center space-x-4">
               <div className="w-px h-6 bg-[#333333]"></div>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Status: Online</p>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
