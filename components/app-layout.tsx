'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Sidebar } from './sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { ManualModal } from './manual-modal';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const isNewRegister = localStorage.getItem('muzenza_new_register');
      if (isNewRegister === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setManualOpen(true);
        localStorage.removeItem('muzenza_new_register');
      }
    }
  }, [user]);

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
  const breadcrumb = pathParts[pathParts.length - 1] 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1).replace('_', ' ') 
    : 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
        onOpenManual={() => setManualOpen(true)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 sm:h-16 border-b border-[#333333] flex items-center justify-between px-4 lg:px-8 bg-[#121212] sticky top-0 z-30 pt-4 sm:pt-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2 text-xs md:text-sm">
              <span className="hidden md:inline text-gray-500 font-medium whitespace-nowrap">Portal Muzenza</span>
              <span className="hidden md:inline text-gray-500">/</span>
              <span className="font-bold text-white tracking-tight truncate max-w-[150px] md:max-w-none">{breadcrumb}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-4">
               <div className="hidden sm:block w-px h-6 bg-[#333333]"></div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black hidden sm:block">SISTEMA ONLINE</p>
               </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in pb-10">
            {children}
          </div>
        </div>
      </main>

      {/* Manual Modal / Slides Guide */}
      <ManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}
