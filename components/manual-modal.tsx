'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  User, 
  Calendar, 
  ShoppingBag, 
  ShieldCheck, 
  CreditCard, 
  Trophy,
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
    title: 'Bem-vindo ao Portal Muzenza!',
    description: 'Este é o seu portal de capoeira unificado. Fizemos este guia rápido por todas as abas da aplicação para que você conheça cada tela duma forma simples.',
    icon: Trophy,
    highlight: 'Comece sua jornada com o pé direito',
    image: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
    color: '#D32F2F',
  },
  {
    title: 'Visão Geral (Dashboard)',
    description: 'Aqui na página inicial, você acompanha todos os avisos oficiais, vê o evento em destaque agendado pelo seu Diretor e as últimas novidades importantes.',
    icon: LayoutDashboard,
    highlight: 'Destaques e notícias urgentes do grupo',
    color: '#34d399',
  },
  {
    title: 'Seu Perfil Customizado',
    description: 'Edite suas fotos de perfil, ajuste seu telefone e atualize sua graduação oficial (de Sem Corda até Mestre). Mantenha suas fotos sempre atualizadas!',
    icon: User,
    highlight: 'Sua identidade dentro da Muzenza',
    color: '#60a5fa',
  },
  {
    title: 'Agenda de Eventos e Treinos',
    description: 'Confira as rodas programadas, batizados e treinos programados pelo grupo. Veja data, local, horário e tipo do evento de forma rápida.',
    icon: Calendar,
    highlight: 'Nunca perca uma roda ou batizado',
    color: '#a78bfa',
  },
  {
    title: 'Loja de Uniformes & Produtos',
    description: 'Navegue pelos produtos oficiais como abadás, camisetas e shorts do Muzenza. Veja tamanhos, preços e estoque físico antes de retirar com os instrutores.',
    icon: ShoppingBag,
    highlight: 'Vista a camisa da nossa capoeira',
    color: '#fbbf24',
  },
  {
    title: 'Regras e Diretrizes do Grupo',
    description: 'Consulte as regras fundamentais do grupo Muzenza sobre pagamento de mensalidade, participação e retirada de abadás na loja de forma prática.',
    icon: ShieldCheck,
    highlight: 'Segurança, ética e transparência',
    color: '#f87171',
  },
  {
    title: 'Aba de Mensalidades',
    description: 'Aqui você acompanha se sua mensalidade está pendente ou paga. Acesse a chave PIX de forma ágil para efetuar sua contribuição mensal obrigatória.',
    icon: CreditCard,
    highlight: 'Transparência no controle financeiro',
    color: '#f472b6',
  },
  {
    title: 'Tesouraria Coletiva',
    description: 'Nossa nova aba de Tesouraria permite fazer doações voluntárias diretas adicionais via PIX. Essas doações ajudam na infraestrutura da sede física e no transporte de eventos.',
    icon: Trophy,
    highlight: 'Apoie o crescimento e as viagens do grupo',
    color: '#38bdf8',
  }
];

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const { appConfig } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Reset slide controls on open
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSlide(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(true);
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

  // Dynamic CSS-styled Screen Render simulating "prints" with indicators
  const renderMockScreen = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-full h-full bg-[#151515] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-[#2d2d2d] text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center font-black text-[12px] tracking-widest text-[#D32F2F] uppercase">Muzenza Portal</div>
            <div className="flex flex-col items-center gap-3 my-auto py-4 text-center">
              <div className="relative w-16 h-16 rounded-full bg-[#D32F2F]/10 border-2 border-[#D32F2F] flex items-center justify-center shadow-[0_0_15px_rgba(211,47,47,0.4)]">
                <Trophy size={28} className="text-[#D32F2F]" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D32F2F] border border-white text-white font-black text-[9px] flex items-center justify-center">❶</span>
              </div>
              <p className="text-[10px] font-black tracking-widest text-[#888888] uppercase">Grupo Muzenza</p>
              <p className="text-[12px] font-bold text-center text-white">{appCity} & Região</p>
            </div>
            <div className="h-1 bg-[#D32F2F]/20 rounded-full w-24 mx-auto overflow-hidden">
              <div className="h-full bg-[#D32F2F] w-1/2 animate-pulse" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-emerald-500/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                ❶ Muzenza {appCity}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {/* Highlight card */}
            <div className="bg-[#1c1c1c] p-3 rounded-lg border border-emerald-500/20 relative">
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black font-black text-[9px] flex items-center justify-center shadow">❷</span>
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Destaque do Dia</p>
              <p className="font-extrabold italic uppercase text-[11px] text-white">Batizado & Evento Geral</p>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-emerald-400 w-3/4" />
              </div>
            </div>
            {/* Bulletin Board */}
            <div className="bg-[#181818] p-2.5 rounded-lg border border-white/5 relative">
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black font-black text-[9px] flex items-center justify-center shadow">❸</span>
              <p className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider">Mural Recente</p>
              <div className="space-y-1.5 mt-1">
                <div className="h-1.5 w-full bg-white/5 rounded" />
                <div className="h-1.5 w-2/3 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-blue-500/10">
            <div className="flex items-center gap-3 border-b border-white/5 pb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-[10px] font-black text-blue-400">
                Avatar
              </div>
              <div className="relative">
                <p className="font-bold text-[11px] text-white flex items-center gap-1">
                  ❶ Aluno Ativo <span className="text-blue-500 font-black">❶</span>
                </p>
                <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest">
                  ❷ Cordão Azul ❷
                </p>
              </div>
            </div>
            {/* Profile form */}
            <div className="bg-[#181818] p-3 rounded-lg space-y-1.5 relative">
              <span className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 rounded-full bg-blue-500 text-white font-black text-[9px] flex items-center justify-center shadow">❸</span>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-wider">Número de Contato</p>
              <div className="h-6 bg-black/40 border border-[#333] rounded px-2 flex items-center text-[10px] text-gray-300 font-mono">
                (87) 99823-1254
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-purple-500/10">
            <div className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex justify-between items-center border-b border-white/5 pb-1">
              <span>❶ Calendário Escolar</span>
              <span className="text-[10px] text-purple-400">❶</span>
            </div>
            {/* Event Card 1 */}
            <div className="bg-[#181818] p-2.5 rounded-lg border border-purple-500/25 relative flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-purple-400">❷ Roda Oficial Mensal</p>
                <p className="text-[8px] text-gray-400">Sábado às 19:30</p>
              </div>
              <span className="w-4.5 h-4.5 rounded-full bg-purple-500 text-black font-black text-[9px] flex items-center justify-center">❷</span>
            </div>
            {/* Event Card 2 */}
            <div className="bg-[#181818] p-2.5 rounded-lg border border-white/5 relative flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-white">❸ Ginásio Regional Sesc</p>
                <p className="text-[8px] text-gray-500 font-bold uppercase">Garanhuns, PE</p>
              </div>
              <span className="w-4.5 h-4.5 rounded-full bg-purple-500 text-black font-black text-[9px] flex items-center justify-center">❸</span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-amber-500/10">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Loja Muzenza</span>
              <span className="text-[10px] text-amber-400 font-bold">❶</span>
            </div>
            {/* Product card mock */}
            <div className="bg-[#181818] p-3 rounded-lg border border-white/5 relative flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-[16px]">
                👕
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-white uppercase">❶ Abadá Branco M</p>
                <p className="text-[8px] font-black text-amber-400">❷ R$ 60,00</p>
                <span className="inline-block text-[7px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded mt-1">
                  ❸ Disponível: 8 itens
                </span>
              </div>
              <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-black font-black text-[9px] flex items-center justify-center shrink-0">❶</span>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden text-left border border-red-500/10">
            <div className="text-[10px] font-black uppercase text-red-400 tracking-wider flex justify-between items-center border-b border-white/5 pb-1">
              <span>Normas Gerais</span>
              <span className="text-[10px] text-red-500">❶</span>
            </div>
            <div className="space-y-2">
              <div className="bg-red-500/5 border border-red-500/10 p-2 rounded flex items-center justify-between text-[8px]">
                <span className="text-white font-bold uppercase">❶ Vencimento no Dia 10</span>
                <span className="w-4 h-4 rounded-full bg-red-400 text-black font-black text-[8px] flex items-center justify-center">❶</span>
              </div>
              <div className="bg-[#181818] p-2 rounded flex items-center justify-between text-[8px]">
                <span className="text-gray-400 font-bold uppercase">❷ Abadá nos Treinos</span>
                <span className="w-4 h-4 rounded-full bg-red-400 text-black font-black text-[8px] flex items-center justify-center">❷</span>
              </div>
              <div className="bg-[#181818] p-2 rounded flex items-center justify-between text-[8px]">
                <span className="text-gray-400 font-bold uppercase">❸ Isenção p/ Professores</span>
                <span className="w-4 h-4 rounded-full bg-red-400 text-black font-black text-[8px] flex items-center justify-center">❸</span>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-pink-500/10">
            <div className="flex justify-between items-center border-b border-white/5 pb-1 text-[10px] font-black uppercase">
              <span className="text-pink-400">Financeiro Mensal</span>
              <span className="text-pink-400">❶</span>
            </div>
            {/* Status */}
            <div className="bg-green-500/10 p-2 rounded border border-green-500/20 flex justify-between items-center">
              <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">❶ Mensalidade Paga</span>
              <span className="w-4 h-4 rounded-full bg-pink-500 text-black font-black text-[8px] flex items-center justify-center">❶</span>
            </div>
            {/* Copia Cola */}
            <div className="bg-[#181818] p-3 rounded-lg space-y-1.5 relative">
              <span className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-pink-500 text-black font-black text-[9px] flex items-center justify-center">❷</span>
              <p className="text-[7px] text-gray-400 font-black uppercase tracking-wider">❷ Copiar Payload PIX ❸</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 h-5 rounded text-[8px] text-gray-400 font-mono flex items-center px-1.5 overflow-hidden">
                  00020126360014BR.GOV.BCB...
                </div>
                <div className="w-5 h-5 bg-pink-500/20 border border-pink-500/40 rounded flex items-center justify-center text-[9px]">
                  📋
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="w-full h-full bg-[#111111] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden text-left border border-sky-500/10">
            <div className="text-[10px] font-black uppercase text-sky-400 tracking-wider flex justify-between items-center border-b border-white/5 pb-1">
              <span>Apoio Muzenza</span>
              <span className="text-[10px] text-sky-400">❶</span>
            </div>
            {/* Campaign targets */}
            <div className="bg-[#181818] p-3 rounded-lg relative">
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-sky-500 text-black font-black text-[9px] flex items-center justify-center shadow">❶</span>
              <p className="text-[9px] font-black text-white uppercase tracking-wider">❶ Aquisição de Tapetes</p>
              <div className="flex items-center justify-between text-[8px] font-black text-sky-400 mt-1">
                <span>R$ 150 Restantes</span>
                <span>85% Concluído</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-sky-400 w-[85%]" />
              </div>
            </div>
            {/* Apporter list */}
            <div className="bg-[#181818] p-2 rounded flex items-center justify-between text-[8px] relative">
              <span className="text-gray-400 font-bold uppercase">❷ Enviar Comprovante Direto</span>
              <span className="w-4 h-4 rounded-full bg-sky-500 text-black font-black text-[8px] flex items-center justify-center">❷</span>
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
          { label: '❶', title: 'Acesso Unificado', text: 'Tudo o que você precisa sobre mensalidades, treinos, eventos, perfil e benefícios do grupo Muzenza centralizados em um só app.' }
        ];
      case 1:
        return [
          { label: '❶', title: 'Controle de Regional', text: 'Identifica qual cidade/diretoria você acessa no momento.' },
          { label: '❷', title: 'Slide de Destaques', text: 'Destaques mais críticos do grupo cadastrados diretamente pela diretoria.' },
          { label: '❸', title: 'Mural Virtual', text: 'Recados rápidos e notificações dinâmicas administrativas do dia a dia.' }
        ];
      case 2:
        return [
          { label: '❶', title: 'Identidade Digital', text: 'Seu nome oficial de capoeira ou civil e fotos de identificação.' },
          { label: '❷', title: 'Nível (Cordão)', text: 'Graduação atualizada no sistema para fins de regulação e treinos.' },
          { label: '❸', title: 'Atualizar Contato', text: 'Altere seu número de celular sem precisar de aprovação burocrática.' }
        ];
      case 3:
        return [
          { label: '❶', title: 'Rotinas & Práticas', text: 'Listagem cronológica de batizados, rodas e treinos regulares.' },
          { label: '❷', title: 'Cronograma Preciso', text: 'Datas e horários específicos ajustados para o seu planejamento.' },
          { label: '❸', title: 'Instalações do Evento', text: 'Informações precisas de ginásios esportivos ou da própria sede.' }
        ];
      case 4:
        return [
          { label: '❶', title: 'Vitrines Oficiais', text: 'Catálogo contendo todos os abadás, shorts e acessórios.' },
          { label: '❷', title: 'Preço Institucional', text: 'Valores tabelados sem margem comercial abusiva para os membros.' },
          { label: '❸', title: 'Disponibilidade Física', text: 'Permite acompanhar de forma visual o tamanho disponível em estoque.' }
        ];
      case 5:
        return [
          { label: '❶', title: 'Prazo Limite', text: 'Prazo unificado estabelecido todo dia 10 para as mensalidades.' },
          { label: '❷', title: 'Uniforme de Treino', text: 'Uso obrigatório nos treinos e rodas oficiais locais.' },
          { label: '❸', title: 'Políticas de Isenção', text: 'Regras transparentes de subvenção e auxílio para instrutores homologados.' }
        ];
      case 6:
        return [
          { label: '❶', title: 'Situação da Mensalidade', text: 'Indicativo verde de "Em Dia" ou vermelho pulsante indicando pendência.' },
          { label: '❷', title: 'Copiar Copia e Cola', text: 'Copia a exata sequência Pix estruturada para pagamentos rápidos.' },
          { label: '❸', title: 'QR Code Dinâmico', text: 'Permite leitura física direta se estiver navegando pelo computador.' }
        ];
      case 7:
        return [
          { label: '❶', title: 'Metas e Reformas', text: 'Percentual e quantia faltante para as reformas de expansão da sede.' },
          { label: '❷', title: 'Comprovante Direto', text: 'Permite submeter o comprovante oficial da doação voluntária feita no PIX.' },
          { label: '❸', title: 'Destino Garantido', text: 'Garantia de que 100% dos valores arrecadados são aplicados em esportistas.' }
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
