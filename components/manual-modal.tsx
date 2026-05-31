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
  Pause
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
    description: 'Aqui na página inicial, você acompanha todos os avisos oficiais, vê o evento em destaque agendado pelo Mestre Bolacha e as últimas novidades importantes.',
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
    description: 'Consulte as regras fundamentais do grupo Muzenza Garanhuns sobre pagamento de mensalidade, participação e retirada de abadás na loja de forma prática.',
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

  // Combined timer for progress (1 minute = 60000ms. If we update every 100ms, total updates is 600)
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const intervalTime = 100; // Milissegundos
    const totalTime = 60000; // 1 minuto
    const step = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next slide
          setCurrentSlide((prevSlide) => {
            if (prevSlide === SLIDES.length - 1) {
              // Last slide, end manual
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
    if (e) e.stopPropagation(); // Prevent propagation that would trigger another click handler
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
    // Click on the slide main area advances to the next slide automatically
    handleNext();
  };

  const activeSlide = SLIDES[currentSlide];
  const IconComponent = activeSlide.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-md select-none"
      onClick={handleScreenClick}
    >
      <div 
        className="w-full max-w-2xl bg-[#121212] border-2 border-brand-red rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(211,47,47,0.4)] flex flex-col relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing/advancing when clicking internal content
      >
        {/* Progress Bar */}
        <div className="w-full bg-[#1e1e1e] h-1.5 overflow-hidden">
          <div 
            className="h-full bg-brand-red transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header Controls */}
        <div className="p-6 flex justify-between items-center bg-[#181818] border-b border-[#333333]">
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
            className="p-2 bg-[#222222] hover:bg-brand-red rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Content */}
        <div 
          className="p-5 sm:p-8 md:p-12 flex-1 flex flex-col items-center text-center justify-center min-h-[300px] md:min-h-[350px] cursor-pointer hover:bg-white/[0.01] transition-colors"
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
              className="space-y-6 flex flex-col items-center w-full"
            >
              {/* Optional App Logo / Avatar for Welcome Slide */}
              {activeSlide.image ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-red shadow-[0_0_20px_rgba(211,47,47,0.3)] mb-2">
                  <img src={activeSlide.image === 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg' ? appConfig?.logoUrl : activeSlide.image} alt="Logo Muzenza" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2 shadow-2xl transition-transform hover:scale-110"
                  style={{ backgroundColor: `${activeSlide.color}15`, border: `2px solid ${activeSlide.color}` }}
                >
                  <IconComponent size={36} style={{ color: activeSlide.color }} />
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">
                  {activeSlide.highlight}
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold italic tracking-tight uppercase leading-none">
                  {activeSlide.title}
                </h2>
              </div>

              <p className="text-gray-400 text-sm md:text-base leading-relaxed font-semibold max-w-lg">
                {activeSlide.description
                  .replace('Muzenza Garanhuns', `Muzenza ${appConfig?.cityName || 'Garanhuns'}`)
                  .replace('Mestre Bolacha', 'seu Diretor')}
              </p>
              
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider animate-pulse pt-4">
                💡 Dica: Clique em qualquer lugar para avançar mais rápido
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-[#181818] border-t border-[#333333] flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest px-4 py-3 rounded-xl transition-all ${
              currentSlide === 0 
                ? 'text-gray-600 cursor-not-allowed opacity-50' 
                : 'text-white bg-[#252525] hover:bg-[#333333]'
            }`}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>

          <div className="flex gap-1.5">
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
            className="flex items-center gap-2 bg-white text-black hover:bg-brand-red hover:text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-xl transition-all shadow-xl"
          >
            {currentSlide === SLIDES.length - 1 ? 'Concluir' : 'Próximo'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
