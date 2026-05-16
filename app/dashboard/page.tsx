'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function UserDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Events
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .limit(3);
        
        // Fetch Store Items (Prioritize Promotions)
        const { data: itemsData } = await supabase
          .from('store_items')
          .select('*')
          .order('on_sale', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch Rules
        const { data: configData } = await supabase
          .from('config')
          .select('rules')
          .eq('id', 'global')
          .single();

        setEvents(eventsData || []);
        setStoreItems(itemsData || []);
        setRules(configData?.rules || []);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
     return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
     );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter mb-4 uppercase leading-none">Salve, <span className="text-brand-red">{user?.username}</span></h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] lg:text-xs tracking-widest">Bem-vindo ao seu painel Muzenza Garanhuns</p>
        </div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "flex items-center gap-5 px-8 py-5 rounded-2xl border-l-[6px] shadow-2xl backdrop-blur-xl transition-all",
            user?.monthly_paid ? "bg-green-600/10 border-green-600" : "bg-brand-red/10 border-brand-red"
          )}
        >
          <div className={cn("p-3 rounded-xl shadow-lg", user?.monthly_paid ? "bg-green-600 text-white" : "bg-brand-red text-white")}>
            {user?.monthly_paid ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status Mensalidade</p>
            <p className="text-xl font-black italic uppercase tracking-tighter text-white">
              {user?.monthly_paid ? 'PAGA / EM DIA' : 'PENDENTE'}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
           {/* Active Events Section */}
           <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#333333] pb-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Calendar className="text-brand-red" size={26} />
                  Programação Oficial
                </h2>
                <Link href="/admin_panel/events" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-red transition-all flex items-center gap-2 group/link">
                  Ver Tudo <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid gap-4">
                {events.map((event, i) => (
                  <motion.div 
                    key={event.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-6 hover:border-brand-red/40 transition-all group cursor-pointer"
                  >
                     <div className="w-20 h-20 bg-[#000000] rounded-xl flex flex-col items-center justify-center border border-[#333333] shrink-0 shadow-xl group-hover:scale-105 transition-transform">
                        <span className="text-brand-red font-black text-3xl leading-none italic mb-1">{new Date(event.date).getDate()}</span>
                        <span className="text-[10px] font-black uppercase text-gray-500">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-black italic uppercase tracking-tight text-xl mb-3 truncate group-hover:text-brand-red transition-colors">{event.title}</h3>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                           <span className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-full border border-[#333333]">
                              <MapPin size={12} className="text-brand-red" /> {event.location}
                           </span>
                           <span className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-full border border-[#333333]">
                              <Clock size={12} className="text-brand-red" /> {new Date(event.date).getFullYear()}
                           </span>
                        </div>
                     </div>
                     <Link href="/admin_panel/events" className="hidden md:flex bg-[#121212] p-4 rounded-xl text-gray-500 group-hover:text-white group-hover:bg-brand-red transition-all shadow-xl">
                        <ExternalLink size={20} />
                     </Link>
                  </motion.div>
                ))}
                {events.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-[#333333] rounded-3xl">
                     <Calendar size={48} className="mx-auto text-gray-800 mb-4 opacity-20" />
                     <p className="text-gray-600 font-bold uppercase text-[10px] tracking-[0.3em]">Nenhum evento em destaque no momento</p>
                  </div>
                )}
              </div>
           </section>

           {/* Promotional Store Section */}
           <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#333333] pb-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="text-brand-red" size={26} />
                  Destaques da Loja
                </h2>
                <Link href="/admin_panel/store" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-red transition-all flex items-center gap-2 group/link">
                  Catalogo Completo <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                 {storeItems.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="bg-[#1A1A1A] border border-[#333333] rounded-2xl overflow-hidden group hover:border-brand-red transition-all shadow-2xl flex flex-col"
                    >
                       <div className="h-40 bg-[#000000] relative flex items-center justify-center border-b border-[#333333] overflow-hidden">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                            />
                          ) : (
                            <ShoppingBag className="text-gray-900 group-hover:text-brand-red transition-colors" size={48} />
                          )}
                          <div className="absolute top-4 right-4 bg-brand-red text-[10px] font-black uppercase px-4 py-1.5 rounded-full italic tracking-widest shadow-2xl border border-white/10 z-10">
                             R$ {item.price}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="p-6 flex-1 flex flex-col">
                          <span className="text-[8px] font-black uppercase text-brand-red tracking-[0.2em] mb-2">{item.category}</span>
                          <h4 className="font-black italic uppercase tracking-tight text-sm mb-4 line-clamp-1">{item.name}</h4>
                          <Link href="/admin_panel/store" className="mt-auto w-full py-3 bg-[#121212] border border-[#333333] group-hover:bg-brand-red group-hover:border-brand-red transition-all text-center rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic">
                             Solicitar
                          </Link>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </section>
        </div>

        {/* Right Column: Rules & Info */}
        <div className="lg:col-span-4 space-y-8">
           <motion.div 
             initial={{ x: 40, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="bg-[#1A1A1A] border border-[#333333] rounded-[2.5rem] p-10 lg:sticky lg:top-24 shadow-2xl overflow-hidden group"
           >
              <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
              
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red ring-1 ring-brand-red/20">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">Normas</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Grupo Muzenza</p>
                    </div>
                 </div>
                 
                 <div className="space-y-5">
                     {rules.slice(0, 6).map((rule, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ x: 20, opacity: 0 }}
                         animate={{ x: 0, opacity: 1 }}
                         transition={{ delay: 0.5 + (i * 0.1) }}
                         className="flex gap-4 group/item"
                       >
                          <div className="shrink-0 w-6 h-6 rounded-lg bg-brand-red text-white flex items-center justify-center text-[10px] font-black italic shadow-lg group-hover/item:scale-110 transition-transform">
                             {i+1}
                          </div>
                          <p className="text-xs font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors leading-relaxed tracking-tight py-0.5">
                             {rule}
                          </p>
                       </motion.div>
                     ))}
                     
                     <div className="pt-6 mt-6 border-t border-[#333333]">
                        <Link 
                          href="/admin_panel/rules" 
                          className="w-full py-5 bg-[#121212] hover:bg-brand-red border border-[#333333] hover:border-brand-red rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all block italic"
                        >
                          Ler Estatuto Completo
                        </Link>
                     </div>
                 </div>
              </div>
           </motion.div>

           <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.8 }}
             className="bg-gradient-to-br from-brand-red to-[#8B0000] p-10 rounded-[2.5rem] text-white shadow-3xl shadow-brand-red/20 relative overflow-hidden group"
           >
              <TrendingUp className="absolute -bottom-6 -left-6 w-32 h-32 text-white/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
              <div className="relative z-10">
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-tight">Preserve Nossa<br />Tradição</h3>
                 <p className="text-xs font-bold text-white/70 leading-relaxed mb-8 uppercase tracking-wide">
                    O Grupo Muzenza Garanhuns mantém a chama da capoeira acesa através da disciplina e do respeito.
                 </p>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 w-fit px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                    Saiba Mais <ExternalLink size={14} />
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
