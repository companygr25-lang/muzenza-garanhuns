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
  AlertCircle,
  FileText,
  Download,
  Printer,
  Search,
  Users,
  XCircle,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { generatePixPayload } from '@/lib/pix-utils';

export default function PaymentsPage() {
  const { user, isAdmin, appConfig, loading: authLoading, refreshUserData } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pixData, setPixData] = useState({ key: '', name: '', bank: '' });

  // PDF Generation State and Handler (Direct download bypassing print block)
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const cityName = appConfig?.cityName || 'Regional';
      
      // Page setup
      const pageHeight = 297;
      const pageWidth = 210;
      const margin = 15;
      let currentY = 20;

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(30, 30, 30); // Dark gray to avoid absolute black harshness
      pdf.text('RELATÓRIO DE MENSALIDADES', margin, currentY);
      currentY += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(110, 110, 110);
      pdf.text(`Painel de Monitoramento Regional - ${cityName}`, margin, currentY);
      currentY += 5;

      // Line
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Stats Section Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('RESUMO DO MÊS', margin, currentY);
      currentY += 6;

      // Rect bg for stats
      pdf.setFillColor(248, 250, 252); // Soft light blue-slate background
      pdf.setDrawColor(226, 232, 240); // border gray
      pdf.rect(margin, currentY, pageWidth - (margin * 2), 22, 'FD');
      
      // Card labels
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('TOTAL DE ALUNOS', margin + 5, currentY + 7);
      pdf.text('EM DIA', margin + 45, currentY + 7);
      pdf.text('PENDENTES', margin + 80, currentY + 7);
      pdf.text('ARRECADADO', margin + 115, currentY + 7);
      pdf.text('ADIMPLÊNCIA', margin + 155, currentY + 7);

      // Card values
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      
      // Total
      pdf.setTextColor(15, 23, 42); // slate 900
      pdf.text(`${reportStats.total}`, margin + 5, currentY + 15);
      
      // Paid in dia
      pdf.setTextColor(22, 101, 52); // emerald 800
      pdf.text(`${reportStats.paid}`, margin + 45, currentY + 15);
      
      // Pending atrasados
      pdf.setTextColor(185, 28, 28); // red 700
      pdf.text(`${reportStats.pending}`, margin + 80, currentY + 15);
      
      // Revenue
      pdf.setTextColor(15, 23, 42);
      pdf.text(`R$ ${reportStats.revenue.toFixed(2)}`, margin + 115, currentY + 15);
      
      // Compliance rate
      pdf.setTextColor(3, 105, 161); // sky 700
      pdf.text(`${reportStats.complianceRate}%`, margin + 155, currentY + 15);

      currentY += 32;

      // Student list title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('LISTAGEM DE ALUNOS', margin, currentY);
      currentY += 6;

      // Table Header Row bg
      pdf.setFillColor(241, 245, 249); // slate 100
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, currentY, pageWidth - (margin * 2), 9, 'FD');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85); // slate 700
      pdf.text('ALUNO', margin + 4, currentY + 6);
      pdf.text('GRADUAÇÃO', margin + 65, currentY + 6);
      pdf.text('TELEFONE', margin + 120, currentY + 6);
      pdf.text('STATUS', margin + 155, currentY + 6);
      
      currentY += 9;

      // Table Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      filteredStudents.forEach((student, index) => {
        // Page breaking logic
        if (currentY > pageHeight - 25) {
          pdf.addPage();
          currentY = 20;

          // Repeat Table Header on the new page
          pdf.setFillColor(241, 245, 249);
          pdf.setDrawColor(226, 232, 240);
          pdf.rect(margin, currentY, pageWidth - (margin * 2), 9, 'FD');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          pdf.text('ALUNO', margin + 4, currentY + 6);
          pdf.text('GRADUAÇÃO', margin + 65, currentY + 6);
          pdf.text('TELEFONE', margin + 120, currentY + 6);
          pdf.text('STATUS', margin + 155, currentY + 6);
          currentY += 9;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
        }

        // Row bg line border bottom & soft zebra highlight
        if (index % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, currentY, pageWidth - (margin * 2), 9, 'F');
        }
        
        pdf.setDrawColor(241, 245, 249); // light border separated
        pdf.line(margin, currentY + 9, pageWidth - margin, currentY + 9);

        // Name
        pdf.setTextColor(15, 23, 42); // bold text slate 900
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(student.username || 'Aluno Sem Nome'), margin + 4, currentY + 6);
        
        // Graduation and Phone
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105); // slate 600
        pdf.text(String(student.graduation || 'Cordão não cadastrado'), margin + 65, currentY + 6);
        pdf.text(String(student.phone || '(87) 9****-****'), margin + 120, currentY + 6);
        
        // Status indicator with nice font styling
        if (student.monthly_paid) {
          pdf.setTextColor(22, 101, 52); // Green 800
          pdf.setFont('helvetica', 'bold');
          pdf.text('Sem Pendências', margin + 155, currentY + 6);
        } else {
          pdf.setTextColor(185, 28, 28); // Red 700
          pdf.setFont('helvetica', 'bold');
          pdf.text('Pendente', margin + 155, currentY + 6);
        }

        currentY += 9;
      });

      pdf.save(`Relatorio_Mensalidades_${cityName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Houve um erro ao renderizar e baixar o PDF. Por favor, tente novamente.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Report States
  const [students, setStudents] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'pending'>('all');
  const [paymentMonths, setPaymentMonths] = useState(1);

  const pixPayload = React.useMemo(() => {
    if (!pixData.key || !pixData.name) return '';
    return generatePixPayload(pixData.key, pixData.name, 'GARANHUNS', paymentMonths * 50);
  }, [pixData.key, pixData.name, paymentMonths]);

  const fetchPix = async () => {
    if (!user) return;
    try {
      let fetchedKey = '';
      let fetchedName = '';
      let fetchedBank = '';

      let directorId = '';
      if (user.role === 'director') {
        directorId = user.id;
      } else if (user.director_id) {
        directorId = user.director_id;
      }

      if (directorId) {
        // Try fetching custom director config
        const { data: dirConfig, error: dirError } = await supabase
          .from('config')
          .select('pix_key, pix_name, pix_bank')
          .eq('id', directorId)
          .single();
        
        if (!dirError && dirConfig && dirConfig.pix_key) {
          fetchedKey = dirConfig.pix_key;
          fetchedName = dirConfig.pix_name || '';
          fetchedBank = dirConfig.pix_bank || '';
        }
      }

      // Fallback user profile fields
      if (!fetchedKey && directorId) {
        const { data: directorData, error: dirError } = await supabase
          .from('users')
          .select('pix_key, pix_name, pix_bank')
          .eq('id', directorId)
          .single();
        
        if (!dirError && directorData && directorData.pix_key) {
          fetchedKey = directorData.pix_key;
          fetchedName = directorData.pix_name || '';
          fetchedBank = directorData.pix_bank || '';
        }
      }

      // Fallback global settings only if the user is not regional (no director ID associated)
      if (!fetchedKey && !directorId) {
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

  const fetchStudents = async () => {
    if (!user) return;
    if (user.role !== 'director' && !isAdmin) return;
    
    setReportLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('id, username, role, phone, monthly_paid, graduation, director_id, months_paid_remaining')
        .order('username', { ascending: true });
      
      // If director, filter by their region/director_id
      if (user.role === 'director') {
        query = query.eq('director_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Erro ao carregar alunos para relatório:", error);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'director' || isAdmin)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const filteredStudents = React.useMemo(() => {
    return students.filter(student => {
      if (student.role === 'admin' || student.role === 'director') return false;
      const matchesSearch = student.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.graduation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterPaid === 'paid') return matchesSearch && student.monthly_paid;
      if (filterPaid === 'pending') return matchesSearch && !student.monthly_paid;
      return matchesSearch;
    });
  }, [students, searchQuery, filterPaid]);

  const reportStats = React.useMemo(() => {
    const relevant = students.filter(s => s.role !== 'admin' && s.role !== 'director');
    const total = relevant.length;
    const paid = relevant.filter(s => s.monthly_paid).length;
    const pending = total - paid;
    const revenue = paid * 50; 
    const complianceRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    return { total, paid, pending, revenue, complianceRate };
  }, [students]);

  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      alert('Nenhum aluno encontrado para exportar.');
      return;
    }
    const headers = ['Nome de Usuário', 'Graduação', 'Telefone', 'Situação'];
    const rows = filteredStudents.map(student => [
      student.username || 'Sem nome',
      student.graduation || 'Não cadastrada',
      student.phone || 'Sem número',
      student.monthly_paid ? 'PAGO' : 'PENDENTE'
    ]);
    const csvContent = 
      "\uFEFF" + // UTF-8 BOM
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Mensalidades_Muzenza.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!pixData.key) return;
    navigator.clipboard.writeText(pixData.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPayload = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-12">
      <div className="print:hidden space-y-12">
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

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* PIX Payment Section */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-[#1E1E1E] p-5 sm:p-8 md:p-12 rounded-3xl border border-[#333333] shadow-2xl space-y-10 border-l-8 border-brand-red"
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

              {/* Seletor de Mensalidades Acumuladas */}
              <div className="p-6 bg-[#121212] border border-[#333333] rounded-2xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">Fazer Pagamento Acumulado</p>
                <p className="text-xs text-gray-400 font-bold uppercase leading-tight">Escolha quantas mensalidades quer pagar ao mesmo tempo:</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMonths(m)}
                      className={cn(
                        "py-3 rounded-xl text-center font-black transition-all border text-xs cursor-pointer",
                        paymentMonths === m
                          ? "bg-brand-red border-brand-red text-white shadow-lg"
                          : "bg-black/40 border-[#333333] hover:border-gray-500 text-gray-400"
                      )}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-[#333333]/60 text-[10px]">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Quantidade acumulada:</span>
                  <span className="text-white font-black italic">{paymentMonths} {paymentMonths === 1 ? 'Mês' : 'Meses'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Valor total:</span>
                  <span className="text-brand-red font-black text-sm italic bg-brand-red/10 px-3 py-1 rounded-lg border border-brand-red/20">R$ {(paymentMonths * 50).toFixed(2)}</span>
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
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest text-center">
                      Ou utilize o Pix Copia e Cola:
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPayload}
                      className={cn(
                        "w-full max-w-[280px] p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                        copiedPayload
                          ? "bg-green-500/15 border-green-500/50 text-green-400"
                          : "bg-black/40 border-[#333333] hover:bg-[#252525] text-gray-300 hover:text-white"
                      )}
                    >
                      {copiedPayload ? (
                        <>
                          <CheckCircle2 size={16} />
                          Copiado com Sucesso!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar Código Copia e Cola
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest max-w-[250px] text-center">
                      Escaneie com o app do seu banco para confirmar as {paymentMonths} {paymentMonths === 1 ? 'mensalidade' : 'mensalidades'} no valor de <strong>R$ {(paymentMonths * 50).toFixed(2)}</strong> para <strong>{pixData.name}</strong> ({pixData.bank}).
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
                                  // Use the config table under director's own ID to bypass users table schema limits
                                  const { error } = await supabase
                                    .from('config')
                                    .upsert({
                                      id: user.id,
                                      pix_key: pixData.key,
                                      pix_name: pixData.name,
                                      pix_bank: pixData.bank
                                    }, { onConflict: 'id' });
                                  
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
            <div className="bg-[#1E1E1E] p-5 sm:p-8 md:p-10 rounded-3xl border border-[#333333] shadow-2xl relative overflow-hidden group">
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

            <div className="bg-[#1E1E1E] p-5 sm:p-8 md:p-10 rounded-3xl border border-[#333333] shadow-2xl">
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

        {/* Relatório de Mensalidades para a Diretoria / Admin */}
        {(user?.role === 'director' || isAdmin) && (
          <motion.div 
            id="payment-report"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-5 sm:p-8 md:p-12 rounded-3xl mt-12 bg-[#1E1E1E] text-white border border-[#333333] space-y-8 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#333333]">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-red/10 rounded-2xl text-brand-red print:hidden">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Relatório de Mensalidades</h2>
                  <p className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Painel de Monitoramento Regional - {appConfig?.cityName || 'Região Sede'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 print:hidden items-end" data-html2canvas-ignore="true">
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={exportToCSV}
                    type="button"
                    className="flex items-center gap-2 px-6 py-3.5 bg-black/40 border border-[#333333] hover:border-brand-red text-white hover:text-brand-red font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    <Download size={14} /> Exportar Excel
                  </button>
                  <button 
                    onClick={handleGeneratePDF}
                    disabled={pdfGenerating}
                    type="button"
                    title="Baixar este relatório em formato PDF"
                    className={cn(
                      "flex items-center gap-2 px-6 py-3.5 bg-white text-black hover:bg-brand-red hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all",
                      pdfGenerating ? "opacity-50 cursor-wait" : "cursor-pointer"
                    )}
                  >
                    {pdfGenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <FileText size={14} /> Baixar PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl space-y-1 shadow-lg border bg-[#262626] border-[#555555] text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">Total de Alunos</p>
                <p className="text-3xl font-black italic tracking-tight drop-shadow-sm text-white">{reportStats.total}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-300">registrados</p>
              </div>

              <div className="p-5 rounded-2xl space-y-1 shadow-lg border bg-[#262626] border-[#555555] text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">Pagos</p>
                <p className="text-3xl font-black italic tracking-tight drop-shadow-sm text-[#00FF66]">{reportStats.paid}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#00FF66]">em dia</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl space-y-1 shadow-lg border bg-[#262626] border-[#555555] text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">Pendentes</p>
                <p className="text-3xl font-black italic tracking-tight drop-shadow-sm text-[#FF4D4D]">{reportStats.pending}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF4D4D]">atrasados</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl space-y-1 shadow-lg border bg-[#262626] border-[#555555] text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">Arrecadado</p>
                <p className="text-3xl font-black italic tracking-tight drop-shadow-sm text-[#FF5252]">R$ {reportStats.revenue.toFixed(2)}</p>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#FF5252]">este mês</p>
              </div>

              <div className="p-5 rounded-2xl space-y-1 col-span-2 lg:col-span-1 shadow-lg border bg-[#262626] border-[#555555] text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">Adimplência</p>
                <p className="text-3xl font-black italic tracking-tight drop-shadow-sm text-[#00CCFF]">{reportStats.complianceRate}%</p>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden bg-[#111111]">
                  <div className="h-full rounded-full transition-all bg-[#00CCFF]" style={{ width: `${reportStats.complianceRate}%` }} />
                </div>
              </div>
            </div>


            {/* Filter and Search controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-5 rounded-2xl border border-[#333333] print:hidden" data-html2canvas-ignore="true">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Pesquisar aluno, graduação ou celular..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] focus:border-brand-red rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none text-xs font-semibold"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                {(['all', 'paid', 'pending'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterPaid(mode)}
                    className={cn(
                      "px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      filterPaid === mode
                        ? "bg-brand-red border-brand-red text-white shadow-xl"
                        : "bg-[#121212] border-[#333333] hover:border-gray-500 text-gray-400 hover:text-white"
                    )}
                  >
                    {mode === 'all' && 'Todos'}
                    {mode === 'paid' && 'Pagos'}
                    {mode === 'pending' && 'Pendentes'}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table with Responsive Fallback */}
            <div className="rounded-2xl border overflow-hidden bg-[#1E1E1E] border-[#333333] text-white">
              {reportLoading ? (
                <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                  Carregando lista de alunos da regional...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                  Nenhum aluno encontrado para os filtros selecionados.
                </div>
              ) : (
                <>
                  {/* Mobile Stacked Cards Layout */}
                  <div className="block md:hidden divide-y divide-[#333333]/40">
                    {filteredStudents.map((st, idx) => (
                      <div key={st.id || idx} className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black text-white text-base uppercase tracking-tight leading-tight">{st.username || 'Aluno Sem Nome'}</h4>
                            <p className="text-[10px] text-[#888888] font-bold uppercase mt-1">ID CADASTRO: {idx + 1}</p>
                          </div>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0",
                            st.monthly_paid
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          )}>
                            {st.monthly_paid ? ((st.months_paid_remaining && st.months_paid_remaining > 1) ? `Em dia (${st.months_paid_remaining}m)` : 'Sem Pendências') : 'Pendente'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-[#121212] p-3 rounded-xl border border-[#333333]/80">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1">Graduação</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-wider block truncate">
                              {st.graduation || 'SEM CORDÃO'}
                            </span>
                          </div>
                          
                          <div className="bg-[#121212] p-3 rounded-xl border border-[#333333]/80">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1">Contato</span>
                            <span className="text-[10px] font-mono font-semibold text-gray-400 block truncate">
                              {st.phone || '(87) 9****-****'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#333333]/80 bg-[#1A1A1A]/50 text-gray-500">
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Aluno</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Graduação</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Telefone / Contato</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-center text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#333333]/40">
                        {filteredStudents.map((st, idx) => (
                          <tr key={st.id || idx} className="transition-colors hover:bg-white/[0.02]">
                            <td className="p-5 font-bold text-sm tracking-tight text-white">{st.username || 'Aluno Sem Nome'}</td>
                            <td className="p-5 text-xs font-black uppercase tracking-wide">
                              <span className="px-4 py-1.5 rounded-full font-extrabold text-xs border bg-[#2B2B2B] border-[#444444] text-white shadow-lg">
                                {st.graduation || 'Cordão não cadastrado'}
                              </span>
                            </td>
                            <td className="p-5 text-xs font-mono font-semibold text-gray-400">{st.phone || '(87) 9****-****'}</td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                st.monthly_paid
                                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                                  : "bg-red-500/10 border border-red-500/30 text-red-400"
                              )}>
                                {st.monthly_paid ? ((st.months_paid_remaining && st.months_paid_remaining > 1) ? `Em dia (${st.months_paid_remaining}m)` : 'Sem Pendências') : 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
  );
}

