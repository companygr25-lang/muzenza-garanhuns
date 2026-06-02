'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User,
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
  ShieldCheck,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export const Sidebar = React.memo(function Sidebar({ 
  mobileOpen, 
  setMobileOpen,
  onOpenManual
}: { 
  mobileOpen?: boolean, 
  setMobileOpen?: (val: boolean) => void,
  onOpenManual?: () => void
}) {
  const pathname = usePathname();
  const { user, isAdmin, logout, appConfig } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);
  const [internalMobileOpen, setInternalMobileOpen] = React.useState(false);

  const activeMobileOpen = mobileOpen !== undefined ? mobileOpen : internalMobileOpen;
  const toggleMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(!mobileOpen);
    } else {
      setInternalMobileOpen(!internalMobileOpen);
    }
  };

  const menuItems = React.useMemo(() => [
    { name: 'Dashboard', href: isAdmin ? '/admin_panel/dashboard' : '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Perfil', href: isAdmin ? '/admin_panel/profile' : '/dashboard/profile', icon: User, adminOnly: false },
    { name: 'Membros', href: '/admin_panel/users', icon: Users, adminOnly: true },
    { name: 'Eventos', href: '/admin_panel/events', icon: Calendar, adminOnly: false },
    { name: 'Loja', href: '/admin_panel/store', icon: ShoppingBag, adminOnly: false },
    { name: 'Regras', href: '/admin_panel/rules', icon: ShieldCheck, adminOnly: false },
    { name: 'Pagamentos', href: '/admin_panel/payments', icon: CreditCard, adminOnly: false },
    { name: 'Certificados', href: '/admin_panel/certificates', icon: Award, adminOnly: true },
    { name: 'Tesouraria', href: '/admin_panel/treasury', icon: Trophy, adminOnly: false },
    { name: 'Configurações', href: '/admin_panel/settings', icon: Settings, adminOnly: true },
    { name: 'Guia Prático', href: '#manual', icon: ClipboardCheck, adminOnly: false },
  ], [isAdmin]);

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

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-[#000000] text-white border-r border-[#333333] transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}>
        <div className="p-8 flex flex-col items-center border-b border-[#333333]">
          <Link href="/" className="flex flex-col items-center gap-2 overflow-hidden" prefetch={false}>
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-[0_0_20px_rgba(211,47,47,0.2)]">
              <img 
                src={appConfig?.logoUrl} 
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
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                   {(appConfig?.cityName || 'GARANHUNS').toUpperCase()} - {(appConfig?.countryName || 'PE').toUpperCase()}
                 </span>
              </motion.div>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto min-h-0 pr-1 select-none">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={(e) => {
                if (item.href === '#manual') {
                  e.preventDefault();
                  if (onOpenManual) onOpenManual();
                }
              }}
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
               <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden border border-[#333333]">
                 {user?.avatar_url ? (
                   <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                 ) : (
                   user?.username?.[0]?.toUpperCase() || 'U'
                 )}
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
        {activeMobileOpen && (
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
              className="lg:hidden fixed inset-y-0 left-0 w-3/4 max-w-xs bg-[#000000] text-white p-6 z-50 flex flex-col border-r border-[#333333] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full overflow-hidden border border-white">
                      <img 
                        src={appConfig?.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                   </div>
                   <div>
                     <h1 className="text-lg font-black tracking-tighter text-brand-red leading-none">MUZENZA</h1>
                     <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
                       {(appConfig?.cityName || 'GARANHUNS').toUpperCase()} - {(appConfig?.countryName || 'PE').toUpperCase()}
                     </span>
                   </div>
                 </div>
                 <button onClick={toggleMobile} className="p-2 text-gray-500 hover:text-white">
                   <X size={24} />
                 </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto min-h-0 pr-1 py-1 select-none">
                {filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === '#manual') {
                        e.preventDefault();
                        if (onOpenManual) onOpenManual();
                      }
                      toggleMobile();
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all font-bold tracking-tight",
                      pathname === item.href 
                        ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" 
                        : "text-gray-400 hover:bg-[#1A1A1A] hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-sm uppercase tracking-wider">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-[#333333] space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-black overflow-hidden border border-[#333333]">
                     {user?.avatar_url ? (
                       <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                     ) : (
                       user?.username?.[0]?.toUpperCase()
                     )}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold uppercase text-white">{user?.username}</p>
                    <p className="text-gray-500 uppercase tracking-widest text-[8px]">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 p-4 text-red-500 font-bold uppercase tracking-widest text-[10px] hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut size={18} />
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
