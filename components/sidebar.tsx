'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Trophy,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export const Sidebar = React.memo(function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const menuItems = React.useMemo(() => [
    { name: 'Dashboard', href: '/admin_panel/dashboard', icon: LayoutDashboard, adminOnly: true },
    { name: 'Membros', href: '/admin_panel/users', icon: Users, adminOnly: true },
    { name: 'Chamada', href: '/admin_panel/attendance', icon: ClipboardCheck, adminOnly: true },
    { name: 'Eventos', href: '/admin_panel/events', icon: Calendar, adminOnly: false },
    { name: 'Loja', href: '/admin_panel/store', icon: ShoppingBag, adminOnly: false },
    { name: 'Regras', href: '/admin_panel/rules', icon: ShieldCheck, adminOnly: false },
    { name: 'Pagamentos', href: '/admin_panel/payments', icon: CreditCard, adminOnly: false },
    { name: 'Configurações', href: '/admin_panel/settings', icon: Settings, adminOnly: true },
  ], []);

  const filteredItems = React.useMemo(() => {
    return menuItems.filter(item => {
      if (!item.adminOnly) return true;
      if (isAdmin) return true;
      return false;
    });
  }, [isAdmin, menuItems]);

  const handleSignOut = async () => {
    try {
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error("Erro ao sair:", error);
      window.location.href = '/';
    }
  };

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-brand-red text-white rounded-full shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-[#000000] text-white border-r border-[#333333] transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}>
        <div className="p-8 flex flex-col items-center border-b border-[#333333]">
          <Link href="/" className="flex flex-col items-center gap-2 overflow-hidden" prefetch={false}>
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-[0_0_20px_rgba(211,47,47,0.2)]">
              <img 
                src="https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg" 
                alt="MUZENZA Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                 <h1 className="text-xl font-black tracking-tighter text-brand-red leading-none">MUZENZA</h1>
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Garanhuns - PE</span>
              </motion.div>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 px-6 py-3 transition-all group relative",
                pathname === item.href 
                  ? "bg-brand-red text-white shadow-[inset_4px_0_0_0_#ffffff]" 
                  : "text-gray-400 hover:bg-[#1A1A1A] hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                pathname === item.href ? "text-white" : "group-hover:text-brand-red"
              )} />
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-sm tracking-tight"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          ))}
        </nav>


        <div className="p-4 border-t border-[#333333] space-y-2">
          <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs font-bold">
                 {user?.username?.[0]?.toUpperCase() || 'U'}
               </div>
               {isOpen && (
                 <div className="text-xs">
                   <p className="font-bold uppercase truncate max-w-[120px]">{user?.username || 'Gueest'}</p>
                   <p className="text-gray-500 uppercase text-[9px] font-bold tracking-widest">{user?.role || 'Visitante'}</p>
                 </div>
               )}
             </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all overflow-hidden"
          >
            <LogOut size={16} />
            {isOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobile}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-3/4 max-w-xs bg-[#000000] text-white p-8 z-50 flex flex-col border-r border-[#333333]"
            >
              <div className="flex flex-col items-center mb-12">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-[0_0_20px_rgba(211,47,47,0.2)] mb-4">
                  <img 
                    src="https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg" 
                    alt="MUZENZA Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-brand-red">MUZENZA</h1>
                <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Garanhuns - PE</span>
              </div>

              <nav className="flex-1 space-y-4">
                {filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMobile}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all font-bold tracking-tight",
                      pathname === item.href 
                        ? "bg-brand-red text-white" 
                        : "text-gray-400"
                    )}
                  >
                    <item.icon size={22} />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-[#333333] space-y-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 p-4 text-red-500 font-bold"
                >
                  <LogOut size={22} />
                  <span>Sair</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
