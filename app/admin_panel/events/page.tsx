'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-provider';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Pencil,
  Star, 
  ChevronRight,
  Clock,
  Users,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { user, isAdmin, loading } = useAuth();
  
  const [showAdd, setShowAdd] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLoc, setNewLoc] = useState('');

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar eventos:", error);
    } else {
      setEvents(data || []);
    }
  };

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('id', 'global')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Erro ao buscar config:", error);
    } else if (data) {
      setHighlightedId(data.highlighted_event_id);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchEvents();
      await fetchConfig();
    };
    init();

    const eventsChannel = supabase.channel('realtime_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    const configChannel = supabase.channel('realtime_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config', filter: 'id=eq.global' }, (payload: any) => {
        setHighlightedId(payload.new.highlighted_event_id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(configChannel);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('events')
        .insert([{
          title: newTitle,
          description: newDesc,
          date: newDate,
          location: newLoc
        }]);

      if (error) throw error;
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewLoc('');
      setShowAdd(false);
      // Wait for fetch to ensure local state is updated even if realtime is slightly delayed
      await fetchEvents();
      alert('Evento publicado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      alert('Erro ao criar evento: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', itemToDelete);
      
      if (error) {
        console.error("Erro detalhado do Supabase ao deletar:", error);
        throw error;
      }
      
      await fetchEvents();
      setItemToDelete(null);
      alert('Evento excluído com sucesso!');
    } catch (error: any) {
      console.error("Erro detalhado ao deletar evento:", error);
      alert(`Erro ao excluir evento: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHighlight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({
          id: 'global',
          highlighted_event_id: id === highlightedId ? null : id
        });
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao destacar evento:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: newTitle,
          description: newDesc,
          date: newDate,
          location: newLoc
        })
        .eq('id', editingEvent.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      setEditingEvent(null);
      await fetchEvents();
      alert('Evento atualizado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error);
      alert('Erro ao atualizar evento: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDesc(event.description);
    setNewDate(event.date);
    setNewLoc(event.location);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4">EVENTOS</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Acompanhe nossa programação oficial</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="w-full md:w-auto bg-brand-red hover:bg-[#B71C1C] text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-2xl"
            >
              {showAdd ? <Clock size={20} /> : <Plus size={20} />}
              {showAdd ? 'FECHAR' : 'NOVO EVENTO'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAdd} className="bg-[#1E1E1E] p-10 rounded-2xl border border-[#333333] space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Título do Evento</label>
                    <input 
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Ex: Batizado 2026"
                      className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Local</label>
                    <input 
                      required
                      value={newLoc}
                      onChange={e => setNewLoc(e.target.value)}
                      placeholder="Ex: Ginásio do SESC"
                      className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Data</label>
                  <div className="relative group/date">
                    <input 
                      required
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold appearance-none relative z-10"
                    />
                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/date:text-brand-red transition-colors z-0" size={20} />
                    <style jsx>{`
                      input[type="date"]::-webkit-calendar-picker-indicator {
                        background: transparent;
                        bottom: 0;
                        color: transparent;
                        cursor: pointer;
                        height: auto;
                        left: 0;
                        position: absolute;
                        right: 0;
                        top: 0;
                        width: auto;
                        z-index: 20;
                      }
                    `}</style>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Descrição</label>
                  <textarea 
                    required
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Detalhes sobre o evento..."
                    className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red min-h-[120px] font-bold"
                  />
                </div>
                <button type="submit" className="w-full bg-brand-red py-5 rounded-xl font-black uppercase tracking-widest text-sm italic">
                  PUBLICAR EVENTO
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.div 
              key={event.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="group bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-brand-red/50 hover:shadow-brand-red/10 border-l-8 border-l-brand-red"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-brand-red/10 p-3 rounded-xl text-brand-red">
                    <Calendar size={24} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(event)}
                        className="p-2 bg-[#121212] border border-[#333333] text-gray-500 hover:text-white rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleHighlight(event.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors border border-[#333333]",
                          highlightedId === event.id ? "bg-brand-red text-white border-brand-red" : "text-gray-500 bg-[#121212] hover:text-white"
                        )}
                      >
                        <Star size={18} fill={highlightedId === event.id ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(event.id)}
                        disabled={isDeleting && itemToDelete === event.id}
                        className="p-2 bg-[#121212] border border-[#333333] text-gray-500 hover:text-red-500 hover:border-red-500/50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-black mb-2 tracking-tight italic uppercase">{event.title}</h3>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock size={14} className="text-brand-red" />
                  {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#121212] w-fit px-4 py-2 rounded-full mb-6 border border-[#333333]">
                  <MapPin size={14} className="text-brand-red" />
                  <span className="uppercase tracking-widest truncate max-w-[200px]">{event.location}</span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                  {event.description}
                </p>

                <button className="w-full py-4 bg-[#121212] hover:bg-brand-red text-white border border-[#333333] hover:border-brand-red rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn">
                  Destaques da Roda <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
          {events.length === 0 && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-[#333333] rounded-3xl">
              <Calendar size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">Nenhum evento agendado</p>
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {itemToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setItemToDelete(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[#1A1A1A] border border-brand-red/30 rounded-3xl p-10 shadow-3xl text-center"
              >
                <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-red ring-4 ring-brand-red/5">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Confirmar Exclusão</h3>
                <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
                  Você tem certeza que deseja excluir este evento? Esta ação é irreversível e o evento sumirá para todos os alunos.
                </p>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-5 bg-brand-red hover:bg-[#B71C1C] text-white rounded-2xl font-black uppercase tracking-widest text-xs italic transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        EXCLUINDO...
                      </>
                    ) : (
                      'SIM, EXCLUIR AGORA'
                    )}
                  </button>
                  <button 
                    onClick={() => setItemToDelete(null)}
                    disabled={isDeleting}
                    className="w-full py-5 bg-[#121212] border border-[#333333] hover:border-white/20 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs italic transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
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
                className="relative w-full max-w-2xl bg-[#1A1A1A] border border-[#333333] rounded-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Editar Evento</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Título do Evento</label>
                      <input 
                        required
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Local</label>
                      <input 
                        required
                        value={newLoc}
                        onChange={e => setNewLoc(e.target.value)}
                        className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Data</label>
                    <div className="relative group/date">
                      <input 
                        required
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold appearance-none relative z-10"
                      />
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/date:text-brand-red transition-colors z-0" size={20} />
                      <style jsx>{`
                        input[type="date"]::-webkit-calendar-picker-indicator {
                          background: transparent;
                          bottom: 0;
                          color: transparent;
                          cursor: pointer;
                          height: auto;
                          left: 0;
                          position: absolute;
                          right: 0;
                          top: 0;
                          width: auto;
                          z-index: 20;
                        }
                      `}</style>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Descrição</label>
                    <textarea 
                      required
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full bg-brand-dark border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red min-h-[120px] font-bold"
                    />
                  </div>
                  <button type="submit" className="w-full bg-brand-red py-5 rounded-xl font-black uppercase tracking-widest text-sm italic">
                    SALVAR ALTERAÇÕES
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
}
