'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError, OperationType } from '@/lib/utils';
import { 
  Settings as SettingsIcon, 
  Wallet, 
  Tag, 
  Bell, 
  UserPlus, 
  Trash2, 
  Save, 
  QrCode,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { user, isAdmin, loading } = useAuth();
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [pixBank, setPixBank] = useState('');
  const [highlightedEventId, setHighlightedEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setDataLoading(true);
    try {
      // Fetch Config
      const { data: config, error: configError } = await supabase
        .from('config')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (!configError && config) {
        setPixKey(config.pix_key || '');
        setPixName(config.pix_name || '');
        setPixBank(config.pix_bank || '');
        setHighlightedEventId(config.highlighted_event_id || '');
      }

      // Fetch Events for dropdown
      const { data: eventsList, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .order('date', { ascending: false });
      
      if (!eventsError && eventsList) {
        setEvents(eventsList);
      }
    } catch (err) {
      console.error("Erro ao buscar dados de config:", err);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [isAdmin]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let payload: any = {
        id: 'global',
        pix_key: pixKey,
        pix_name: pixName,
        pix_bank: pixBank,
        highlighted_event_id: highlightedEventId
      };

      let success = false;
      let lastError = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await supabase
          .from('config')
          .upsert(payload, { onConflict: 'id' });

        if (!error) {
          success = true;
          break;
        }

        lastError = error;
        const errMsg = error.message || '';
        const missingColumnMatch = errMsg.match(/column ['"]?([a-zA-Z0-9_]+)['"]?/i);

        let pruned = false;
        if (missingColumnMatch) {
          const colName = missingColumnMatch[1];
          if (colName && colName in payload) {
            delete payload[colName];
            pruned = true;
          }
        }

        if (!pruned) {
          if ('pix_bank' in payload) {
            delete payload['pix_bank'];
          } else {
            break;
          }
        }
      }

      if (!success && lastError) throw lastError;
      alert("Configurações salvas!");
    } catch (error: any) {
      console.error("Erro ao salvar config:", error);
      alert("Erro ao salvar: " + (error.message || String(error)));
    } finally {
      setSaving(false);
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center opacity-40">
        <ShieldAlert size={64} className="mx-auto mb-4" />
        <h2 className="text-2xl font-black">ACESSO NEGADO</h2>
        <p className="text-xs uppercase font-bold tracking-widest mt-2">Esta página é restrita para o Administrador Geral (Mestre Bolacha).</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">CONFIGURAÇÕES</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Gerencie o sistema e as integrações.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={handleSaveConfig} className="space-y-8">
            <div className="p-8 bg-card border border-border rounded-[2.5rem] space-y-6">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <Wallet className="text-brand-red" /> Configuração PIX
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 px-2">Chave PIX</label>
                  <input 
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="E-mail, CPF, Celular ou Chave Aleatória"
                    className="w-full bg-secondary border-none rounded-2xl p-4 outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 px-2">Nome do Titular</label>
                  <input 
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    placeholder="Nome completo do recebedor"
                    className="w-full bg-secondary border-none rounded-2xl p-4 outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 px-2">Banco</label>
                  <input 
                    value={pixBank}
                    onChange={(e) => setPixBank(e.target.value)}
                    placeholder="Ex: Nubank, Itaú..."
                    className="w-full bg-secondary border-none rounded-2xl p-4 outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-card border border-border rounded-[2.5rem] space-y-6">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <Bell className="text-brand-red" /> Promoção de Eventos
              </h2>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest opacity-40 px-2">Evento em Destaque</label>
                <select 
                  value={highlightedEventId}
                  onChange={(e) => setHighlightedEventId(e.target.value)}
                  className="w-full bg-secondary border-none rounded-2xl p-4 outline-none focus:ring-1 focus:ring-brand-red appearance-none cursor-pointer"
                >
                  <option value="">Nenhum</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                <p className="text-[10px] opacity-40 mt-2 px-2">Este evento aparecerá na tela de login e no início para todos os membros.</p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-brand-red text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-red/20 flex items-center justify-center gap-2"
            >
              <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>

          <div className="space-y-8">
            <div className="p-8 bg-brand-black text-brand-white rounded-[2.5rem] border border-white/10">
              <h2 className="text-2xl font-black tracking-tighter mb-4">Preview do Convite</h2>
              <p className="text-white/60 text-sm mb-8 leading-relaxed">
                Assim que você configurar seu PIX, os membros verão este cartão durante as inscrições e compras.
              </p>
              
              <div className="p-6 bg-white rounded-3xl flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-inner">
                  <QrCode size={120} className="text-brand-black" />
                </div>
                <div className="mt-6 text-center text-brand-black">
                  <p className="font-black text-lg uppercase tracking-tight">{pixName || 'NOME DO TITULAR'}</p>
                  <p className="text-xs font-bold opacity-40 uppercase">{pixBank || 'BANCO'}</p>
                  <div className="mt-4 p-3 bg-gray-100 rounded-xl font-mono text-[10px] break-all">
                    {pixKey || 'CHAVE-PIX-AQUI'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-secondary/50 rounded-[2.5rem] border border-border">
              <h2 className="text-xl font-black tracking-tighter mb-4 flex items-center gap-3">
                <Tag className="text-brand-red" /> Atalhos de Sistema
              </h2>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 bg-background rounded-2xl text-sm font-bold hover:bg-brand-red hover:text-white transition-all group">
                  Exportar Lista de Membros <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-background rounded-2xl text-sm font-bold hover:bg-brand-red hover:text-white transition-all group">
                  Backup do Banco de Dados <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-background rounded-2xl text-sm font-bold hover:bg-brand-red hover:text-white transition-all group">
                  Limpar Logs de Atividade <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
