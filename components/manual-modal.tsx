'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  User, 
  Users,
  Calendar, 
  ShoppingBag, 
  ShieldCheck, 
  CreditCard, 
  Trophy,
  Award,
  Play,
  Pause,
  MapPin,
  Clock,
  ArrowRight,
  Info,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'Portal Muzenza Garanhuns',
    description: 'Este é o seu portal de capoeira unificado. Criamos este manual interativo passo a passo para detalhar cada seção real do sistema que você acessará no menu lateral.',
    icon: Trophy,
    highlight: 'Manual Oficial do Sistema',
    color: '#D32F2F',
  },
  {
    title: 'Painel Geral (Dashboard)',
    description: 'Acompanhe dados valiosos como total de membros ativos, mensalidades quitadas e o caixa da tesouraria em tempo real com gráficos e a ata de finalidade institucional do grupo.',
    icon: LayoutDashboard,
    highlight: 'Indicadores e Visão Estratégica',
    color: '#D32F2F',
  },
  {
    title: 'Seu Perfil de Capoeira',
    description: 'Consulte seus dados de membro, acompanhe sua graduação oficial atualizada e edite suas informações pessoais como WhatsApp e imagem de identificação civil.',
    icon: User,
    highlight: 'Cadastro & Foto de Identificação',
    color: '#D32F2F',
  },
  {
    title: 'Gestão de Membros (Alunos)',
    description: 'Exclusivo para administradores e diretores. Permite visualizar a lista de todos os alunos, conceder privilégios, aprovar pagamentos e registrar progresso técnico.',
    icon: Users,
    highlight: 'Controle de Matriculados',
    color: '#D32F2F',
  },
  {
    title: 'Calendário de Eventos',
    description: 'Fique por dentro das rodas de rua oficiais, treinos regionais, exames de corda e batizados programados, visualizando datas, horários e mapas com coordenadas.',
    icon: Calendar,
    highlight: 'Presenças & Encontros Oficiais',
    color: '#D32F2F',
  },
  {
    title: 'Catálogo de Produtos (Loja)',
    description: 'Consulte o estoque em tempo real e a tabela oficial de camisas do Muzenza, calças de treino, shorts e instrumentos musicais como berimbaus e pandeiros de forma transparente.',
    icon: ShoppingBag,
    highlight: 'Uniformes & Artigos Musicais',
    color: '#D32F2F',
  },
  {
    title: 'Regras e Estatuto Interno',
    description: 'Conheça o conjunto de normas da comissão técnica sobre os deveres dos alunos, critérios de conduta ética em apresentações, isenções de professores e fardamento de treino.',
    icon: ShieldCheck,
    highlight: 'Normas Oficiais Estipuladas',
    color: '#D32F2F',
  },
  {
    title: 'Mensalidades e Chave Pix',
    description: 'Controle se sua situação está "Paga" ou "Pendente". Utilize a chave Pix rápida do titular da regional para quitação ágil vencendo até todo o dia 10 de cada mês.',
    icon: CreditCard,
    highlight: 'Pagamentos Administrativos',
    color: '#D32F2F',
  },
  {
    title: 'Arquivamento de Certificados',
    description: 'Exclusivo para lançamento técnico. Registre graduações escolares, diplomas corporativos e formações externas para homologação pela banca de mestres oficial.',
    icon: Award,
    highlight: 'Formação & Chancelas Oficiais',
    color: '#D32F2F',
  },
  {
    title: 'Tesouraria & Apoios Coletivos',
    description: 'Contribua voluntariamente além de suas mensalidades básicas para benfeitorias na sede física, reformas de infraestrutura ou apoio ao transporte de atletas em exames.',
    icon: Trophy,
    highlight: 'Doações de Fomento Desportivo',
    color: '#D32F2F',
  }
];

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const { appConfig } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Reset slide controls on open without triggering synchronous effect-cascading render warning
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCurrentSlide(0);
        setProgress(0);
        setIsPlaying(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Timer for automatic slide transition (1 minute = 60000ms. Updates every 100ms)
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const intervalTime = 100;
    const totalTime = 60000;
    const step = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((prevSlide) => {
            if (prevSlide === SLIDES.length - 1) {
              clearInterval(timer);
              onClose();
              return prevSlide;
            }
            return prevSlide + 1;
          });
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentSlide, onClose]);

  if (!isOpen) return null;

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProgress(0);
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProgress(0);
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleScreenClick = () => {
    handleNext();
  };

  const activeSlide = SLIDES[currentSlide];
  const appCity = appConfig?.cityName || 'Garanhuns';

  // Dynamic CSS-styled Screen Render simulating actual system pages with precise dark/red fardamento look
  const renderMockScreen = (index: number) => {
    switch (index) {
      case 0: // Welcome to Muzenza Portal
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-[#333333] text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/15 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center font-black text-[12px] tracking-widest text-[#D32F2F] uppercase flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-ping" />
              MUZENZA GARANHUNS
            </div>
            <div className="flex flex-col items-center gap-3 my-auto py-2 text-center">
              <div className="relative w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-[#D32F2F] flex items-center justify-center shadow-[0_0_20px_rgba(211,47,47,0.4)] overflow-hidden">
                <img src={appConfig?.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-[14px] font-black italic uppercase tracking-tighter text-white">Muzenza Portal ❶</p>
              <div className="px-3 py-1 rounded bg-[#D32F2F]/15 border border-[#D32F2F]/30 text-[9px] font-black text-[#D32F2F] uppercase">
                {appCity} - {appConfig?.countryName || 'PE'}
              </div>
            </div>
            <div className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider text-center">
              Sistema Operacional de Capoeira
            </div>
          </div>
        );
      case 1: // Dashboard Page replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            {/* Minimal Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
              <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                ❶ Visão Geral 
              </span>
              <span className="text-[8px] font-black text-[#D32F2F]">● ADMIN</span>
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1A1A1A] p-2 rounded border-l-2 border-[#D32F2F] overflow-hidden">
                <p className="text-[7px] text-gray-400 font-bold uppercase">Membros</p>
                <p className="text-[12px] font-black italic text-white">42 Ativos ❷</p>
              </div>
              <div className="bg-[#1A1A1A] p-2 rounded border-l-2 border-green-500 overflow-hidden">
                <p className="text-[7px] text-gray-400 font-bold uppercase">Mensalidade</p>
                <p className="text-[12px] font-black italic text-[#22C55E]">35 Em Dia</p>
              </div>
            </div>
            {/* Campaign info */}
            <div className="bg-[#1E1E1E] p-2 rounded border border-[#2A2A2A] relative">
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#D32F2F]/20 text-[#D32F2F] border border-[#D32F2F]/35 font-black text-[8px] flex items-center justify-center">❸</span>
              <p className="text-[8px] font-black text-white uppercase leading-none">❸ Nossa Finalidade</p>
              <div className="space-y-1 mt-1.5">
                <div className="h-1 bg-white/10 rounded w-full" />
                <div className="h-1 bg-white/10 rounded w-4/5" />
              </div>
            </div>
          </div>
        );
      case 2: // Perfil Page replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-[#333333]">
            <div className="flex items-center gap-2.5 border-b border-[#222] pb-2">
              <div className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-[#D32F2F] flex items-center justify-center text-[10px] font-black text-[#D32F2F]">
                Avatar
              </div>
              <div>
                <p className="font-extrabold italic uppercase text-[11px] text-white flex items-center gap-1 leading-none">
                  ❶ Guerreiro Muzenza
                </p>
                <p className="text-[8px] text-[#D32F2F] font-black uppercase tracking-widest mt-0.5">
                  ❷ Instrutor de Capoeira
                </p>
              </div>
            </div>
            {/* Contact Input box */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] relative">
              <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#D32F2F]/20 text-[#D32F2F] font-black text-[8px] flex items-center justify-center border border-[#D32F2F]/30">❸</span>
              <p className="text-[7px] text-gray-400 font-bold uppercase tracking-wider">❸ CONTATO WHATSAPP</p>
              <div className="text-[9px] font-mono text-gray-300 font-semibold mt-1">
                (87) 99843-2144
              </div>
            </div>
          </div>
        );
      case 3: // Members Page (Alunos list) replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden text-left border border-[#333333]">
            <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
              <span className="text-[9px] font-black text-white uppercase tracking-wider">❶ Painel de Alunos</span>
              <span className="text-[8px] font-bold uppercase text-gray-500">❷ total: 42</span>
            </div>
            {/* Search list replica */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#D32F2F] text-white font-bold text-[8px] flex items-center justify-center">G</div>
                <div className="text-[9px] text-white font-extrabold pb-0.5">ALUNO GUERREIRO</div>
              </div>
              <span className="text-[7.5px] font-black text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 rounded">❷ PAGO</span>
            </div>
            {/* Controls */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] flex justify-between items-center text-[7.5px] text-gray-400">
              <span className="font-extrabold uppercase text-white">❸ EDITAR INFORMAÇÃO</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F]/20 text-[#D32F2F] font-black text-[7.5px] flex items-center justify-center border border-[#D32F2F]/30">❸</span>
            </div>
          </div>
        );
      case 4: // Events Page replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            <div className="text-[9px] font-black uppercase text-white tracking-wider flex justify-between items-center border-b border-[#222] pb-1.5">
              <span>❶ Calendário Muzenza</span>
              <span className="text-[8px] text-[#D32F2F]">❶</span>
            </div>
            {/* Event Item card */}
            <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#2a2a2a] relative flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-white">❷ RODA DA PRAÇA NO SESC</p>
                <p className="text-[7.5px] text-[#D32F2F] font-bold uppercase mt-0.5"> Garanhuns - 20:00</p>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center shadow shrink-0">❷</span>
            </div>
            {/* Map point info */}
            <div className="bg-[#1C1C1C] p-2 rounded border-l-2 border-[#D32F2F] relative text-[7.5px] text-gray-400 uppercase">
              <span className="font-bold text-white block mb-0.5">❸ Coordenadas / Mapa</span>
              Saguão de Entrada do Ginásio Sesc PE
            </div>
          </div>
        );
      case 5: // Store Catalog page mockup
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
              <span className="text-[9px] font-black text-white uppercase tracking-widest">❶ Catálogo Oficial</span>
              <span className="text-[8px] text-[#D32F2F] font-black">STOCK</span>
            </div>
            {/* Product card */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] relative flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#252525] flex items-center justify-center text-[11px] shrink-0">
                👕
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8.5px] font-black text-white uppercase truncate">Abadá Oficial M</p>
                <p className="text-[8px] font-black text-[#D32F2F] leading-none mt-0.5">❷ R$ 60,00</p>
                <span className="inline-block text-[7px] font-bold text-gray-400 uppercase tracking-tight mt-1">
                  ❸ Em Estoque: 8 unids
                </span>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center shrink-0">❶</span>
            </div>
          </div>
        );
      case 6: // Rules page replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden text-left border border-[#333333]">
            <div className="text-[9px] font-black uppercase text-white tracking-wider flex justify-between items-center border-b border-[#222] pb-1.5">
              <span>❶ Diretrizes de Conduta</span>
              <span className="text-[8px] text-[#D32F2F] font-bold">ESTATUTO</span>
            </div>
            {/* Rule 1 */}
            <div className="bg-[#1A1A1A] p-2 rounded flex items-center justify-between text-[7.5px] border border-[#2a2a2a]">
              <span className="text-white font-extrabold uppercase">❶ Vencimento no Dia 10</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❶</span>
            </div>
            {/* Rule 2 */}
            <div className="bg-[#1A1A1A] p-2 rounded flex items-center justify-between text-[7.5px] border border-[#2a2a2a]">
              <span className="text-gray-400 font-extrabold uppercase">❷ Uniforme Completo Obrigatório</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❷</span>
            </div>
          </div>
        );
      case 7: // Payments (Mensalidades) replica
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            <div className="flex justify-between items-center border-b border-[#222] pb-1.5 text-[9px] font-black uppercase text-white">
              <span>Situação Mensal</span>
              <span className="text-[#22C55E]">❶</span>
            </div>
            {/* Badge Indicator */}
            <div className="bg-green-500/10 p-2 rounded border border-green-500/20 flex justify-between items-center">
              <span className="text-[8.5px] text-green-400 font-black uppercase tracking-widest">❶ Sem Pendências</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❶</span>
            </div>
            {/* Pix Copy and paste */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] relative">
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❷</span>
              <p className="text-[7.5px] text-gray-400 font-bold uppercase leading-none pb-1">❷ Chave Pix Rápida</p>
              <div className="bg-black/35 px-1.5 py-1.5 rounded text-[7.5px] text-gray-300 font-mono flex items-center justify-between mt-1 border border-[#222]">
                <span className="truncate max-w-[100px]">chave_diretoria@garanhuns.com</span>
                <span>📋</span>
              </div>
            </div>
          </div>
        );
      case 8: // Archiving certificates mockup
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            <div className="flex justify-between items-center border-b border-[#222] pb-1.5 text-[9px] font-black uppercase text-white">
              <span>Arquivar Diplomas</span>
              <span className="text-[#D32F2F]">❶</span>
            </div>
            {/* Upload form screen replica */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] flex flex-col gap-1.5 relative">
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❶</span>
              <span className="text-[7px] text-gray-500 font-bold uppercase">Título Formação</span>
              <div className="h-4.5 bg-black/40 border border-[#222] rounded flex items-center px-1 text-[8px] text-white font-bold leading-none uppercase">
                Professor de Capoeira Muzenza ❷
              </div>
              <div className="h-4.5 bg-[#D32F2F] rounded text-white text-[7px] font-black uppercase flex items-center justify-center">
                SALVAR CERTIFICADO ❸
              </div>
            </div>
          </div>
        );
      case 9: // Treasury collective campaigns
        return (
          <div className="w-full h-full bg-[#121212] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-[#333333]">
            <div className="text-[9px] font-black uppercase text-white tracking-wider flex justify-between items-center border-b border-[#222] pb-1.5">
              <span>Fomento Voluntário</span>
              <span className="text-[8px] text-[#D32F2F]">❶</span>
            </div>
            {/* Pix collective campaign target card */}
            <div className="bg-[#1A1A1A] p-2 rounded border border-[#2a2a2a] relative">
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❶</span>
              <p className="text-[8.5px] font-black text-white uppercase leading-none">❶ Doação de Instrumentos</p>
              <div className="flex justify-between text-[7px] font-bold text-gray-400 mt-1">
                <span>R$ 150 Restantes</span>
                <span>85% Caixa</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-[#D32F2F] w-[85%]" />
              </div>
            </div>
            {/* Contribution receipt line item list */}
            <div className="bg-[#1A1A1A] p-1 rounded flex items-center justify-between text-[7.5px] border border-[#2a2a2a] relative">
              <span className="text-gray-300 font-extrabold uppercase">❷ Extrato: Aluno Guerreiro - R$ 50,00</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#D32F2F] text-white font-black text-[8px] flex items-center justify-center">❷</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Legends map for indicators
  const getSlideLegends = (index: number) => {
    switch (index) {
      case 0:
        return [
          { label: '❶', title: 'Acesso Portal Muzenza', text: 'Centraliza todas as rotinas administrativas, uniformes, exames de cordas, estatutos e recursos em um único portal.' }
        ];
      case 1:
        return [
          { label: '❶', title: 'Visão Operacional', text: 'Início rápido exibindo as metas semanais gerais e recados rápidos da diretoria.' },
          { label: '❷', title: 'Membros Ativos', text: 'Quantidade absoluta de atletas cadastrados na respectiva regional administrativa.' },
          { label: '❸', title: 'Estatuto de Propósito', text: 'Nossa declaração de finalidade para a preservação e difusão da capoeira na região.' }
        ];
      case 2:
        return [
          { label: '❶', title: 'Dados Cadastrais', text: 'Seu nome civil, apelido desportivo oficial e foto carregada.' },
          { label: '❷', title: 'Grau / Cordão', text: 'Graduação atualizada e validada no sistema para controle regional e nacional.' },
          { label: '❸', title: 'Contato Rápido', text: 'Chaves de comunicação direta para agilizar os informativos da assessoria.' }
        ];
      case 3:
        return [
          { label: '❶', title: 'Painel para Diretoria', text: 'Visualização abrangente dos atletas, filtros de mensalidade e cordões.' },
          { label: '❷', title: 'Controle de Inadimplência', text: 'Acompanhamento rápido de alunos com pendências financeiras e quitação rápida.' },
          { label: '❸', title: 'Atualização Cadastral', text: 'Permite alterar a corda e privileges dos membros sem complicação.' }
        ];
      case 4:
        return [
          { label: '❶', title: 'Aba de Encontros', text: 'Cronograma oficial de treinos, aulões, batizados e rodas regionais.' },
          { label: '❷', title: 'Datas e Horários', text: 'Informações precisas para planejamento dos alunos do grupo.' },
          { label: '❸', title: 'Localidades Incorporadas', text: 'Endereço e conexões de mapas detalhadas de locais de treino desportivo.' }
        ];
      case 5:
        return [
          { label: '❶', title: 'Catálogo de Fardamento', text: 'Modelagem dos abadás, camisetas e shorts do Muzenza cadastrados.' },
          { label: '❷', title: 'Preço Tabelado', text: 'Valores institucionais e regulados sem margem comercial para os integrantes.' },
          { label: '❸', title: 'Grade de Tamanhos', text: 'Acompanhe a disponibilidade de peças com estoque integrado.' }
        ];
      case 6:
        return [
          { label: '❶', title: 'Instâncias do Comitê', text: 'Diretrizes nacionais e locais para o fardamento e ensinos técnicos.' },
          { label: '❷', title: 'Fardamento Técnico', text: 'Normas sobre a obrigatoriedade de uso do uniforme e respeito mútuo.' },
          { label: '❸', title: 'Estatutos do Grupo', text: 'Políticas coletivas do grupo para a preservação do respeito e da hierarquia.' }
        ];
      case 7:
        return [
          { label: '❶', title: 'Dívidas e Adimplência', text: 'Consulte se sua mensalidade atual está aprovada ou necessitando de atenção.' },
          { label: '❷', title: 'Instrucão Pix', text: 'Chave Pix da tesouraria local com cópia rápida para transferências.' },
          { label: '❸', title: 'Liberação Física', text: 'A aprovação imediata do pagamento libera sua carteira no sistema para demais eventos.' }
        ];
      case 8:
        return [
          { label: '❶', title: 'Histórico Técnico', text: 'Espaço exclusivo para diretores lançarem arquivos de títulos de capoeira.' },
          { label: '❷', title: 'Descrição da Chancela', text: 'Especifica qual graduação ou formação acadêmica foi submetida.' },
          { label: '❸', title: 'Banca de Mestres', text: 'Homologação oficial dos progressos e chancelas de graduação do profissional.' }
        ];
      case 9:
        return [
          { label: '❶', title: 'Fomento Voluntário', text: 'Acompanhe as metas e envie apoio financeiro voluntário direto para projetos locais.' },
          { label: '❷', title: 'Livro Caixa Livre', text: 'Demonstrativo e extrato de entradas de doadores para auditoria coletiva.' },
          { label: '❸', title: 'Destinatário Legal', text: 'Garantia de aplicação imediata de todo centavo na aquisição de fardamentos desportivos.' }
        ];
      default:
        return [];
    }
  };

  const legends = getSlideLegends(currentSlide);

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-md select-none"
      onClick={handleScreenClick}
    >
      <div 
        className="w-full max-w-4xl bg-[#121212] border-2 border-[#D32F2F] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(211,47,47,0.4)] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="w-full bg-[#1e1e1e] h-1.5 overflow-hidden">
          <div 
            className="h-full bg-brand-red transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header Controls */}
        <div className="p-5 sm:p-6 flex justify-between items-center bg-[#181818] border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-brand-red tracking-widest bg-brand-red/10 px-3 py-1.5 rounded-full">
              Slide {currentSlide + 1} de {SLIDES.length}
            </span>
            <button 
              className="p-1 px-2 hover:bg-[#252525] rounded text-gray-400 hover:text-white flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pausar reprodução' : 'Continuar reprodução'}
            >
              {isPlaying ? (
                <>
                  <Pause size={12} className="text-brand-red animate-pulse" />
                  Auto (1m)
                </>
              ) : (
                <>
                  <Play size={12} className="text-green-500" />
                  Pausado
                </>
              )}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#222222] hover:bg-brand-red rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Column Structure */}
        <div 
          className="p-5 sm:p-8 md:p-10 flex-1 hover:bg-white/[0.005] transition-colors cursor-pointer"
          onClick={handleScreenClick}
          title="Clique em qualquer lugar do slide para avançar"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-12 gap-8 items-stretch w-full"
            >
              {/* Left Column: Device Mockup simulating "prints" */}
              <div 
                className="col-span-12 md:col-span-6 bg-black/40 border border-[#333]/80 rounded-2xl p-5 relative shadow-inner min-h-[260px] md:min-h-[300px] flex flex-col justify-between transition-all hover:bg-black/55 group"
                onClick={(e) => e.stopPropagation()} // Let clicks inside the mockup element stay localized if needed
              >
                <div className="absolute top-2 left-3 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[7px] text-red-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                  Simulador de Tela (Print)
                </div>
                
                {/* Simulated Screen */}
                <div className="my-auto py-2">
                  {renderMockScreen(currentSlide)}
                </div>

                <div className="text-[7.5px] text-gray-600 font-bold uppercase tracking-wider text-center mt-2">
                  Toque nos indicadores ❶ ❷ ❸ para ver a legenda do lado direito
                </div>
              </div>

              {/* Right Column: Slide Text, Headline, and annotated Legends */}
              <div className="col-span-12 md:col-span-6 space-y-4 flex flex-col justify-center text-left">
                <div className="space-y-2">
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">
                    {activeSlide.highlight}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-extrabold italic tracking-tight uppercase leading-none">
                    {activeSlide.title}
                  </h2>
                </div>

                <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-semibold">
                  {activeSlide.description
                    .replace('Muzenza Garanhuns', `Muzenza ${appCity}`)
                    .replace('Mestre Bolacha', 'seu Diretor')}
                </p>

                {/* Legends with Indicators List */}
                <div className="space-y-2.5 pt-2">
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
                    Legenda dos Indicadores:
                  </p>
                  <div className="space-y-2">
                    {legends.map((lg) => (
                      <div 
                        key={lg.label}
                        className="flex gap-3 bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-[#333]/40 transition-colors"
                      >
                        <span 
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-md"
                          style={{ backgroundColor: `${activeSlide.color}20`, border: `1px solid ${activeSlide.color}`, color: activeSlide.color }}
                        >
                          {lg.label}
                        </span>
                        <div>
                          <p className="font-extrabold italic text-[11px] text-white uppercase tracking-tight leading-none mb-1">
                            {lg.title}
                          </p>
                          <p className="text-gray-400 text-[10px] font-semibold leading-snug">
                            {lg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider animate-pulse pt-2">
                  💡 Dica: Clique na barra preta superior ou no rodapé para avançar os slides
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 sm:p-6 bg-[#181818] border-t border-[#333333] flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer ${
              currentSlide === 0 
                ? 'text-gray-600 border border-transparent cursor-not-allowed opacity-50' 
                : 'text-white bg-[#252525] border border-[#333] hover:bg-[#333333]'
            }`}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <div className="flex gap-1.5 hidden sm:flex">
            {SLIDES.map((_, i) => (
              <span 
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); setProgress(0); }}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                  currentSlide === i ? 'bg-brand-red w-6' : 'bg-gray-700 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-white text-black hover:bg-[#D32F2F] hover:text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-xl transition-all shadow-xl cursor-pointer"
          >
            {currentSlide === SLIDES.length - 1 ? 'Concluir' : 'Próximo'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
