'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError, OperationType, cn } from '@/lib/utils';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Save,
  X,
  Trash2,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    activeMembers: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    openEvents: 0,
    todayAttendance: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [manualActivities, setManualActivities] = useState<any[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivityText, setNewActivityText] = useState('');
  const [pixKey, setPixKey] = useState<string>('');
  
  const [purpose, setPurpose] = useState('');
  const [nextGradData, setNextGradData] = useState({
    name: 'BOLACHA - Instrutor (Corda Azul)',
    grad: 'Instrutor',
    progress: 85,
    requirements: [
      { text: 'Presença validada', status: true },
      { text: 'Anuidade quitada', status: true },
      { text: 'Teste técnico pendente', status: false }
    ]
  });

  const [editingPurpose, setEditingPurpose] = useState(false);
  const [editingGrad, setEditingGrad] = useState(false);

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
        if (data.next_grad_data) {
          setNextGradData(data.next_grad_data);
        }
        if (data.manual_activities) {
          setManualActivities(data.manual_activities);
        }
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

  const fetchRecent = async () => {
    try {
      const { data: latestUsers } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

      const userActivities = (latestUsers || []).map((u: any) => ({
        type: 'member',
        text: `Novo membro: ${u.username}`,
        date: new Date().toISOString() // Fallback if no created_at
      }));

      setRecentActivities([...userActivities]);
    } catch (err) {
      console.error("Erro ao buscar atividades:", err);
    }
  };

  const handleAddManualActivity = async () => {
    if (!newActivityText.trim()) return;
    const newAct = {
      type: 'manual',
      text: newActivityText,
      date: new Date().toISOString()
    };
    const updatedManual = [newAct, ...manualActivities].slice(0, 10);
    setManualActivities(updatedManual);
    await saveConfig({ manual_activities: updatedManual });
    setNewActivityText('');
    setShowAddActivity(false);
  };

  const handleRemoveManualActivity = async (index: number) => {
    const updatedManual = manualActivities.filter((_, i) => i !== index);
    setManualActivities(updatedManual);
    await saveConfig({ manual_activities: updatedManual });
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
        
      const today = new Date().toISOString().split('T')[0];
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('present', true);

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
        openEvents: eventCount || 0,
        todayAttendance: attendanceCount || 0
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
        isAdmin ? fetchRecent() : Promise.resolve()
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
    { label: 'Presentes Hoje', value: stats.todayAttendance, color: '#ffffff', icon: CheckCircle2, trend: 'Chamada ativa' },
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
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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

            <div className="bg-[#1E1E1E] rounded-2xl border border-[#333333] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b border-[#333333] flex justify-between items-center bg-[#181818]">
                <h2 className="text-lg font-black uppercase tracking-tighter italic text-brand-red">Atividade Recente</h2>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddActivity(!showAddActivity)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red hover:text-white transition-colors"
                  >
                    {showAddActivity ? 'Cancelar' : '+ Adicionar'}
                  </button>
                )}
              </div>
              <div className="p-8 space-y-4">
                 <AnimatePresence>
                   {showAddActivity && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                     >
                        <div className="bg-[#121212] border border-brand-red/30 rounded-2xl p-4 flex gap-4">
                           <input 
                              value={newActivityText}
                              onChange={e => setNewActivityText(e.target.value)}
                              placeholder="Descreva a atividade..."
                              className="flex-1 bg-transparent border-none outline-none text-sm font-bold"
                           />
                           <button 
                             onClick={handleAddManualActivity}
                             className="bg-brand-red text-white p-2 rounded-lg"
                           >
                             <Save size={16} />
                           </button>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {[...manualActivities, ...recentActivities].map((act, i) => (
                   <div key={i} className="flex items-center justify-between p-5 bg-[#121212] border border-[#333333] rounded-2xl group hover:border-brand-red transition-all">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                           act.type === 'member' ? "bg-brand-red/10 text-brand-red" : "bg-green-500/10 text-green-500"
                         )}>
                           {act.type === 'member' ? <Users size={18} /> : <ClipboardList size={18} />}
                         </div>
                         <div>
                            <p className="text-sm font-black italic uppercase tracking-tight">{act.text}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                              {new Date(act.date).toLocaleDateString('pt-BR')} • {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                      </div>
                      {isAdmin && act.type === 'manual' ? (
                        <button 
                          onClick={() => handleRemoveManualActivity(manualActivities.indexOf(act))}
                          className="text-gray-800 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <ChevronRight size={16} className="text-gray-800 group-hover:text-brand-red transition-all" />
                      )}
                   </div>
                 ))}
                 {[...manualActivities, ...recentActivities].length === 0 && (
                   <div className="py-20 text-center space-y-6">
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhuma atividade recente registrada</p>
                      {isAdmin && (
                        <div className="flex flex-wrap justify-center gap-4">
                          <button onClick={() => window.location.href='/users'} className="bg-[#121212] border border-[#333333] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-red transition-all text-brand-red">+ Cadastrar Membros</button>
                          <button onClick={() => window.location.href='/events'} className="bg-[#121212] border border-[#333333] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-red transition-all text-brand-red">+ Criar Eventos</button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] rounded-2xl border border-brand-red/20 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="p-8 border-b border-[#333333] bg-brand-red/5 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tighter italic text-white">Próxima Formatura</h2>
              {isAdmin && (
                <button onClick={() => setEditingGrad(true)} className="text-gray-500 hover:text-white">
                  <Pencil size={16} />
                </button>
              )}
            </div>
            <div className="p-8 flex flex-col h-full">
               <div className="flex items-center gap-6 mb-8 p-4 bg-[#121212] rounded-xl border border-[#333333]">
                 <div className="w-14 h-14 bg-brand-red rounded-xl flex items-center justify-center font-black italic text-2xl shadow-xl">{nextGradData.name?.[0]}</div>
                 <div>
                   <p className="text-lg font-black italic leading-none">{nextGradData.name}</p>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-2">Grau: {nextGradData.grad}</p>
                 </div>
               </div>
               
               <div className="space-y-6 flex-1">
                 <div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Progresso</span>
                     <span className="text-[10px] font-black text-brand-red">{nextGradData.progress}%</span>
                   </div>
                   <div className="h-2 w-full bg-[#121212] rounded-full overflow-hidden border border-[#333333]">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${nextGradData.progress}%` }}
                        className="h-full bg-brand-red" 
                     />
                   </div>
                 </div>
                 
                 <div className="p-6 bg-[#121212] rounded-xl border border-[#333333] space-y-4">
                   {nextGradData.requirements.map((req, rid) => (
                     <div key={rid} className="flex items-center gap-3">
                       {req.status ? <CheckCircle2 size={16} className="text-brand-red" /> : <XCircle size={16} className="text-gray-600" />}
                       <span className={cn("text-xs font-bold", req.status ? "text-gray-400" : "text-gray-600")}>{req.text}</span>
                     </div>
                   ))}
                 </div>
               </div>

               <button className="w-full mt-8 py-4 border border-[#333333] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-red hover:border-brand-red transition-all group">
                 Ver Requisitos <ChevronRight size={14} className="inline ml-2 group-hover:translate-x-1" />
               </button>
            </div>

            <AnimatePresence>
              {editingGrad && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/95 z-20 p-8 overflow-y-auto"
                >
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black italic uppercase tracking-tighter">Editar Formatura</h3>
                      <button onClick={() => setEditingGrad(false)}><X size={20}/></button>
                   </div>
                   <div className="space-y-4">
                      <input 
                        value={nextGradData.name}
                        onChange={e => setNextGradData({...nextGradData, name: e.target.value})}
                        placeholder="Nome"
                        className="w-full bg-[#121212] border border-[#333333] rounded-lg p-3 text-sm font-bold outline-none"
                      />
                      <input 
                        value={nextGradData.grad}
                        onChange={e => setNextGradData({...nextGradData, grad: e.target.value})}
                        placeholder="Grau"
                        className="w-full bg-[#121212] border border-[#333333] rounded-lg p-3 text-sm font-bold outline-none"
                      />
                      <input 
                        type="number"
                        value={nextGradData.progress}
                        onChange={e => setNextGradData({...nextGradData, progress: Number(e.target.value)})}
                        placeholder="Progresso %"
                        className="w-full bg-[#121212] border border-[#333333] rounded-lg p-3 text-sm font-bold outline-none"
                      />
                      <div className="space-y-2">
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Requisitos</p>
                         {nextGradData.requirements.map((req, rid) => (
                           <div key={rid} className="flex gap-2">
                             <input 
                               value={req.text}
                               onChange={e => {
                                 const nr = [...nextGradData.requirements];
                                 nr[rid].text = e.target.value;
                                 setNextGradData({...nextGradData, requirements: nr});
                               }}
                               className="flex-1 bg-[#121212] border border-[#333333] rounded-lg p-2 text-[10px] font-bold outline-none"
                             />
                             <button 
                               onClick={() => {
                                 const nr = [...nextGradData.requirements];
                                 nr[rid].status = !nr[rid].status;
                                 setNextGradData({...nextGradData, requirements: nr});
                               }}
                               className={cn("p-2 rounded-lg border", req.status ? "border-green-500/50 text-green-500" : "border-red-500/50 text-red-500")}
                             >
                               {req.status ? 'OK' : 'X'}
                             </button>
                           </div>
                         ))}
                      </div>
                      <button 
                         onClick={() => {
                           saveConfig({ next_grad_data: nextGradData });
                           setEditingGrad(false);
                         }}
                         className="w-full bg-brand-red text-white py-3 rounded-lg font-black uppercase text-[10px] tracking-widest mt-4"
                      >
                         SALVAR ALTERAÇÕES
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
  );
}

function XCircle({ size, className = '' }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
