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

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [graduation, setGraduation] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setGraduation(user.graduation || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username,
          phone,
          graduation
        })
        .eq('id', user.id);

      if (error) throw error;

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
                <div className="w-32 h-32 rounded-full bg-brand-red/10 border-4 border-brand-red flex items-center justify-center text-brand-red text-4xl font-black shadow-2xl">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-brand-red text-white rounded-full border-4 border-[#1A1A1A] hover:scale-110 transition-transform">
                  <Camera size={16} />
                </button>
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
