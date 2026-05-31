'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-provider';
import { 
  Users, 
  Calendar, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ClipboardCheck,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Profile {
  id: string;
  username: string;
  graduation: string;
  avatar_url?: string;
}

interface Attendance {
  userId: string;
  date: string;
  present: boolean;
}

export default function AttendancePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, graduation, avatar_url')
      .order('username');
    if (!error) setProfiles(data || []);
  };

  const fetchAttendance = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id, date, present')
      .eq('date', dateStr);
    if (!error) setAttendance(data.map((a: any) => ({ ...a, userId: a.user_id })) || []);
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProfiles();
      await fetchAttendance(selectedDate);
      setLoading(false);
    };
    const init = async () => {
      await loadData();
    };
    init();

    const channel = supabase.channel('realtime_attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendance(selectedDate);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const togglePresence = async (userId: string) => {
    if (!isAdmin) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isPresent = attendance.find(a => a.userId === userId)?.present;

    try {
      if (isPresent === undefined) {
        // Optimistic update (simulated or just fetch after)
        const { error } = await supabase
          .from('attendance')
          .insert({ user_id: userId, date: dateStr, present: true });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('user_id', userId)
          .eq('date', dateStr);
        if (error) throw error;
      }
      
      // Manual re-fetch for immediate feedback
      await fetchAttendance(selectedDate);
    } catch (error) {
      console.error("Erro ao marcar presença:", error);
    }
  };

  const filteredProfiles = React.useMemo(() => profiles.filter(p => 
    p.username.toLowerCase().includes(search.toLowerCase())
  ), [profiles, search]);

  const getPresenceCount = () => attendance.length;

  return (
    <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter mb-4 uppercase">Chamada</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Controle de frequência do treino</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-[#1E1E1E] p-2 rounded-2xl border border-[#333333]">
              <button 
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-3 hover:bg-[#252525] rounded-xl text-gray-500 hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-6 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-1">
                  {format(selectedDate, 'eeee', { locale: ptBR })}
                </span>
                <span className="text-lg font-black italic uppercase tracking-tight">
                  {format(selectedDate, 'dd/MM/yyyy')}
                </span>
              </div>
              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-3 hover:bg-[#252525] rounded-xl text-gray-500 hover:text-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar aluno pelo apelido..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#333333] rounded-2xl py-6 pl-16 pr-8 text-lg font-bold tracking-tight outline-none focus:border-brand-red transition-all shadow-2xl"
              />
            </div>

            <div className="bg-[#1E1E1E] rounded-3xl border border-[#333333] shadow-2xl overflow-hidden">
               <div className="p-5 sm:p-8 border-b border-[#333333] flex justify-between items-center bg-[#181818]">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Lista de Alunos</h2>
                  <span className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-full">
                    {filteredProfiles.length} TOTAL
                  </span>
               </div>
               
               <div className="divide-y divide-[#333333]">
                 {loading ? (
                   <div className="p-20 text-center text-gray-600 font-bold uppercase tracking-widest">Carregando chamada...</div>
                 ) : filteredProfiles.map((profile) => {
                   const isPresent = attendance.find(a => a.userId === profile.id);
                   return (
                     <div 
                       key={profile.id} 
                       className={cn(
                        "p-6 flex items-center justify-between transition-all group",
                        isPresent ? "bg-brand-red/[0.03]" : "hover:bg-[#222222]"
                       )}
                     >
                       <div className="flex items-center gap-5">
                         <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-xl border-2 transition-all duration-300 overflow-hidden",
                           isPresent 
                            ? "bg-brand-red border-brand-red text-white shadow-[0_0_20px_rgba(211,47,47,0.3)]" 
                            : "bg-[#121212] border-[#333333] text-gray-600"
                         )}>
                           {profile.avatar_url ? (
                             <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                           ) : (
                             profile.username[0]?.toUpperCase()
                           )}
                         </div>
                         <div>
                            <p className={cn(
                              "text-xl font-black italic tracking-tighter uppercase leading-none mb-1",
                              isPresent ? "text-white" : "text-gray-400"
                            )}>
                              {profile.username}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              {profile.graduation}
                            </p>
                         </div>
                       </div>

                       <button 
                         onClick={() => togglePresence(profile.id)}
                         disabled={!isAdmin}
                         className={cn(
                           "w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2",
                           isPresent 
                            ? "bg-brand-red border-brand-red text-white" 
                            : "bg-transparent border-[#333333] text-[#333333] hover:border-brand-red hover:text-brand-red"
                         )}
                       >
                         {isPresent ? <Check size={24} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                       </button>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-8 text-brand-black">
             <div className="bg-brand-red p-5 sm:p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(211,47,47,0.4)] text-white relative overflow-hidden">
                <ClipboardCheck size={120} className="absolute -bottom-8 -right-8 opacity-20 rotate-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Presentes Hoje</p>
                <div className="flex items-end gap-3 mb-6">
                   <span className="text-8xl font-black tracking-tighter italic leading-none">{getPresenceCount()}</span>
                   <span className="text-xl font-bold opacity-60 mb-2 uppercase tracking-tighter self-end pb-2">Alunos</span>
                </div>
                <div className="pt-6 border-t border-white/20">
                   <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                     A frequência ajuda no progresso para a próxima corda.
                   </p>
                </div>
             </div>

             <div className="bg-[#1E1E1E] p-5 sm:p-8 md:p-10 rounded-3xl border border-[#333333] shadow-2xl">
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 text-brand-red">Resumo da Semana</h3>
                <div className="space-y-6">
                   {[
                     { day: 'Segunda', count: 12, max: 20 },
                     { day: 'Quarta', count: 18, max: 20 },
                     { day: 'Sexta', count: 15, max: 20 },
                   ].map((item) => (
                     <div key={item.day}>
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.day}</span>
                           <span className="text-[10px] font-black text-white">{item.count} presentes</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden">
                           <div 
                            className="h-full bg-brand-red" 
                            style={{ width: `${(item.count / item.max) * 100}%` }}
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
  );
}
