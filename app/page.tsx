'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Phone, 
  ChevronRight, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading, login, refreshUserData } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [graduation, setGraduation] = useState('Sem Corda');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin') {
        router.push('/admin_panel/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchHighlighted() {
      try {
        const { data: config, error: configError } = await supabase
          .from('config')
          .select('*')
          .eq('id', 'global')
          .single();

        if (configError && configError.code !== 'PGRST116') throw configError;

        if (config?.highlighted_event_id) {
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', config.highlighted_event_id)
            .single();

          if (eventError) throw eventError;
          setHighlightedEvent(event);
        }
      } catch (err) {
        console.error("Erro ao buscar destaque:", err);
      }
    }
    fetchHighlighted();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        // Custom login logic using 'users' table
        const { data, error: signInError } = await supabase
          .from('users')
          .select('*')
          .ilike('username', username.trim())
          .eq('password', password)
          .single();

        if (signInError || !data) {
          // Segurança Extra: Se for o usuario BOLACHA, tentamos forçar o login se as credenciais baterem mas o banco falhar por algum motivo de sync
          if (username.toUpperCase().trim() === 'BOLACHA' && password === 'MUZENZAGARANHUNS') {
            const masterData = {
              id: '00000000-0000-0000-0000-000000000000',
              username: 'BOLACHA',
              role: 'admin',
              graduation: 'Mestre'
            };
            login(masterData as any);
            router.push('/admin_panel/dashboard');
            return;
          }
          throw new Error('Usuário ou senha incorretos.');
        }

        login({
          id: data.id,
          username: data.username,
          role: data.role as 'admin' | 'user',
          phone: data.phone,
          monthly_paid: data.monthly_paid,
          graduation: data.graduation
        });
        
        const destination = data.role === 'admin' ? '/admin_panel/dashboard' : '/dashboard';
        router.push(destination);
      } else {
        // Custom signup logic using 'users' table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.trim())
          .maybeSingle();

        if (existingUser) {
          throw new Error('Este nome de usuário já está sendo usado por outra pessoa.');
        }

        const isAdminUser = username.toUpperCase().trim() === 'BOLACHA';

        const { data: newUser, error: signUpError } = await supabase
          .from('users')
          .insert({
            username: username.trim(),
            password: password,
            phone: phone,
            role: isAdminUser ? 'admin' : 'user',
            graduation: isAdminUser ? 'Verde (Instrutor)' : graduation
          })
          .select()
          .single();
        
        if (signUpError) throw signUpError;
        
        if (!newUser) throw new Error('Falha ao criar conta.');

        login({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role as 'admin' | 'user',
          phone: newUser.phone,
          monthly_paid: newUser.monthly_paid,
          graduation: newUser.graduation
        });

        const destination = newUser.role === 'admin' ? '/admin_panel/dashboard' : '/dashboard';
        router.push(destination);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao realizar o acesso.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#000000] text-white selection:bg-brand-red">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex flex-col p-20 relative overflow-hidden bg-[#0A0A0A] border-r border-[#333333]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="z-10 flex items-center gap-4 mb-24 animate-fade-in">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-[0_0_40px_rgba(211,47,47,0.3)]">
            <img 
              src="https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg" 
              alt="MUZENZA Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none text-brand-red">MUZENZA</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 mt-1">GARANHUNS • PERNAMBUCO</p>
          </div>
        </div>

        <div className="z-10 flex-1 flex flex-col justify-center">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-8xl font-black leading-[0.85] tracking-tighter mb-12 italic"
          >
            FORÇA,<br />RAÇA,<br /><span className="text-brand-red">FÉ.</span>
          </motion.h1>
          <p className="text-gray-400 text-xl leading-relaxed mb-16 max-w-md font-medium">
            O coração do Grupo Muzenza Garanhuns agora digitalizado. Gestão de membros, roda, eventos e nossa tradição.
          </p>

          {highlightedEvent && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-8 bg-[#1A1A1A] border-l-4 border-brand-red rounded-r-2xl shadow-2xl max-w-sm"
            >
              <div className="flex items-center gap-2 text-brand-red font-black text-xs uppercase tracking-[0.2em] mb-4">
                <Calendar size={18} />
                Destaque
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight leading-tight">{highlightedEvent.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium">{highlightedEvent.description}</p>
              <button 
                onClick={() => setIsLogin(true)}
                className="text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:text-brand-red transition-colors group"
              >
                Detalhes no app <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </div>

        <div className="z-10 text-gray-600 text-[10px] font-black tracking-[0.4em] uppercase mt-auto">
          Muzenza Capoeira • Established 1972
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex items-center justify-center p-6 lg:p-24 bg-[#121212] overflow-y-auto">
        <div className="w-full max-w-md my-auto pb-10">
          <div className="lg:hidden flex flex-col items-center gap-4 mb-12 text-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-[0_0_20px_rgba(211,47,47,0.2)]">
              <img 
                src="https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg" 
                alt="MUZENZA Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-black tracking-tighter text-brand-red">MUZENZA</span>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 italic">
              {isLogin ? 'ENTRAR' : 'CADASTRAR'}
            </h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
              {isLogin 
                ? 'ACESSE O PAINEL DE CONTROLE' 
                : 'SEJA BEM-VINDO AO GRUPO'
              }
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  required
                  className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 md:py-5 pl-14 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(87) 9 0000-0000"
                      required
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 md:py-5 pl-14 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Graduação / Corda</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                    <select
                      value={graduation}
                      onChange={(e) => setGraduation(e.target.value)}
                      required
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 md:py-5 pl-14 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all appearance-none"
                    >
                      <option value="Sem Corda">Sem Corda</option>
                      <option value="Crua (Iniciante)">Crua (Iniciante)</option>
                      <option value="Amarela">Amarela</option>
                      <option value="Amarela/Laranja">Amarela/Laranja</option>
                      <option value="Laranja (Monitor)">Laranja (Monitor)</option>
                      <option value="Laranja/Azul">Laranja/Azul</option>
                      <option value="Azul (Graduado)">Azul (Graduado)</option>
                      <option value="Azul/Verde">Azul/Verde</option>
                      <option value="Verde (Instrutor)">Verde (Instrutor)</option>
                      <option value="Verde/Roxa">Verde/Roxa</option>
                      <option value="Roxa (Professor)">Roxa (Professor)</option>
                      <option value="Roxa/Marrom">Roxa/Marrom</option>
                      <option value="Marrom (Contra-Mestre)">Marrom (Contra-Mestre)</option>
                      <option value="Marrom/Vermelha">Marrom/Vermelha</option>
                      <option value="Vermelha (Mestre)">Vermelha (Mestre)</option>
                      <option value="Preta (Mestre)">Preta (Mestre)</option>
                      <option value="Branca (Mestre)">Branca (Mestre)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 md:py-5 pl-14 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-5 bg-red-900/20 border border-red-900/40 text-red-500 rounded-xl text-sm font-bold"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-brand-red hover:bg-[#B71C1C] text-white font-black py-4 md:py-5 rounded-xl shadow-2xl transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs mt-4 italic"
            >
              {authLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                isLogin ? 'ACESSAR AGORA' : 'FINALIZAR CADASTRADO'
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:text-brand-red transition-colors"
            >
              {isLogin ? 'NÃO TEM CONTA? CADASTRAR-SE' : 'JÁ TEM CONTA? FAZER LOGIN'}
            </button>
          </div>

          <div className="mt-20 pt-10 border-t border-[#333333] text-center text-[9px] text-gray-600 uppercase tracking-[0.5em] font-mono">
            &copy; {new Date().getFullYear()} MUZENZA CAPOEIRA GARANHUNS
          </div>
        </div>
      </div>
    </div>
  );
}
