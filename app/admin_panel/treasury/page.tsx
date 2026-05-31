'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Heart, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Database,
  RefreshCw,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Contribution {
  id: string;
  user_id: string;
  contributor_name: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function TreasuryPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [pixKey, setPixKey] = useState<string>('');
  const [pixName, setPixName] = useState<string>('BOLACHA - MUZENZA');
  const [pixBank, setPixBank] = useState<string>('Mercado Pago');

  // Form states
  const [amountInput, setAmountInput] = useState<string>('20.00');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [contributorNameInput, setContributorNameInput] = useState<string>('');
  
  // App state
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [dbError, setDbError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState({
    totalApproved: 0,
    totalPending: 0,
    uniqueContributors: 0
  });

  const fetchConfig = async () => {
    try {
      if (user?.role === 'director') {
        const { data, error } = await supabase
          .from('config')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data && data.pix_key) {
          setPixKey(data.pix_key || '');
          setPixName(data.pix_name || 'SEU NOME / DIRETOR');
          setPixBank(data.pix_bank || 'SEU BANCO');
          return;
        }

        setPixKey(user.pix_key || '');
        setPixName(user.pix_name || 'SEU NOME / DIRETOR');
        setPixBank(user.pix_bank || 'SEU BANCO');
        return;
      }

      const { data, error } = await supabase
        .from('config')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (!error && data) {
        setPixKey(data.pix_key || '');
        if (data.pix_name) setPixName(data.pix_name);
        if (data.pix_bank) setPixBank(data.pix_bank);
      }
    } catch (err) {
      console.error("Erro ao carregar chave Pix:", err);
    }
  };

  const fetchContributions = async () => {
    if (!user) return;
    setLoading(true);
    setDbError(false);
    try {
      let query = supabase.from('treasury_contributions').select('*');
      if (user.role === 'director') {
        query = query.eq('director_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        // Table probably doesn't exist yet
        console.warn("Tabela treasury_contributions não encontrada no Supabase.", error.message);
        setDbError(true);
        loadLocalFallback();
      } else {
        setContributions(data || []);
        calculateStats(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar contribuições:", err);
      setDbError(true);
      loadLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    if (!user) return;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('muzenza_local_treasury');
      let fallbackData = saved ? JSON.parse(saved) : [];
      if (user.role === 'director') {
        fallbackData = fallbackData.filter((c: any) => c.director_id === user.id);
      }
      setContributions(fallbackData);
      calculateStats(fallbackData);
    }
  };

  const saveLocalFallback = (newData: Contribution[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('muzenza_local_treasury', JSON.stringify(newData));
    }
  };

  const calculateStats = (list: Contribution[]) => {
    const approved = list
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const pending = list
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const uniqueNames = new Set(list.filter((c) => c.status === 'approved').map((c) => c.contributor_name));

    setStats({
      totalApproved: approved,
      totalPending: pending,
      uniqueContributors: uniqueNames.size
    });
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContributorNameInput(user.username || '');
      fetchConfig();
      fetchContributions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const copyPixKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Por favor, informe um valor de contribuição válido.');
      return;
    }

    const contributorName = contributorNameInput.trim() || user?.username || 'Anônimo';
    const finalDirectorId = user?.role === 'director' ? user.id : (user?.director_id || null);

    const newRow = {
      id: crypto.randomUUID(),
      user_id: user?.id || '',
      contributor_name: contributorName,
      amount: amount,
      description: descriptionInput.trim(),
      status: 'pending', // Starts as pending, requires admin approval
      director_id: finalDirectorId,
      created_at: new Date().toISOString()
    };

    if (dbError) {
      // Offline fallback path
      const updatedList = [newRow, ...contributions];
      setContributions(updatedList);
      saveLocalFallback(updatedList);
      calculateStats(updatedList);
      
      setSuccessMsg(`Obrigado! Sua contribuição de R$ ${amount.toFixed(2)} foi registrada localmente.`);
      setDescriptionInput('');
    } else {
      // Postgres Supabase Path
      try {
        const { error } = await supabase
          .from('treasury_contributions')
          .insert({
            user_id: newRow.user_id,
            contributor_name: newRow.contributor_name,
            amount: newRow.amount,
            description: newRow.description,
            status: 'pending',
            director_id: finalDirectorId
          });

        if (error) throw error;

        await fetchContributions();
        setSuccessMsg(`Contribuição de R$ ${amount.toFixed(2)} reportada! Aguarde a confirmação técnica.`);
        setDescriptionInput('');
      } catch (err: any) {
        console.error("Erro ao registrar contribuição:", err);
        setErrorMsg('Erro de conexão ao salvar no banco. A transação foi gravada em modo offline.');
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    if (!isAdmin) {
      setErrorMsg('Apenas o Mestre ou administrador pode alterar o status das doações.');
      return;
    }

    if (dbError) {
      const updated = contributions.map((c) => {
        if (c.id === id) {
          return { ...c, status: newStatus };
        }
        return c;
      });
      setContributions(updated);
      saveLocalFallback(updated);
      calculateStats(updated);
      const statusLabel = newStatus === 'approved' ? 'Aprovado' : newStatus === 'rejected' ? 'Rejeitado' : 'Pendente';
      setSuccessMsg(`Status alterado com sucesso para "${statusLabel}"`);
    } else {
      try {
        const { error } = await supabase
          .from('treasury_contributions')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;
        await fetchContributions();
        const statusLabel = newStatus === 'approved' ? 'Aprovada' : newStatus === 'rejected' ? 'Rejeitada' : 'Pendente';
        setSuccessMsg(`Contribuição marcada como ${statusLabel} com sucesso!`);
      } catch (err) {
        console.error("Erro ao atualizar status:", err);
        setErrorMsg('Falha ao atualizar o status no Supabase.');
      }
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!isAdmin) return;

    if (dbError) {
      const updated = contributions.filter((c) => c.id !== id);
      setContributions(updated);
      saveLocalFallback(updated);
      calculateStats(updated);
      setSuccessMsg('Registro de tesouraria excluído.');
    } else {
      try {
        const { error } = await supabase
          .from('treasury_contributions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchContributions();
        setSuccessMsg('Registro deletado definitivamente do Supabase.');
      } catch (err) {
        console.error("Erro ao deletar:", err);
        setErrorMsg('Não foi possível excluir o registro.');
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* Title Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4 uppercase flex items-center gap-4">
          <Trophy size={42} className="text-brand-red shrink-0" />
          Tesouraria Coletiva
        </h1>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest leading-relaxed">
          Contribuições extras voluntárias para infraestrutura, melhorias físicas, uniformes e viagens oficiais do Muzenza Garanhuns.
        </p>
      </div>

      {/* SQL Missing Warning Banner */}
      {dbError && (
        <div className="bg-amber-600/10 border-2 border-amber-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="p-3 bg-amber-500 text-black rounded-2xl shrink-0">
            <Database size={24} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-black text-amber-400 uppercase tracking-tight">Banco de Dados em Modo Offline / Demonstração</h3>
            <p className="text-gray-400 text-sm font-semibold leading-relaxed">
              A tabela de tesouraria <code className="bg-[#121212] px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs">treasury_contributions</code> ainda não foi criada no seu Supabase. O módulo foi iniciado em modo de **Armazenamento Local/Simulado** para você testar imediatamente!
            </p>
            <div className="space-y-1.5 bg-black p-4 rounded-xl border border-[#333333]">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">💡 Como resolver definitivamente:</p>
              <p className="text-xs text-gray-400">
                Copie as instruções SQL do arquivo <strong className="text-white">UPDATE_DATABASE.sql</strong> na raiz do projeto e execute-as no botão <strong className="text-white">&quot;SQL Editor&quot;</strong> do seu painel do Supabase.
              </p>
            </div>
            <button 
              onClick={fetchContributions}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-wider rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={12} />
              Tentar reconectar
            </button>
          </div>
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] p-8 rounded-2xl border-l-[6px] border-[#22c55e] shadow-2xl">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Tesouraria Arrecadada</p>
          <p className="text-4xl md:text-5xl font-black tracking-tighter mb-1 text-[#22c55e] italic">
            R$ {stats.totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Saldo líquido aprovado</p>
        </div>

        <div className="bg-[#1E1E1E] p-8 rounded-2xl border-l-[6px] border-[#fbbf24] shadow-2xl">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Aguardando Aprovação</p>
          <p className="text-4xl md:text-5xl font-black tracking-tighter mb-1 text-[#fbbf24] italic">
            R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Aguardando conciliação do Pix</p>
        </div>

        <div className="bg-[#1E1E1E] p-8 rounded-2xl border-l-[6px] border-brand-red shadow-2xl">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-4">Apoiadores Únicos</p>
          <p className="text-4xl md:text-5xl font-black tracking-tighter mb-1 text-brand-red italic">
            {stats.uniqueContributors}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Alunos que apoiaram voluntariamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: PIX Key Card & Form Info */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PIX Key Details */}
          <div className="bg-brand-red/5 border-2 border-brand-red/20 p-8 rounded-3xl space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-brand-red/10 px-3 py-1.5 rounded-full">
                  Dados do Bolacha
                </span>
                <h3 className="text-xl font-black uppercase tracking-tighter pt-3">Fazer Pix Coletivo</h3>
              </div>
              <Heart size={20} className="text-brand-red animate-pulse" />
            </div>

            <p className="text-gray-400 text-xs font-semibold leading-relaxed">
              O valor vai direto para a conta oficial do Mestre para centralizar a compra de materiais, reparos e financiamento de eventos do grupo. Use a chave registrada abaixo.
            </p>

            <div className="space-y-4 bg-black p-5 rounded-2xl border border-[#333333]">
              <div>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Chave Pix Ativa</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-white tracking-tight select-all truncate">
                    {pixKey || 'CHAVE NÃO PARAMETRIZADA'}
                  </span>
                  {pixKey && (
                    <button 
                      onClick={copyPixKey}
                      className={cn(
                        "p-2 rounded-xl border transition-all shrink-0",
                        copied 
                          ? "bg-green-500/20 border-green-500 text-green-400" 
                          : "bg-[#1A1A1A] border-[#333333] hover:bg-[#252525] text-gray-400 hover:text-white"
                      )}
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#222] my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 font-bold">Iniciais Beneficiário</p>
                  <p className="text-xs font-bold text-gray-300 uppercase truncate">{pixName}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 font-bold">Banco Operador</p>
                  <p className="text-xs font-bold text-gray-300 uppercase truncate">{pixBank}</p>
                </div>
              </div>
            </div>
            {copied && (
              <p className="text-[10px] font-black uppercase tracking-wide text-green-400 text-center">
                ✔ Chave copiada para a área de transferência!
              </p>
            )}
          </div>

          {/* Contribution Reporting Form */}
          <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-[#333333] space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight italic">Registrar Apoio Financeiro</h3>

            {successMsg && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-xs flex items-center gap-2">
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-bold text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitContribution} className="space-y-4">
              
              {/* Predefined values buttons */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-bold">Valores Sugeridos</label>
                <div className="grid grid-cols-4 gap-2">
                  {['10.00', '20.00', '50.00', '100.00'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountInput(val)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-black transition-all border",
                        parseFloat(amountInput) === parseFloat(val)
                          ? "bg-brand-red border-brand-red text-white"
                          : "bg-black border-[#222222] text-gray-400 hover:border-gray-500"
                      )}
                    >
                      R$ {parseInt(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-bold">
                  Valor da Contribuição (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#121212] border border-[#303030] text-white p-4 font-bold rounded-xl outline-none focus:border-brand-red"
                />
              </div>

              {/* Contributor name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-bold">
                  Nome do Apoiador
                </label>
                <input
                  type="text"
                  required
                  value={contributorNameInput}
                  onChange={(e) => setContributorNameInput(e.target.value)}
                  placeholder="Nome do aluno"
                  className="w-full bg-[#121212] border border-[#303030] text-white p-4 rounded-xl outline-none focus:border-brand-red font-semibold"
                />
              </div>

              {/* Description / Motif */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-bold">
                  Mensagem ou Motivo (Opcional)
                </label>
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Ex: Doação para compra do berimbau azul..."
                  rows={2}
                  className="w-full bg-[#121212] border border-[#303030] text-white p-4 rounded-xl outline-none focus:border-brand-red font-semibold text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-brand-red hover:bg-[#B71C1C] text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Confirmei o Envio do Pix
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Contribution Ledger */}
        <div className="lg:col-span-7 bg-[#1A1A1A] rounded-3xl border border-[#333333] p-6 md:p-8 flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Registros Financeiros</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-1">Lista transparente de apoios adicionais</p>
            </div>
            <button 
              onClick={fetchContributions}
              className="p-2.5 bg-black hover:bg-[#252525] border border-[#333333] rounded-xl text-gray-400 hover:text-white transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase font-bold tracking-widest">Carregando livro caixa...</p>
            </div>
          ) : contributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-[#333333] rounded-2xl gap-4">
              <Heart size={36} className="text-gray-600 animate-pulse" />
              <p className="text-gray-400 font-bold text-sm uppercase">Nenhuma doação registrada ainda.</p>
              <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                Seja o primeiro a apoiar a Muzenza Garanhuns enviando um Pix e relatando sua contribuição!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {contributions.map((contribution) => (
                <div 
                  key={contribution.id}
                  className="bg-black/40 border border-[#2d2d2d] hover:border-[#383838] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-white text-sm uppercase italic">
                        {contribution.contributor_name}
                      </span>
                      <span className="text-[9px] text-gray-500 font-bold uppercase">
                        {new Date(contribution.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        contribution.status === 'approved' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : contribution.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      )}>
                        {contribution.status === 'approved' 
                          ? 'Confirmado' 
                          : contribution.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </div>

                    {contribution.description && (
                      <p className="text-gray-400 text-xs leading-relaxed">
                        &ldquo;{contribution.description}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black text-white italic">
                        R$ {Number(contribution.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Apoio Coletivo</p>
                    </div>

                    {/* Admin management actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-[#151515] p-1.5 rounded-xl border border-[#252525]">
                        {contribution.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(contribution.id, 'approved')}
                              className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all"
                              title="Aprovar/Confirmar Recebimento"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(contribution.id, 'rejected')}
                              className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                              title="Rejeitar Doação"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {contribution.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(contribution.id, 'pending')}
                            className="p-2 bg-[#2d2d2d] text-yellow-500 hover:bg-[#3d3d3d] rounded-lg transition-all text-[9px] font-black uppercase tracking-widest px-2.5 shrink-0"
                            title="Voltar para Pendente"
                          >
                            Pendente
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContribution(contribution.id)}
                          className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                          title="Excluir Registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
