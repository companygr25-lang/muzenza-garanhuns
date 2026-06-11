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
  AlertCircle
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setGraduation(user.graduation || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer o upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = generateFileName(user?.id || 'anon', fileExt);
      const filePath = `${fileName}`;

      // Upload the file to the 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Foto carregada! Lembre-se de salvar as alterações.' });
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

      const { error } = await supabase
        .from('users')
        .update({
          username,
          phone,
          graduation,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

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
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">Meu Perfil</h1>
        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest text-[10px]">Gerencie suas informações no Muzenza</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-3xl p-8 sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-brand-red/10 border-4 border-brand-red flex items-center justify-center text-brand-red text-4xl font-black shadow-2xl overflow-hidden">
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
              <p className="text-brand-red font-black uppercase text-[10px] tracking-[0.2em] mb-4">{user?.role}</p>
              
              <div className="w-full h-px bg-[#333333] mb-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center text-gray-500">
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Graduação</p>
                    <p className="font-bold text-sm text-gray-300">{user?.graduation || 'Não informada'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center text-gray-500">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Contato</p>
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
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Informações Pessoais</h3>
            
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
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Foto de Perfil</label>
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
                      {uploading ? 'CARREGANDO...' : 'ESCOLHER FOTO'}
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
                      Formatos aceitos: JPG, PNG. Tamanho máx: 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Nome / Apelido</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all"
                    placeholder="Seu nome no grupo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Telefone</label>
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

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Sua Graduação</label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select 
                    value={graduation}
                    onChange={(e) => setGraduation(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-brand-red transition-all appearance-none"
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

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-brand-red hover:bg-[#B71C1C] text-white rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    SALVANDO...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    SALVAR ALTERAÇÕES
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
