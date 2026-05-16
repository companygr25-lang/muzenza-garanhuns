'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError, OperationType, cn } from '@/lib/utils';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Pencil,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    activeMembers: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    openEvents: 0
  });

  const [pixKey, setPixKey] = useState<string>('');
  
  const [purpose, setPurpose] = useState('');
  const [editingPurpose, setEditingPurpose] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (!error && data) {
        setPixKey(data.pix_key || '');
        setPurpose(data.purpose || 'O Sistema Muzenza Garanhuns foi desenvolvido para centralizar a gestão do nosso grupo de Capoeira. Nossa missão é preservar a tradição, organizar o progresso técnico dos alunos e facilitar o acesso aos eventos oficiais e uniformes do grupo.');
      }
    } catch (err) {
      console.error("Erro ao buscar config:", err);
    }
  };

  const saveConfig = async (update: any) => {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ id: 'global', ...update });
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar config:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
        
      // Fetch pending payments (excluding BOLACHA)
      const { count: pendingCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('monthly_paid', false)
        .not('username', 'ilike', 'BOLACHA');

      setStats({
        activeMembers: userCount || 0,
        pendingPayments: pendingCount || 0,
        confirmedPayments: 0,
        openEvents: eventCount || 0
      });
    } catch (err) {
      console.error("Erro ao buscar stats:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchConfig(),
        fetchStats(),
      ]);
    };
    init();

    const usersChannel = supabase.channel('dashboard_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchStats();
      })
      .subscribe();

    const eventsChannel = supabase.channel('dashboard_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [isAdmin]);

  const statCards = [
    { label: 'Membros Ativos', value: stats.activeMembers, color: '#D32F2F', icon: Users, trend: 'Total cadastrado' },
    { label: 'Mensalidade Pendente', value: stats.pendingPayments, color: '#D32F2F', icon: AlertTriangle, trend: 'Atenção necessária' },
    { label: 'Eventos Abertos', value: stats.openEvents, color: '#22c55e', icon: Calendar, trend: 'Disponíveis' },
  ];

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter mb-4 uppercase">Visão Geral</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Painel administrativo operacional</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Chave PIX Ativa</p>
                <p className="text-sm font-mono font-bold text-white">{pixKey || 'NÃO CONFIGURADA'}</p>
             </div>
             <button className="bg-brand-red p-3 rounded-xl hover:bg-[#B71C1C] transition-colors">
               <TrendingUp size={20} className="text-white" />
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{ borderLeftColor: stat.color }}
              className="bg-[#1E1E1E] p-8 rounded-2xl border-l-[6px] border-[#333333] shadow-2xl group hover:border-[#333333] hover:translate-y-[-4px] transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">{stat.label}</p>
                <stat.icon size={20} style={{ color: stat.color }} className="opacity-50" />
              </div>
              <p className="text-5xl font-black tracking-tighter mb-2 italic">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: stat.color === '#ffffff' ? '#6b7280' : stat.color }}>
                {stat.trend}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-1 gap-8">
          <div className="space-y-8">
            <div className="bg-brand-red/5 border border-brand-red/20 p-8 rounded-3xl relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-brand-red">Nossa Finalidade</h2>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      if (editingPurpose) saveConfig({ purpose });
                      setEditingPurpose(!editingPurpose);
                    }}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {editingPurpose ? <Save size={18} /> : <Pencil size={18} />}
                  </button>
                )}
              </div>
              {editingPurpose ? (
                <textarea 
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-xl p-4 text-white font-medium leading-relaxed outline-none focus:border-brand-red"
                  rows={4}
                />
              ) : (
                <p className="text-gray-400 font-medium leading-relaxed">
                  {purpose || "Nossa missão é preservar a tradição, organizar o progresso técnico dos alunos e facilitar o acesso aos eventos oficiais e uniformes do grupo."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
