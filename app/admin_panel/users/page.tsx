'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-provider';
import { 
  Users, 
  Trash2, 
  Search,
  ChevronDown,
  Pencil,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle as LucideAlertCircle,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'director';
  phone?: string;
  monthly_paid?: boolean;
  graduation?: string;
  avatar_url?: string;
  months_paid_remaining?: number;
}

const generateFileName = (ext: string) => {
  return `${Date.now()}-${Math.random()}.${ext}`;
};

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

function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newGraduation, setNewGraduation] = useState('Sem Corda');
  const [newMonthsPaidRemaining, setNewMonthsPaidRemaining] = useState<number>(0);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);
  const [paymentUserToConfirm, setPaymentUserToConfirm] = useState<{ id: string; username: string; current: boolean } | null>(null);
  const [paymentConfirmMonths, setPaymentConfirmMonths] = useState(1);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Selecione uma imagem.');
      }

      const file = e.target.files[0];
      
      // Compactar localmente no client (50ms) e definir de imediato!
      const localBase64 = await compressImageToDataURL(file);
      if (!localBase64) {
        throw new Error('Erro ao processar imagem.');
      }

      setNewAvatarUrl(localBase64);

      // Envia em segundo plano sem bloquear a interface de forma assíncrona
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = generateFileName(fileExt);
      const filePath = `members/${fileName}`;

      supabase.storage
        .from('avatars')
        .upload(filePath, file)
        .then((res: any) => {
          const uploadError = res?.error;
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);
            setNewAvatarUrl(publicUrl);
          }
        })
        .catch((storageErr: any) => {
          console.warn("Silent storage upload error. Using instant base64:", storageErr);
        });

    } catch (error: any) {
      console.error('Erro no upload rápido:', error);
      setError('Erro ao carregar foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const [newRole, setNewRole] = useState<'admin' | 'user' | 'director'>('user');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, username: string, avatar_url?: string} | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    
    let query = supabase.from('users').select('*');
    
    if (user.role === 'director') {
      query = query.eq('director_id', user.id);
    } else if (user.username?.toUpperCase() === 'BOLACHA' || user.role === 'admin') {
      query = query.or(`director_id.is.null,director_id.eq.${user.id}`);
    }
    
    const { data, error } = await query.order('username', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar usuários:", error);
    } else {
      setUsers(data || []);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();

    const channel = supabase.channel('realtime_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError('Usuário e senha são obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check if username already exists - Primary high speed exact match
      const { data: existingExact } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername.trim())
        .maybeSingle();

      let existing = existingExact;

      if (!existing) {
        // Fallback for case-insensitive checks
        const { data: existingIlike } = await supabase
          .from('users')
          .select('id')
          .ilike('username', newUsername.trim())
          .maybeSingle();
        existing = existingIlike;
      }

      if (existing) {
        throw new Error('Este nome de usuário já está em uso.');
      }

      const insertPayload: any = {
        username: newUsername.trim(),
        password: newPassword,
        phone: newPhone.trim(),
        role: newRole,
        graduation: newGraduation,
        avatar_url: newAvatarUrl.trim()
      };

      if (user && user.role === 'director') {
        insertPayload.director_id = user.id;
        insertPayload.city = user.city;
        insertPayload.country = user.country;
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert(insertPayload);

      if (insertError) throw insertError;

      setIsAddModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewAvatarUrl('');
      setNewRole('user');
      setSuccess('Membro criado com sucesso!');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar membro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!newUsername) {
      setError('Nome de usuário é obrigatório.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const oldAvatar = editingUser.avatar_url;

      const updateData: any = {
        username: newUsername.trim(),
        phone: newPhone.trim(),
        role: newRole,
        graduation: newGraduation,
        avatar_url: newAvatarUrl.trim(),
        months_paid_remaining: newMonthsPaidRemaining,
        monthly_paid: newMonthsPaidRemaining > 0
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', editingUser.id);

      if (updateError) throw updateError;

      // Se atualizou com sucesso e a foto mudou, exclui a foto antiga do storage para evitar acúmulo de arquivos órfãos
      if (oldAvatar && oldAvatar !== newAvatarUrl.trim()) {
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

      setIsEditModalOpen(false);
      setEditingUser(null);
      setSuccess('Membro atualizado com sucesso!');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar membro.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setNewUsername(u.username);
    setNewPhone(u.phone || '');
    setNewRole(u.role);
    setNewGraduation(u.graduation || 'Sem Corda');
    setNewAvatarUrl(u.avatar_url || '');
    setNewMonthsPaidRemaining(u.months_paid_remaining || 0);
    setNewPassword('');
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleTogglePayment = async (id: string, current: boolean, name: string, currentMonths = 0) => {
    if (current) {
      const confirmAction = window.confirm(`Deseja estornar o pagamento de ${name}? Isso definirá as mensalidades pagas como 0 e o status como pendente.`);
      if (!confirmAction) return;

      setSubmitting(true);
      try {
        const { error } = await supabase
          .from('users')
          .update({ 
            monthly_paid: false,
            months_paid_remaining: 0
          })
          .eq('id', id);
        
        if (error) throw error;
        setSuccess(`Pagamento de ${name} estornado.`);
        await fetchUsers();
      } catch (err: any) {
        alert('Erro ao estornar pagamento: ' + err.message);
      } finally {
        setSubmitting(false);
      }
    } else {
      setPaymentUserToConfirm({ id, username: name, current });
      setPaymentConfirmMonths(1);
      setIsConfirmPaymentModalOpen(true);
    }
  };

  const handleConfirmMultiPaymentSubmit = async () => {
    if (!paymentUserToConfirm) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          monthly_paid: true, 
          months_paid_remaining: paymentConfirmMonths 
        })
        .eq('id', paymentUserToConfirm.id);
      
      if (error) throw error;
      
      setIsConfirmPaymentModalOpen(false);
      setPaymentUserToConfirm(null);
      setSuccess(`Registrado pagamento de ${paymentConfirmMonths} ${paymentConfirmMonths === 1 ? 'mensalidade' : 'mensalidades'} para ${paymentUserToConfirm.username}.`);
      await fetchUsers();
    } catch (err: any) {
      alert('Erro ao confirmar pagamento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };


      



  const handleUpdateGraduation = async (id: string, graduation: string, name: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ graduation })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setSuccess(`${name}: Graduação atualizada.`);
      await fetchUsers();
    } catch (error: any) {
       console.error("Erro ao atualizar graduação:", error);
       setError("Erro ao atualizar graduação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      // First, ensure all references are handled (Attendance has CASCADE, but let's be safe)
      const { error: delError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (delError) {
        throw delError;
      }

      // Se o usuário possuía uma foto cadastrada, limpa ela também do bucket de armazenamento
      if (userToDelete.avatar_url) {
        try {
          const parts = userToDelete.avatar_url.split('/public/avatars/');
          if (parts.length > 1) {
            const oldPath = decodeURIComponent(parts[1]);
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (storageErr) {
          console.error("Erro ao deletar avatar do usuário excluído do storage:", storageErr);
        }
      }

      setSuccess('Membro removido com sucesso!');
      setIsDeleting(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error: any) {
      console.error("Erro ao remover membro:", error);
      setError("Erro ao excluir membro.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = React.useMemo(() => users.filter(u => {
    const isUAdmin = u.role === 'admin' || u.role === 'director' || u.username.toUpperCase() === 'BOLACHA';
    if (isUAdmin) return false;
    return u.username.toLowerCase().includes(search.toLowerCase());
  }), [users, search]);

  const graduations = [
    'Sem Corda',
    'Cinza',
    'Cinza/Amarela',
    'Amarela',
    'Amarela/Laranja',
    'Laranja',
    'Laranja/Verde',
    'Verde',
    'Verde/Vermelha',
    'Verde/Azul (Graduado)',
    'Vermelho/Azul (Monitor)',
    'Azul (Instrutor)',
    'Vermelho/Branco (Professor 1º Grau)',
    'Vermelho/Marrom (Professor 2º Grau)',
    'Vermelho/Preto (Professor 3º Grau)',
    'Roxo (Contra-Mestre 1º Grau)',
    'Roxo/Marrom (Contra-Mestre 2º Grau)',
    'Marrom (Contra-Mestre 3º Grau)',
    'Vermelha (Mestre 1º Grau)',
    'Preta (Mestre 2º Grau)',
    'Branca (Mestre 3º Grau)',
    'Branco/Vinho (Mestre 4º Grau)',
    'Branco (Mestre)',
    'Amarelo/Preto (Estagiário)'
  ];

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">Membros</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Controle de acesso e mensalidades</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {isAdmin && (
              <button 
                onClick={() => {
                  setError(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-brand-red text-white px-6 py-4 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:brightness-110 transition-all"
              >
                <UserPlus size={18} />
                <span className="whitespace-nowrap">Novo Membro</span>
              </button>
            )}
            <div className="relative w-full md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
               <input 
                 type="text" 
                 placeholder="Pesquisar apelido..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-[#333333] rounded-xl py-4 pl-12 pr-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
               />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Novo Membro</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                      <LucideAlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Usuário / Apelido</label>
                    <input 
                      type="text"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                      placeholder="Ex: BOLACHA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Senha de Acesso</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">WhatsApp (Opcional)</label>
                    <input 
                      type="text"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                      placeholder="879..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Graduação</label>
                    <select 
                      value={newGraduation}
                      onChange={e => setNewGraduation(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all appearance-none"
                    >
                      {graduations.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Foto de Perfil</label>
                    <div className="flex items-center gap-4 p-4 bg-[#121212] border border-[#333333] rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] border border-[#333333] flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-brand-red italic">
                        {newAvatarUrl ? (
                          <img src={newAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="avatar-upload-add" className="block w-full py-2 px-4 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-white rounded-lg font-bold text-[10px] uppercase text-center cursor-pointer transition-colors">
                          {uploading ? 'ENVIANDO...' : 'UPLOAD FOTO'}
                        </label>
                        <input 
                          id="avatar-upload-add"
                          type="file" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5 mt-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Avatares rápidos de Diretoria (Clique para escolher):</p>
                      <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
                        {[
                          { name: 'Logo', url: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg' },
                          { name: 'Leão', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Berimbau', url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Diretor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Diretora', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' }
                        ].map((preset, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setNewAvatarUrl(preset.url)}
                            className={cn(
                              "relative w-9 h-9 rounded-full overflow-hidden shrink-0 border transition-all",
                              newAvatarUrl === preset.url 
                                ? "border-brand-red scale-110 shadow-[0_0_8px_rgba(211,47,47,0.4)]" 
                                : "border-[#333333] opacity-60 hover:opacity-100"
                            )}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo de Acesso</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setNewRole('user')}
                        className={cn(
                          "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                          newRole === 'user' ? "bg-white text-black border-white" : "bg-[#121212] text-gray-500 border-[#333333]"
                        )}
                      >
                        Membro
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={cn(
                          "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                          newRole === 'admin' ? "bg-brand-red text-white border-brand-red" : "bg-[#121212] text-gray-500 border-[#333333]"
                        )}
                      >
                        Diretoria
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 disabled:opacity-50 transition-all mt-4"
                  >
                    {submitting ? 'Salvando...' : 'Criar Membro'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Editar Membro</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateMember} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                      <LucideAlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Usuário / Apelido</label>
                    <input 
                      type="text"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nova Senha (deixe vazio para manter)</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">WhatsApp</label>
                    <input 
                      type="text"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Graduação</label>
                    <select 
                      value={newGraduation}
                      onChange={e => setNewGraduation(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl py-4 px-6 text-white font-bold tracking-tight outline-none focus:border-brand-red transition-all appearance-none"
                    >
                      {graduations.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Foto de Perfil</label>
                    <div className="flex items-center gap-4 p-4 bg-[#121212] border border-[#333333] rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] border border-[#333333] flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-brand-red italic">
                        {newAvatarUrl ? (
                          <img src={newAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="avatar-upload-edit" className="block w-full py-2 px-4 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-white rounded-lg font-bold text-[10px] uppercase text-center cursor-pointer transition-colors">
                          {uploading ? 'ENVIANDO...' : 'UPLOAD FOTO'}
                        </label>
                        <input 
                          id="avatar-upload-edit"
                          type="file" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5 mt-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Avatares rápidos de Diretoria (Clique para escolher):</p>
                      <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
                        {[
                          { name: 'Logo', url: 'https://i.postimg.cc/cC1K9y97/Whats-App-Image-2026-05-14-at-12-55-48.jpg' },
                          { name: 'Leão', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Berimbau', url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Diretor', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' },
                          { name: 'Diretora', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' }
                        ].map((preset, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setNewAvatarUrl(preset.url)}
                            className={cn(
                              "relative w-9 h-9 rounded-full overflow-hidden shrink-0 border transition-all",
                              newAvatarUrl === preset.url 
                                ? "border-brand-red scale-110 shadow-[0_0_8px_rgba(211,47,47,0.4)]" 
                                : "border-[#333333] opacity-60 hover:opacity-100"
                            )}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mensalidades no Edit Modal */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Mensalidades Quitadas (Período Ativo)</label>
                    <div className="flex gap-4 items-center">
                      <div className="flex bg-[#121212] border border-[#333333] rounded-xl overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => setNewMonthsPaidRemaining(prev => Math.max(0, prev - 1))}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-black hover:text-brand-red transition-all border-r border-[#333333] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-5 py-3 font-mono font-black text-white text-sm min-w-[40px] text-center flex items-center justify-center">
                          {newMonthsPaidRemaining}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewMonthsPaidRemaining(prev => prev + 1)}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-black hover:text-brand-red transition-all border-l border-[#333333] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-snug">
                        {newMonthsPaidRemaining === 0 
                          ? 'Ficará Pendente' 
                          : `Garante status Pago por ${newMonthsPaidRemaining} ${newMonthsPaidRemaining === 1 ? 'mês' : 'meses'}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo de Acesso</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setNewRole('user')}
                        className={cn(
                          "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                          newRole === 'user' ? "bg-white text-black border-white" : "bg-[#121212] text-gray-500 border-[#333333]"
                        )}
                      >
                        Membro
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={cn(
                          "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                          newRole === 'admin' ? "bg-brand-red text-white border-brand-red" : "bg-[#121212] text-gray-500 border-[#333333]"
                        )}
                      >
                        Diretoria
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 disabled:opacity-50 transition-all mt-4"
                  >
                    {submitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDeleting && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleting(false)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-[#1A1A1A] border border-red-900/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Excluir Membro?</h3>
                <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-widest">
                  Tem certeza que deseja remover <span className="text-white italic">{userToDelete?.username}</span>?<br />
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDelete}
                    disabled={submitting}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-red-900/20"
                  >
                    {submitting ? 'Removendo...' : 'Sim, Excluir'}
                  </button>
                  <button 
                    onClick={() => setIsDeleting(false)}
                    className="w-full py-4 bg-transparent text-gray-500 font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isConfirmPaymentModalOpen && paymentUserToConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsConfirmPaymentModalOpen(false);
                  setPaymentUserToConfirm(null);
                }}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-[#1A1A1A] border border-[#333333] rounded-3xl p-6 sm:p-10 shadow-2xl"
              >
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-center text-brand-red">Registrar Pagamento</h3>
                <p className="text-gray-400 font-bold text-center text-xs mb-8 uppercase tracking-widest leading-relaxed">
                  Quitar mensalidades para o aluno <span className="text-white italic">{paymentUserToConfirm.username}</span>
                </p>

                <div className="space-y-6">
                  {/* Seletor de Mensalidades */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider text-center">Quantos meses o aluno pagou?</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentConfirmMonths(m)}
                          className={cn(
                            "py-3 rounded-xl text-center font-black transition-all border text-xs cursor-pointer",
                            paymentConfirmMonths === m
                              ? "bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/10"
                              : "bg-black/40 border-[#333333] hover:border-gray-500 text-gray-400"
                          )}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/60 p-5 rounded-2xl border border-[#333333] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Período:</span>
                      <span className="text-white font-black italic">{paymentConfirmMonths} {paymentConfirmMonths === 1 ? 'Mês' : 'Meses'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Valor total:</span>
                      <span className="text-brand-red font-black text-sm italic bg-brand-red/10 px-3 py-1 rounded-lg border border-brand-red/20">R$ {(paymentConfirmMonths * 50).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={handleConfirmMultiPaymentSubmit}
                      disabled={submitting}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-red-900/20"
                    >
                      {submitting ? 'Confirmando...' : 'Confirmar Pagamento'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsConfirmPaymentModalOpen(false);
                        setPaymentUserToConfirm(null);
                      }}
                      className="w-full py-4 bg-transparent text-gray-500 font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-green-500 text-white font-black uppercase text-xs tracking-widest rounded-full shadow-2xl flex items-center gap-3 italic"
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#1E1E1E] rounded-2xl border border-[#333333] shadow-2xl overflow-hidden">
          {/* Mobile View */}
          <div className="block lg:hidden divide-y divide-[#333333]">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#121212] border border-[#333333] rounded-2xl flex items-center justify-center font-black text-brand-red italic text-xl shadow-lg overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      u.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <button 
                      onClick={() => isAdmin && openEditModal(u)}
                      className="text-left hover:text-brand-red transition-colors"
                    >
                      <p className="font-black tracking-tight italic uppercase text-xl leading-none mb-1">{u.username}</p>
                    </button>
                    {isAdmin ? (
                      <select 
                        value={u.graduation || 'Sem Corda'}
                        onChange={(e) => handleUpdateGraduation(u.id, e.target.value, u.username)}
                        className="text-xs text-gray-400 bg-transparent border-none p-0 focus:ring-0 font-bold uppercase tracking-widest cursor-pointer"
                      >
                        {graduations.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{u.graduation || 'Sem Corda'}</p>
                    )}
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    u.role === 'admin' 
                      ? "bg-brand-red/10 border-brand-red/50 text-brand-red" 
                      : "bg-gray-500/10 border-gray-500/20 text-gray-500"
                  )}>
                    {u.role === 'admin' ? 'Diretoria' : 'Membro'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Pagamento</span>
                    {u.monthly_paid ? (
                      <span className="text-green-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> Pago
                      </span>
                    ) : (
                      <span className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <LucideAlertCircle size={12} /> Pendente
                      </span>
                    )}
                  </div>
                  <div className="bg-[#121212] p-4 rounded-xl border border-[#333333]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">WhatsApp</span>
                    <span className="text-[10px] font-black text-gray-400 font-mono tracking-tight">{u.phone || 'N/A'}</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleTogglePayment(u.id, u.monthly_paid || false, u.username)}
                      disabled={submitting}
                      className="flex-1 py-4 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50"
                    >
                      {submitting ? "..." : (u.monthly_paid ? "Marcar Pendente" : "Confirmar Pago")}
                    </button>
                    <button 
                      onClick={() => openEditModal(u)}
                      disabled={submitting}
                      className="p-4 bg-[#121212] border border-[#333333] text-gray-500 hover:text-white rounded-xl disabled:opacity-50"
                      title="Editar membro"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setUserToDelete({ id: u.id, username: u.username, avatar_url: u.avatar_url });
                        setIsDeleting(true);
                      }}
                      disabled={submitting}
                      className="p-4 bg-[#121212] border border-[#333333] text-gray-500 hover:text-red-500 rounded-xl disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#181818] border-b border-[#333333]">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Membro</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Privilégios</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Contato</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mensalidade</th>
                  {isAdmin && <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#252525] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#121212] border border-[#333333] rounded-xl flex items-center justify-center font-black text-brand-red italic shadow-lg group-hover:border-brand-red transition-colors overflow-hidden">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            u.username?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                            <button 
                              onClick={() => isAdmin && openEditModal(u)}
                              className="text-left hover:text-brand-red transition-colors block"
                            >
                              <p className="font-black tracking-tight italic uppercase text-lg leading-none">{u.username}</p>
                            </button>
                            {isAdmin ? (
                              <select 
                                value={u.graduation || 'Sem Corda'}
                                onChange={(e) => handleUpdateGraduation(u.id, e.target.value, u.username)}
                                className="text-[10px] text-gray-400 bg-transparent border-none p-0 focus:ring-0 font-bold uppercase tracking-widest cursor-pointer hover:text-brand-red transition-colors"
                              >
                                {graduations.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            ) : (
                               <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{u.graduation || 'Sem Corda'}</p>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        u.role === 'admin' 
                          ? "bg-brand-red/10 border-brand-red/50 text-brand-red" 
                          : "bg-gray-500/10 border-gray-500/20 text-gray-500"
                      )}>
                        {u.role === 'admin' ? <Shield size={12} /> : <ShieldAlert size={12} />}
                        {u.role === 'admin' ? 'Diretoria' : 'Membro'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-400 font-mono tracking-tight">{u.phone || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {u.username.toLowerCase() === 'bolacha' ? (
                          <div className="flex items-center gap-2 text-brand-red font-black text-[10px] uppercase tracking-widest bg-brand-red/10 px-3 py-1.5 rounded-lg border border-brand-red/50">
                             ADMIN MASTER
                          </div>
                        ) : u.monthly_paid ? (
                          <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/50">
                            <CheckCircle2 size={12} />
                            Pago
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/50">
                            <LucideAlertCircle size={12} />
                            Pendente
                          </div>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 transition-opacity">
                          <button 
                            onClick={() => {
                              if (u.username.toLowerCase() === 'bolacha') return;
                              handleTogglePayment(u.id, u.monthly_paid || false, u.username);
                            }}
                            disabled={submitting || u.username.toLowerCase() === 'bolacha'}
                            className={cn(
                              "px-4 py-2 bg-[#121212] border border-[#333333] hover:border-green-500/50 text-xs font-black uppercase tracking-widest transition-all rounded-lg disabled:opacity-50",
                              u.username.toLowerCase() === 'bolacha' && "opacity-20 cursor-not-allowed"
                            )}
                            title={u.username.toLowerCase() === 'bolacha' ? "Admin Master não possui mensalidade" : (u.monthly_paid ? "Marcar como pendente" : "Confirmar pagamento")}
                          >
                             {submitting ? "..." : (u.monthly_paid ? "Estornar" : "Confirmar")}
                          </button>
                          <button 
                            onClick={() => openEditModal(u)}
                            disabled={submitting}
                            className="p-2 bg-[#121212] border border-[#333333] hover:border-white text-gray-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                            title="Editar membro"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setUserToDelete({ id: u.id, username: u.username, avatar_url: u.avatar_url });
                              setIsDeleting(true);
                            }}
                            disabled={submitting}
                            className="p-2 bg-[#121212] border border-[#333333] hover:border-red-500/50 text-gray-500 hover:text-red-500 rounded-lg transition-all disabled:opacity-50"
                            title="Remover membro"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      </div>
  );
}

export default UsersPage;
