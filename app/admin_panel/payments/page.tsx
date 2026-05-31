'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError, OperationType } from '@/lib/utils';
import { 
  CreditCard, 
  Copy, 
  CheckCircle2, 
  QrCode, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { generatePixPayload } from '@/lib/pix-utils';

export default function PaymentsPage() {
  const { user, isAdmin, loading: authLoading, refreshUserData } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pixData, setPixData] = useState({ key: '', name: '', bank: '' });

  const pixPayload = React.useMemo(() => {
    if (!pixData.key || !pixData.name) return '';
    return generatePixPayload(pixData.key, pixData.name);
  }, [pixData.key, pixData.name]);

  const fetchPix = async () => {
    if (!user) return;
    try {
      let fetchedKey = '';
      let fetchedName = '';
      let fetchedBank = '';

      if (user.role === 'director') {
        fetchedKey = user.pix_key || '';
        fetchedName = user.pix_name || '';
        fetchedBank = user.pix_bank || '';
      } else if (user.director_id) {
        const { data: directorData, error: dirError } = await supabase
          .from('users')
          .select('pix_key, pix_name, pix_bank')
          .eq('id', user.director_id)
          .single();
        
        if (!dirError && directorData && directorData.pix_key) {
          fetchedKey = directorData.pix_key;
          fetchedName = directorData.pix_name || '';
          fetchedBank = directorData.pix_bank || '';
        }
      }

      // Fallback global
      if (!fetchedKey) {
        const { data: config, error: configError } = await supabase
          .from('config')
          .select('*')
          .eq('id', 'global')
          .single();
        
        if (!configError && config) {
          fetchedKey = config.pix_key || '';
          fetchedName = config.pix_name || '';
          fetchedBank = config.pix_bank || '';
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPixData({
        key: fetchedKey,
        name: fetchedName,
        bank: fetchedBank
      });
    } catch (err) {
      console.error("Erro ao buscar config PIX para região:", err);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPix();
    }
  }, [user]);

  const handleCopy = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">Pagamentos</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Contribuições e mensalidades</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-brand-red/10 p-4 border border-brand-red/20 rounded-xl w-full md:w-auto">
                <p className="text-[10px] text-brand-red uppercase font-black tracking-widest mb-1">Situação Financeira</p>
                <p className={cn(
                  "text-sm font-black italic tracking-tight",
                  (user?.monthly_paid || user?.role === 'director' || user?.role === 'admin' || user?.username?.toUpperCase() === 'BOLACHA') ? "text-green-500" : "text-red-500"
                )}>
                  {(user?.role === 'director' || user?.role === 'admin' || user?.username?.toUpperCase() === 'BOLACHA') ? "ACESSO VITALÍCIO" : (user?.monthly_paid ? "MENSALIDADE OK" : "PENDÊNCIA DETECTADA")}
                </p>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* PIX Payment Section */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-[#1E1E1E] p-12 rounded-3xl border border-[#333333] shadow-2xl space-y-10 border-l-8 border-brand-red"
          >
            <div className="flex items-center gap-4 mb-4">
               <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red">
                 <QrCode size={32} />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">Pague via PIX</h2>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Opção rápida e segura</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-[#121212] border border-[#333333] rounded-2xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Chave PIX (CPF/CNPJ)</p>
                <div className="flex items-center justify-between gap-4">
                   <p className="text-xl font-mono font-bold text-white tracking-widest truncate max-w-[200px]">{pixData.key || 'NÃO CONFIGURADA'}</p>
                   <button 
                     onClick={handleCopy}
                     disabled={!pixData.key}
                     className={cn(
                       "p-3 rounded-xl transition-all shadow-xl disabled:opacity-50",
                       copied ? "bg-green-600 text-white" : "bg-brand-red text-white hover:bg-[#B71C1C]"
                     )}
                   >
                     {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                   </button>
                </div>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setShowQR(!showQR)}
                  className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 hover:text-brand-red transition-all px-8 py-3 border border-[#333333] hover:border-brand-red rounded-full"
                >
                  {showQR ? "Ocultar QR Code" : "Gerar QR Code"}
                </button>
              </div>

              <AnimatePresence>
                {showQR && pixData.key && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col items-center gap-6 overflow-hidden pt-4"
                  >
                    <div className="p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                       <QRCodeSVG value={pixPayload} size={200} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest max-w-[250px] text-center">
                      Escaneie com o app do seu banco para confirmar a mensalidade para <strong>{pixData.name}</strong> ({pixData.bank}).
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isAdmin && (
                <div className="pt-10 border-t border-[#333333] space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-red flex items-center gap-2">
                    <ExternalLink size={16} /> Configuração Adm (PIX)
                  </h3>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Chave PIX (CPF/CNPJ/Email)"
                      value={pixData.key}
                      onChange={e => setPixData({...pixData, key: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-4 text-white outline-none focus:border-brand-red text-xs font-bold"
                    />
                    <input 
                      type="text" 
                      placeholder="Nome do Beneficiário"
                      value={pixData.name}
                      onChange={e => setPixData({...pixData, name: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-4 text-white outline-none focus:border-brand-red text-xs font-bold"
                    />
                    <input 
                      type="text" 
                      placeholder="Banco"
                      value={pixData.bank}
                      onChange={e => setPixData({...pixData, bank: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-4 text-white outline-none focus:border-brand-red text-xs font-bold"
                    />
                          <button 
                            onClick={async () => {
                              try {
                                if (user?.role === 'director') {
                                  const { error } = await supabase
                                    .from('users')
                                    .update({
                                      pix_key: pixData.key,
                                      pix_name: pixData.name,
                                      pix_bank: pixData.bank
                                    })
                                    .eq('id', user.id);
                                  
                                  if (error) throw error;
                                  await refreshUserData();
                                  alert('Dados PIX da sua região salvos com sucesso!');
                                } else {
                                  // Admin (Bolacha) saves globally
                                  const { error } = await supabase.from('config').upsert({
                                    id: 'global',
                                    pix_key: pixData.key,
                                    pix_name: pixData.name,
                                    pix_bank: pixData.bank
                                  }, { onConflict: 'id' });
                                  
                                  if (error) throw error;
                                  alert('Configurações PIX globais salvas com sucesso!');
                                }
                              } catch (err: any) {
                                console.error("Erro ao salvar PIX:", err);
                                alert('Erro ao salvar: ' + (err.message || String(err)));
                              }
                            }}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-red hover:text-white transition-all shadow-xl"
                          >
                            SALVAR ALTERAÇÕES
                          </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#333333] flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-brand-black">Validação Automática</span>
               </div>
               <p className="text-[10px] font-black italic text-brand-red tracking-widest uppercase">Mensalidade: R$ 50,00</p>
            </div>
          </motion.div>

          {/* History/Policy Section */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-[#1E1E1E] p-10 rounded-3xl border border-[#333333] shadow-2xl relative overflow-hidden group">
               <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 group-hover:text-brand-red/5 transition-colors" />
               <h3 className="text-xl font-black italic tracking-tighter uppercase mb-6 flex items-center gap-3">
                 <AlertCircle size={24} className="text-brand-red" />
                 Regras do Grupo
               </h3>
               <ul className="space-y-6">
                 {[
                   "Vencimento todo dia 10 de cada mês",
                   "O não pagamento impede participação em eventos",
                   "Membros em atraso não podem retirar abadás da loja",
                   "Valores revertidos para infraestrutura e eventos"
                 ].map((rule, i) => (
                   <li key={i} className="flex gap-4 group/li">
                     <span className="shrink-0 w-6 h-6 rounded-full bg-[#121212] border border-[#333333] flex items-center justify-center text-[10px] font-black text-brand-red group-hover/li:bg-brand-red group-hover/li:text-white transition-all">
                       {i + 1}
                     </span>
                     <p className="text-gray-400 text-sm font-medium leading-relaxed uppercase tracking-tight group-hover/li:text-white transition-colors">{rule}</p>
                   </li>
                 ))}
               </ul>
            </div>

            <div className="bg-[#1E1E1E] p-10 rounded-3xl border border-[#333333] shadow-2xl">
               <h3 className="text-xl font-black italic tracking-tighter uppercase mb-6">Últimos Pagamentos</h3>
               <div className="space-y-4">
                  {[
                    { label: "Mensalidade Abril", date: "10/04/2026", status: "confirmado" },
                    { label: "Inscrição Batizado", date: "22/03/2026", status: "confirmado" }
                  ].map((pay, i) => (
                    <div key={i} className="p-5 bg-[#121212] border border-[#333333] rounded-2xl flex items-center justify-between hover:border-brand-red transition-all cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-brand-red/10 rounded-xl text-brand-red">
                             <CheckCircle2 size={20} />
                          </div>
                          <div>
                             <p className="font-black italic text-sm uppercase tracking-tight">{pay.label}</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{pay.date}</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-gray-700 group-hover:text-brand-red transition-all" />
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      </div>
  );
}

