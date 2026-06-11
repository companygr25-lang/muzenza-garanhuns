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
  AlertCircle,
  Globe,
  MapPin,
  Camera,
  Image as LucideImage
} from 'lucide-react';

const compressImageToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve('');
    };
    reader.onerror = () => resolve('');
  });
};

export default function LandingPage() {
  const { user, loading, login, appConfig, setAppConfig } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [graduation, setGraduation] = useState('Sem Corda');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [highlightedEvent, setHighlightedEvent] = useState<any>(null);
  const router = useRouter();

  // Multi-gestão / Outras equipes states
  const [regType, setRegType] = useState<'student' | 'director'>('student');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [directors, setDirectors] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Sync brand details dynamically when user changes current selecting region or registration
  useEffect(() => {
    if (!isLogin && regType === 'student') {
      if (!selectedDirectorId) {
        setAppConfig({
          logoUrl: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
          cityName: 'GARANHUNS',
          countryName: 'PE'
        });
      } else {
        const d = directors.find(dir => dir.id === selectedDirectorId);
        if (d) {
          const config = {
            logoUrl: d.avatar_url || 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
            cityName: d.city || 'Desconhecido',
            countryName: d.country || 'PE'
          };
          setAppConfig(config);
          localStorage.setItem('muzenza_visitor_config', JSON.stringify(config));
        }
      }
    }
  }, [selectedDirectorId, directors, regType, isLogin, setAppConfig]);

  useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin' || user.role === 'director') {
        router.push('/admin_panel/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchDirectors() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, city, country, avatar_url')
          .eq('role', 'director')
          .order('username', { ascending: true });
        
        if (!error && data) {
          setDirectors(data);
        }
      } catch (err) {
        console.error("Erro ao buscar diretores:", err);
      }
    }
    fetchDirectors();
  }, [isLogin]);

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

  const generateFileName = (ext: string) => {
    return `${Date.now()}-${Math.random()}.${ext}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError('');

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Selecione uma imagem.');
      }

      const file = e.target.files[0];
      
      // Realiza compressão instantânea em escala local (50ms) para obter o Base64 ultra compacto
      const localBase64 = await compressImageToDataURL(file);
      if (!localBase64) {
        throw new Error('Falha ao otimizar a imagem.');
      }

      // Define o avatar local de imediato! A foto muda na hora e o formulário já pode ser enviado
      setAvatarUrl(localBase64);

      // Dispara o upload do Storage de forma 100% assíncrona em background.
      // O usuário NÃO aguarda o término desta chamada para poder finalizar o cadastro!
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = generateFileName(fileExt);
      const filePath = `avatars/${fileName}`;

      supabase.storage
        .from('avatars')
        .upload(filePath, file)
        .then((res: any) => {
          const uploadError = res?.error;
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            
            // Se o upload assíncrono der certo, atualiza para o link público estático
            setAvatarUrl(publicUrl);
          }
        })
        .catch((storageErr: any) => {
          console.warn("Storage upload failed silently. Continuing using instant base64:", storageErr);
        });

    } catch (err: any) {
      console.error('Erro no upload rápido:', err);
      setError('Erro ao carregar foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        // Custom login logic using 'users' table - Primary tries index-friendly exact match
        let { data, error: signInError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.trim())
          .eq('password', password)
          .single();

        // If not found, fall back to case-insensitive ilike query (utilizes index scan when exact match is typed, with safe fallback)
        if (signInError || !data) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('*')
            .ilike('username', username.trim())
            .eq('password', password)
            .single();
          
          if (!fallbackError && fallbackData) {
            data = fallbackData;
            signInError = null;
          }
        }

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
          role: data.role as 'admin' | 'user' | 'director',
          phone: data.phone,
          monthly_paid: data.monthly_paid,
          graduation: data.graduation,
          city: data.city,
          country: data.country,
          director_id: data.director_id,
          avatar_url: data.avatar_url
        });
        
        const destination = (data.role === 'admin' || data.role === 'director') ? '/admin_panel/dashboard' : '/dashboard';
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

        let finalRole: 'user' | 'director' | 'admin' = 'user';
        let finalCity = 'Garanhuns';
        let finalCountry = 'Brasil';
        let finalDirectorId: string | null = null;

        if (isAdminUser) {
          finalRole = 'admin';
        } else if (regType === 'director') {
          finalRole = 'director';
          if (!city.trim() || !country.trim()) {
            throw new Error('Cidade e país são obrigatórios para cadastro de diretor.');
          }
          finalCity = city.trim();
          finalCountry = country.trim();
        } else {
          // Student signup: inherit city/country from selected director
          if (selectedDirectorId) {
            const direct = directors.find(d => d.id === selectedDirectorId);
            if (direct) {
              finalDirectorId = selectedDirectorId;
              finalCity = direct.city || 'Garanhuns';
              finalCountry = direct.country || 'Brasil';
            }
          }
        }

        const { data: newUser, error: signUpError } = await supabase
          .from('users')
          .insert({
            username: username.trim(),
            password: password,
            phone: phone,
            role: finalRole,
            graduation: isAdminUser ? 'Verde (Instrutor)' : graduation,
            city: finalCity,
            country: finalCountry,
            director_id: finalDirectorId,
            avatar_url: regType === 'director' && avatarUrl ? avatarUrl : null
          })
          .select()
          .single();
        
        if (signUpError) throw signUpError;
        
        if (!newUser) throw new Error('Falha ao criar conta.');

        if (typeof window !== 'undefined') {
          localStorage.setItem('muzenza_new_register', 'true');
        }

        login({
          id: newUser.id,
          username: newUser.username,
          role: newUser.role as 'admin' | 'user' | 'director',
          phone: newUser.phone,
          monthly_paid: newUser.monthly_paid,
          graduation: newUser.graduation,
          city: newUser.city,
          country: newUser.country,
          director_id: newUser.director_id,
          avatar_url: newUser.avatar_url
        });

        const destination = (newUser.role === 'admin' || newUser.role === 'director') ? '/admin_panel/dashboard' : '/dashboard';
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
              src={appConfig.logoUrl} 
              alt="MUZENZA Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none text-brand-red">MUZENZA</h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 mt-1">
              {(appConfig.cityName || 'GARANHUNS').toUpperCase()} • {(appConfig.countryName || 'PE').toUpperCase()}
            </p>
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
            O coração do Grupo Muzenza {(appConfig.cityName || 'GARANHUNS')} agora digitalizado. Gestão de membros, roda, eventos e nossa tradição.
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
      <div className="flex items-center justify-center p-6 pt-16 md:p-12 lg:p-24 bg-[#121212] overflow-y-auto">
        <div className="w-full max-w-md my-auto pb-10">
          <div className="lg:hidden flex flex-col items-center gap-4 mb-12 text-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-[0_0_20px_rgba(211,47,47,0.2)]">
              <img 
                src={appConfig.logoUrl} 
                alt="MUZENZA Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <span className="text-2xl font-black tracking-tighter text-brand-red block leading-none">MUZENZA</span>
              <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase">
                {(appConfig.cityName || 'GARANHUNS').toUpperCase()} - {(appConfig.countryName || 'PE').toUpperCase()}
              </span>
            </div>
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
                {/* Tabs to select registration type */}
                <div className="flex bg-[#161616] p-1.5 rounded-xl border border-[#333333] mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setRegType('student');
                      setError('');
                    }}
                    className={`flex-1 text-[10px] font-black uppercase tracking-wider py-3 rounded-lg transition-all ${
                      regType === 'student'
                        ? 'bg-brand-red text-white'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Aluno / Membro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegType('director');
                      setError('');
                    }}
                    className={`flex-1 text-[10px] font-black uppercase tracking-wider py-3 rounded-lg transition-all ${
                      regType === 'director'
                        ? 'bg-brand-red text-white'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    Novo Diretor
                  </button>
                </div>

                <div className="space-y-4">
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

                  {regType === 'director' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Cidade</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Ex: Paris"
                              required={regType === 'director'}
                              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 pl-12 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">País</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                            <input
                              type="text"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              placeholder="Ex: França"
                              required={regType === 'director'}
                              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 pl-12 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Foto de Perfil (Diretoria)</label>
                        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-red bg-[#121212] flex items-center justify-center shrink-0">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Camera size={20} className="text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">Escolha uma foto</p>
                              <p className="text-[10px] text-gray-500">Imagens JPG, PNG até 5MB</p>
                            </div>
                          </div>
                          <label className="bg-[#2a2a2a] hover:bg-brand-red hover:text-white px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase cursor-pointer transition-all shrink-0">
                            {uploading ? 'Carregando...' : 'Fazer Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Seletor de Avatares Rápidos Inteligentes */}
                        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-3.5 space-y-2 mt-2">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">
                            Ou use um avatar rápido de diretoria (Instantâneo):
                          </p>
                          <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                            {[
                              { name: 'Logo', url: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg' },
                              { name: 'Leão', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&auto=format&fit=crop&q=60' },
                              { name: 'Berimbau', url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=150&auto=format&fit=crop&q=60' },
                              { name: 'Diretor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' },
                              { name: 'Diretora', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' }
                            ].map((preset, index) => {
                              const isSelected = avatarUrl === preset.url;
                              return (
                                <button
                                  type="button"
                                  key={index}
                                  onClick={() => {
                                    setAvatarUrl(preset.url);
                                    setError('');
                                  }}
                                  className={`relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 transition-all ${
                                    isSelected 
                                      ? 'border-brand-red scale-110 shadow-[0_0_12px_rgba(211,47,47,0.5)]' 
                                      : 'border-[#333333] opacity-60 hover:opacity-100 hover:scale-105'
                                  }`}
                                  title={preset.name}
                                >
                                  <img 
                                    src={preset.url} 
                                    alt={preset.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 px-1">Selecione sua Cidade / Região</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <select
                          value={selectedDirectorId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setSelectedDirectorId(id);
                            if (!id) {
                              const config = {
                                logoUrl: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
                                cityName: 'GARANHUNS',
                                countryName: 'PE'
                              };
                              setAppConfig(config);
                              localStorage.setItem('muzenza_visitor_config', JSON.stringify(config));
                            } else {
                              const d = directors.find(dir => dir.id === id);
                              if (d) {
                                const config = {
                                  logoUrl: d.avatar_url || 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg',
                                  cityName: d.city || 'Desconhecido',
                                  countryName: d.country || 'PE'
                                };
                                setAppConfig(config);
                                localStorage.setItem('muzenza_visitor_config', JSON.stringify(config));
                              }
                            }
                          }}
                          className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 md:py-5 pl-14 pr-6 font-bold tracking-tight text-white outline-none focus:border-brand-red transition-all appearance-none"
                        >
                          <option value="">GARANHUNS - PE (Sede Geral)</option>
                          {directors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {(d.city || 'Desconhecido').toUpperCase()} - {(d.country || 'PE').toUpperCase()} (Diretor: {d.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

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
                        {/* Graduações Infantis */}
                        <option value="Crua (Infantil)">Crua (Infantil)</option>
                        <option value="Crua/Cinza (Infantil)">Crua/Cinza (Infantil)</option>
                        <option value="Crua/Amarela (Infantil)">Crua/Amarela (Infantil)</option>
                        <option value="Crua/Laranja (Infantil)">Crua/Laranja (Infantil)</option>
                        <option value="Crua/Verde (Infantil)">Crua/Verde (Infantil)</option>
                        <option value="Crua/Vermelha (Infantil)">Crua/Vermelha (Infantil)</option>
                        <option value="Crua/Azul (Infantil)">Crua/Azul (Infantil)</option>
                        <option value="Cinza/Laranja (Infantil)">Cinza/Laranja (Infantil)</option>
                        <option value="Cinza/Verde (Infantil)">Cinza/Verde (Infantil)</option>
                        <option value="Cinza/Vermelha (Infantil)">Cinza/Vermelha (Infantil)</option>
                        <option value="Cinza/Azul (Infantil)">Cinza/Azul (Infantil)</option>
                        <option value="Amarela/Verde (Infantil)">Amarela/Verde (Infantil)</option>
                        <option value="Amarela/Vermelha (Infantil)">Amarela/Vermelha (Infantil)</option>
                        <option value="Amarela/Azul (Infantil)">Amarela/Azul (Infantil)</option>
                        <option value="Laranja/Vermelha (Infantil)">Laranja/Vermelha (Infantil)</option>
                        <option value="Laranja/Azul (Infantil)">Laranja/Azul (Infantil)</option>
                        <option value="Verde/Azul (Infantil)">Verde/Azul (Infantil)</option>
                        {/* Graduações Adultas */}
                        <option value="Cinza">Cinza</option>
                        <option value="Cinza/Amarela">Cinza/Amarela</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Amarela/Laranja">Amarela/Laranja</option>
                        <option value="Laranja">Laranja</option>
                        <option value="Laranja/Verde">Laranja/Verde</option>
                        <option value="Verde">Verde</option>
                        <option value="Verde/Vermelha">Verde/Vermelha</option>
                        <option value="Verde/Azul (Graduado)">Verde/Azul (Graduado)</option>
                        <option value="Vermelho/Azul (Monitor)">Vermelho/Azul (Monitor)</option>
                        <option value="Azul (Instrutor)">Azul (Instrutor)</option>
                        <option value="Vermelho/Branco (Professor 1º Grau)">Vermelho/Branco (Professor 1º Grau)</option>
                        <option value="Vermelho/Marrom (Professor 2º Grau)">Vermelho/Marrom (Professor 2º Grau)</option>
                        <option value="Vermelho/Preto (Professor 3º Grau)">Vermelho/Preto (Professor 3º Grau)</option>
                        <option value="Roxo (Contra-Mestre 1º Grau)">Roxo (Contra-Mestre 1º Grau)</option>
                        <option value="Roxo/Marrom (Contra-Mestre 2º Grau)">Roxo/Marrom (Contra-Mestre 2º Grau)</option>
                        <option value="Marrom (Contra-Mestre 3º Grau)">Marrom (Contra-Mestre 3º Grau)</option>
                        <option value="Vermelha (Mestre 1º Grau)">Vermelha (Mestre 1º Grau)</option>
                        <option value="Preta (Mestre 2º Grau)">Preta (Mestre 2º Grau)</option>
                        <option value="Branca (Mestre 3º Grau)">Branca (Mestre 3º Grau)</option>
                        <option value="Branco/Vinho (Mestre 4º Grau)">Branco/Vinho (Mestre 4º Grau)</option>
                        <option value="Branco (Mestre)">Branco (Mestre)</option>
                        <option value="Amarelo/Preto (Estagiário)">Amarelo/Preto (Estagiário)</option>
                      </select>
                    </div>
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
