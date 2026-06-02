'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  Award, 
  Calendar, 
  Building, 
  Trash2, 
  Upload, 
  Eye, 
  Plus, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Certificate {
  id: string;
  title: string;
  institution: string;
  date: string;
  photoBase64: string;
  createdAt: string;
}

export default function CertificatesPage() {
  const { user, refreshUserData } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [date, setDate] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');
  const [compressing, setCompressing] = useState(false);

  // Lightbox State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  // Fetch current director's certificates
  const fetchCertificates = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('certificates')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data && data.certificates) {
        const certs = typeof data.certificates === 'string' 
          ? JSON.parse(data.certificates) 
          : data.certificates;
        setCertificates(Array.isArray(certs) ? certs : []);
      } else {
        setCertificates([]);
      }
    } catch (err: any) {
      console.error("Erro ao buscar certificados:", err);
      // Fallback - Try reading from config with id 'certs_' + user.id
      try {
        const { data: configData, error: configError } = await supabase
          .from('config')
          .select('rules')
          .eq('id', `certs_${user.id}`)
          .single();
        
        if (!configError && configData && configData.rules) {
          const certs = typeof configData.rules === 'string'
            ? JSON.parse(configData.rules)
            : configData.rules;
          setCertificates(Array.isArray(certs) ? certs : []);
        } else {
          // If both fail, let's check local storage as a final client cache
          const localCerts = localStorage.getItem(`muzenza_certs_${user.id}`);
          if (localCerts) {
            setCertificates(JSON.parse(localCerts));
          }
        }
      } catch (fallbackErr) {
        console.error("Erro no fallback de certificados:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  // Compress Image Client-Side for extremely fast transfers & avoiding Storage issues
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setErrorMsg(null);
    setPhotoName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to downscale and compress
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down to max 800px width/height for standard receipt clarity but tiny footprint
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPhotoBase64(compressedBase64);
        } else {
          setPhotoBase64(event.target?.result as string);
        }
        setCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !institution || !date || !photoBase64) {
      setErrorMsg('Por favor, preencha todos os campos e anexe uma foto do certificado.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const newCert: Certificate = {
      id: crypto.randomUUID(),
      title,
      institution,
      date,
      photoBase64,
      createdAt: new Date().toISOString()
    };

    const updatedCerts = [newCert, ...certificates];

    try {
      // 1. Try updating user record in Supabase
      const { error } = await supabase
        .from('users')
        .update({ certificates: updatedCerts })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setCertificates(updatedCerts);
      localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
      setSuccessMsg('Certificado lançado e arquivado com sucesso!');
      
      // Clean up form
      setTitle('');
      setInstitution('');
      setDate('');
      setPhotoBase64('');
      setPhotoName('');
      setShowAddForm(false);
      
      await refreshUserData();
    } catch (err: any) {
      console.warn("Erro ao salvar certificado no perfil principal. Tentando fallback...", err);
      
      // 2. Fallback: Save in config table under user id
      try {
        const { error: configError } = await supabase
          .from('config')
          .upsert({
            id: `certs_${user.id}`,
            rules: updatedCerts
          }, { onConflict: 'id' });

        if (configError) throw configError;

        setCertificates(updatedCerts);
        localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
        setSuccessMsg('Certificado lançado com sucesso (salvo via tabela de configuração regional)!');
        
        // Clean up form
        setTitle('');
        setInstitution('');
        setDate('');
        setPhotoBase64('');
        setPhotoName('');
        setShowAddForm(false);
      } catch (fallbackErr: any) {
        console.error("Erro crítico ao salvar em ambos canais:", fallbackErr);
        setErrorMsg('Erro de salvamento na nuvem. Execute o script SQl contido no arquivo UPDATE_DATABASE.sql em seu painel Supabase para habilitar a coluna de certificados. Os dados foram salvos temporariamente no navegador.');
        // Still update local states so they can see it in this session
        setCertificates(updatedCerts);
        localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    if (!user) return;
    if (!confirm('Deseja realmente excluir este certificado permanenetemente?')) return;

    setSaving(true);
    const updatedCerts = certificates.filter(c => c.id !== certId);

    try {
      // 1. Try updating users table
      const { error } = await supabase
        .from('users')
        .update({ certificates: updatedCerts })
        .eq('id', user.id);

      if (error) throw error;

      setCertificates(updatedCerts);
      localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
      setSuccessMsg('Certificado excluído com sucesso.');
      await refreshUserData();
    } catch (err) {
      console.warn("Erro ao fazer update no delete. Usando fallback...", err);
      try {
        // Fallback update
        const { error: configError } = await supabase
          .from('config')
          .upsert({
            id: `certs_${user.id}`,
            rules: updatedCerts
          }, { onConflict: 'id' });

        if (configError) throw configError;

        setCertificates(updatedCerts);
        localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
        setSuccessMsg('Certificado excluído com sucesso (via configuração regional).');
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setErrorMsg('Houve um erro ao sincronizar a exclusão com a nuvem, porém foi removido localmente.');
        setCertificates(updatedCerts);
        localStorage.setItem(`muzenza_certs_${user.id}`, JSON.stringify(updatedCerts));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">Meus Certificados</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest text-[10px]">Lançamento e comprovação de formação e graduação administrativa</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-brand-red hover:bg-[#B71C1C] text-white px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-xl self-start md:self-end"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'FECHAR FORMULÁRIO' : 'LANÇAR CERTIFICADO'}
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex gap-3 text-xs md:text-sm font-semibold uppercase leading-relaxed">
          <AlertCircle className="shrink-0 text-red-500" size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex gap-3 text-xs md:text-sm font-semibold uppercase">
          <CheckCircle2 className="shrink-0 text-green-500" size={20} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddCertificate} className="bg-[#1A1A1A] border border-[#333333] rounded-3xl p-5 sm:p-8 md:p-10 space-y-6">
              <h3 className="text-xl font-black italic tracking-tighter uppercase text-brand-red flex items-center gap-2">
                <Award size={20} /> Preencher Dados do Certificado
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest px-1">Título do Certificado / Graduação</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Formado de Capoeira, Professor de Educação Física"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333333] focus:border-brand-red rounded-xl p-4 text-white font-bold text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest px-1">Instituição de Emissão</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Grupo Muzenza de Capoeira, CREF"
                      value={institution}
                      onChange={e => setInstitution(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] focus:border-brand-red rounded-xl py-4 pl-12 pr-4 text-white font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest px-1">Data de Conclusão / Emissão</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] focus:border-brand-red rounded-xl py-3.5 pl-12 pr-4 text-white font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest px-1">Comprovante do Certificado (Foto Escaneada)</label>
                  <div className="flex gap-4 items-center">
                    <label 
                      htmlFor="photo-upload" 
                      className={cn(
                        "flex items-center justify-center gap-2 px-6 py-3 border border-[#333333] hover:border-brand-red text-white text-xs font-black uppercase rounded-xl cursor-pointer transition-all shrink-0 bg-[#121212]",
                        photoBase64 ? "border-green-500/30 text-green-400 bg-green-500/5 hover:border-green-400" : ""
                      )}
                    >
                      {compressing ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          {photoBase64 ? 'TROCAR FOTO' : 'ANEXAR FOTO'}
                        </>
                      )}
                    </label>
                    <input 
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      disabled={compressing}
                      className="hidden"
                    />
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate max-w-[200px]">
                      {photoName || 'Nenhum comprovante anexado'}
                    </div>
                  </div>
                </div>
              </div>

              {photoBase64 && (
                <div className="pt-4 border-t border-[#333333] space-y-2">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Prévia do Comprovante</p>
                  <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-[#333] bg-black/40 flex items-center justify-center group">
                    <img 
                      src={photoBase64} 
                      alt="Certificate Preview" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || compressing}
                className="w-full md:w-auto px-12 py-5 bg-brand-red hover:bg-[#B71C1C] text-white rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    ARQUIVANDO...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    SALVAR E LANÇAR CERTIFICADO
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List / Grid layout */}
      <div className="bg-[#1E1E1E] p-5 sm:p-8 md:p-10 rounded-3xl border border-[#333333] shadow-2xl space-y-6">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
          <Award className="text-brand-red" size={24} /> Arquivo de Formação de Diretores
        </h2>

        {loading ? (
          <div className="p-16 text-center text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Carregando certificados...
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[#333] rounded-2xl flex flex-col items-center justify-center gap-4">
            <ImageIcon className="text-gray-600 w-16 h-16" />
            <div className="text-center">
              <p className="text-sm font-black uppercase text-gray-400 tracking-wider">Nenhum certificado lançado ainda</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">Lançar seus certificados de graduação e cursos para validar seu perfil regional.</p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-2 bg-[#121212] border border-[#333] hover:border-brand-red hover:text-brand-red text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer"
            >
              Começar Lançamento
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div 
                key={cert.id} 
                className="bg-[#121212] border border-[#333333] rounded-2xl overflow-hidden shadow-xl hover:border-brand-red transition-all duration-300 flex flex-col relative group"
              >
                {/* Certificate image thumbnail */}
                {cert.photoBase64 && (
                  <div className="relative h-44 w-full bg-black/40 overflow-hidden group/thumb">
                    <img 
                      src={cert.photoBase64} 
                      alt={cert.title} 
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPhoto(cert.photoBase64);
                          setSelectedTitle(cert.title);
                        }}
                        className="p-3 bg-white text-black rounded-full hover:bg-brand-red hover:text-white transition-colors cursor-pointer"
                        title="Ver em tamanho real"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        disabled={saving}
                        className="p-3 bg-white text-brand-red rounded-full hover:bg-brand-red hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        title="Deletar certificado"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-black italic text-lg uppercase tracking-tight text-white leading-snug">{cert.title}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Building size={12} className="text-brand-red" />
                      {cert.institution}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#222] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-widest">
                      <Calendar size={12} />
                      <span>{new Date(cert.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedPhoto(cert.photoBase64);
                        setSelectedTitle(cert.title);
                      }}
                      className="text-[10px] font-black uppercase text-brand-red hover:text-white tracking-widest flex items-center gap-1 border-b border-transparent hover:border-white transition-all cursor-pointer"
                    >
                      <Eye size={12} /> Visualizar
                    </button>
                  </div>
                </div>

                {/* Floating delete on small devices for convenience */}
                <button
                  onClick={() => handleDeleteCertificate(cert.id)}
                  disabled={saving}
                  className="absolute top-3 right-3 p-2.5 bg-black/80 hover:bg-brand-red text-white hover:text-white rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Deletar certificado"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal (For viewing certificates in large size) */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full max-h-[85vh] bg-[#111] p-4 rounded-3xl border border-[#333] shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                <h4 className="font-black italic text-lg uppercase tracking-tight text-white">{selectedTitle}</h4>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto mt-4 rounded-2xl bg-black border border-[#222] flex items-center justify-center">
                <img 
                  src={selectedPhoto} 
                  alt="Certificate Fullscreen" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl p-2 select-none" 
                />
              </div>
              
              <div className="text-center pt-4">
                 <button 
                   onClick={() => setSelectedPhoto(null)}
                   className="text-xs font-black uppercase tracking-widest text-[#B3B3B3] hover:text-brand-red border border-[#333] hover:border-brand-red px-6 py-2.5 rounded-full transition-all cursor-pointer"
                 >
                   Fechar Visualização
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
