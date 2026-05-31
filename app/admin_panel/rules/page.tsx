'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/sound';
import { 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function RulesPage() {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('rules')
        .eq('id', 'global')
        .single();
      
      if (!error && data) {
        const fetchedRules = Array.isArray(data.rules) ? data.rules : [];
        setRules(fetchedRules.length > 0 ? fetchedRules : [
          "Vencimento todo dia 10 de cada mês",
          "O não pagamento impede participação em eventos",
          "Membros em atraso não podem retirar abadás da loja",
          "Valores revertidos para infraestrutura e eventos"
        ]);
      }
    } catch (err) {
       console.error("Erro ao buscar regras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules();
  }, []);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({
          id: 'global',
          rules: rules
        });
      
      if (error) throw error;
      setEditing(false);
      playNotificationSound();
      alert('Regras atualizadas com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar regras:", err);
      alert("Erro ao salvar regras: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const addRule = () => {
    if (!Array.isArray(rules)) return;
    setRules([...rules, "Nova regra..."]);
  };

  const updateRule = (index: number, val: string) => {
    if (!Array.isArray(rules)) return;
    const newRules = [...rules];
    newRules[index] = val;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    if (!Array.isArray(rules)) return;
    setRules(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter mb-4 uppercase">Regras do Grupo</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Conduta e normas oficiais Muzenza Garanhuns</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => editing ? handleSave() : setEditing(true)}
              className={cn(
                "px-8 py-4 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-2xl",
                editing ? "bg-green-600 hover:bg-green-700 text-white" : "bg-brand-red hover:bg-[#B71C1C] text-white"
              )}
            >
              {editing ? <Save size={20} /> : <FileText size={20} />}
              {editing ? 'SALVAR REGRAS' : 'EDITAR REGRAS'}
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1E1E1E] p-12 rounded-3xl border border-[#333333] shadow-2xl relative overflow-hidden group border-l-8 border-brand-red">
               <ClipboardList className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5" />
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic tracking-tighter uppercase">Estatuto Interno</h2>
                      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Normas de convivência e organização</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence>
                      {Array.isArray(rules) && rules.map((rule, i) => (
                        <motion.div 
                          key={i}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex gap-6 group/li bg-[#121212] p-6 rounded-2xl border border-[#333333] hover:border-brand-red/50 transition-all"
                        >
                          <span className="shrink-0 w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-black italic shadow-lg">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                             {editing ? (
                               <textarea 
                                 value={rule}
                                 onChange={e => updateRule(i, e.target.value)}
                                 className="w-full bg-transparent border-none text-white font-medium leading-relaxed outline-none focus:ring-0 p-0"
                                 rows={2}
                               />
                             ) : (
                               <p className="text-gray-300 font-medium leading-relaxed uppercase tracking-tight">{rule}</p>
                             )}
                          </div>
                          {editing && (
                            <button onClick={() => removeRule(i)} className="text-gray-600 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {editing && (
                      <button 
                        onClick={addRule}
                        className="w-full py-6 border-2 border-dashed border-[#333333] rounded-2xl text-gray-500 hover:text-brand-red hover:border-brand-red transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest"
                      >
                        <Plus size={20} /> Adicionar Nova Norma
                      </button>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-brand-red/10 border border-brand-red/30 p-10 rounded-3xl">
               <h3 className="text-xl font-black italic tracking-tighter uppercase mb-6 flex items-center gap-3 text-brand-red">
                 <AlertCircle size={24} />
                 Importante
               </h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">
                 As regras do grupo são fundamentais para manter a ordem e o respeito mútuo. 
                 Todos os membros devem estar cientes de suas responsabilidades para o bom 
                 funcionamento do Muzenza Garanhuns.
               </p>
               <div className="p-4 bg-brand-red/5 rounded-xl border border-brand-red/10 text-[10px] font-black uppercase tracking-widest text-brand-red/80">
                 Ultima atualização: {new Date().toLocaleDateString('pt-BR')}
               </div>
            </div>
          </div>
        </div>
      </div>
  );
}
