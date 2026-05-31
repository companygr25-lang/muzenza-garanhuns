'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  MapPin, 
  Phone, 
  Award, 
  Save, 
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';

const generateFileName = (userId: string, ext: string) => {
  return `${userId}-${Date.now()}-${Math.random()}.${ext}`;
};

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [graduation, setGraduation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [pixBank, setPixBank] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setGraduation(user.graduation || '');
      setAvatarUrl(user.avatar_url || '');
      setCity(user.city || '');
      setCountry(user.country || '');
      setPixKey(user.pix_key || '');
      setPixName(user.pix_name || '');
      setPixBank(user.pix_bank || '');

      if (user.role === 'director') {
        supabase
          .from('config')
          .select('pix_key, pix_name, pix_bank')
          .eq('id', user.id)
          .single()
          .then(({ data, error }: { data: any; error: any }) => {
            if (!error && data) {
              setPixKey(data.pix_key || '');
              setPixName(data.pix_name || '');
              setPixBank(data.pix_bank || '');
            }
          });
      }
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = generateFileName(user?.id || 'anon', fileExt);
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Foto carregada! Salve para confirmar.' });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar foto: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const oldAvatar = user.avatar_url;

      let payload: any = {
        username,
        phone,
        graduation,
        avatar_url: avatarUrl,
        city,
        country,
        pix_key: pixKey,
        pix_name: pixName,
        pix_bank: pixBank
      };

      let success = false;
      let lastError = null;

      // We try up to 7 times, pruning columns that don't exist in Supabase schema if a database error occurs
      for (let attempt = 0; attempt < 7; attempt++) {
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', user.id);

        if (!error) {
          success = true;
          break;
        }

        lastError = error;
        const errMsg = error.message || '';
        
        // Match specific column in typical Supabase/PostgREST error messages
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
          // Fallback deletion order if no column detected
          if ('pix_bank' in payload) {
            delete payload['pix_bank'];
          } else if ('pix_name' in payload) {
            delete payload['pix_name'];
          } else if ('pix_key' in payload) {
            delete payload['pix_key'];
          } else if ('city' in payload) {
            delete payload['city'];
          } else if ('country' in payload) {
            delete payload['country'];
          } else {
            break;
          }
        }
      }

      if (!success && lastError) throw lastError;

      // If user is a director, also upsert their PIX details to config table
      if (user.role === 'director') {
        try {
          const { error: configError } = await supabase
            .from('config')
            .upsert({
              id: user.id,
              pix_key: pixKey,
              pix_name: pixName,
              pix_bank: pixBank
            }, { onConflict: 'id' });
          
          if (configError) throw configError;
        } catch (configErr) {
          console.error("Erro ao salvar PIX na tabela config:", configErr);
        }
      }

      // Se atualizou com sucesso e a foto nova é diferente, remove o arquivo da foto antiga para evitar acumular fotos duplicadas
      if (oldAvatar && oldAvatar !== avatarUrl) {
        try {
          const parts = oldAvatar.split('/public/avatars/');
          if (parts.length > 1) {
            const oldPath = decodeURIComponent(parts[1]);
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (storageErr) {
          console.error("Erro ao deletar arquivo antigo do storage:", storageErr);
        }
      }

      await refreshUserData();
      setMessage({ type: 'success', text: 'Perfil administrativo atualizado!' });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">Perfil Admin</h1>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest text-[10px]">Gerencie sua identidade no comando do grupo</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1A1A] border border-brand-red/20 rounded-3xl p-8 sticky top-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert size={80} className="text-brand-red" />
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-brand-red/10 border-4 border-brand-red flex items-center justify-center text-brand-red text-4xl font-black shadow-2xl relative overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-2 bg-brand-red text-white rounded-full border-4 border-[#1A1A1A]">
                  <Camera size={16} />
                </div>
              </div>
              
              <h2 className="text-2xl font-black tracking-tight mb-1">{user?.username}</h2>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                 <p className="text-brand-red font-black uppercase text-[10px] tracking-[0.2em]">ADMINISTRADOR MASTER</p>
              </div>
              
              <div className="w-full h-px bg-[#333333] mb-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center text-gray-500">
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Posto / Graduação</p>
                    <p className="font-bold text-sm text-gray-300">{user?.graduation || 'Mestre'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center text-gray-500">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Contato Direto</p>
                    <p className="font-bold text-sm text-gray-300">{user?.phone || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-[#1A1A1A] border border-[#333333] rounded-3xl p-8 md:p-12 space-y-8">
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Editar Credenciais</h3>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 font-bold text-sm",
                  message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}
              >
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Foto Administrativa</label>
                <div className="flex items-center gap-6 p-6 bg-[#121212] border border-[#333333] rounded-2xl">
                  <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border-2 border-brand-red flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-2xl text-brand-red">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      user?.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label htmlFor="avatar-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-white rounded-xl font-bold text-xs cursor-pointer transition-colors">
                      <Camera size={14} />
                      {uploading ? 'ENVIANDO...' : 'TROCAR FOTO'}
                    </label>
                    <input 
                      id="avatar-upload"
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      Utilize uma foto profissional para sua identificação como administrador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Nome de Exibição</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Celular de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all"
                    placeholder="(87) 9 0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Cidade da Região</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all"
                      placeholder="Ex: Garanhuns"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">UF / País</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all"
                      placeholder="Ex: PE ou AL"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Graduação</label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select 
                    value={graduation}
                    onChange={(e) => setGraduation(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all appearance-none"
                  >
                     <option value="Sem Corda">Sem Corda</option>
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

              <div className="bg-[#121212] border border-[#222222] rounded-3xl p-6 mt-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-[#222222] pb-3">
                  <Wallet className="text-brand-red" size={20} />
                  <p className="text-xs font-black uppercase tracking-widest text-[#FFF]">Configuração Regional de Pix</p>
                </div>
                
                <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                  Defina os dados da chave Pix da sua de sua região/academia. Alunos vinculados à sua supervisão ou região visualizarão estes dados na tela de mensalidade/pagamento.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Chave Pix da Região</label>
                    <input 
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl py-4 px-4 font-mono font-bold text-white outline-none focus:border-brand-red transition-all text-xs"
                      placeholder="Ex: CPF ou celular ou e-mail ou chave aleatória"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Titular da ContaRecebedor</label>
                      <input 
                        type="text"
                        value={pixName}
                        onChange={(e) => setPixName(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-brand-red transition-all text-xs"
                        placeholder="Ex: Mestre Bolacha"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Instituição / Banco</label>
                      <input 
                        type="text"
                        value={pixBank}
                        onChange={(e) => setPixBank(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-brand-red transition-all text-xs"
                        placeholder="Ex: Nubank ou Itaú"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-brand-red hover:bg-[#B71C1C] text-white rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ATUALIZANDO...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    ATUALIZAR PERFIL
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
