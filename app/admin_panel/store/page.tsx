'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-provider';
import { playNotificationSound } from '@/lib/sound';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Package,
  ChevronRight,
  Pencil,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  on_sale?: boolean;
}

const StorePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { isAdmin } = useAuth();
  
  const [showAdd, setShowAdd] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newStock, setNewStock] = useState(0);
  const [newCat, setNewCat] = useState('Vestuário');
  const [newImage, setNewImage] = useState('');
  const [onSale, setOnSale] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar produtos:", error);
    } else {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProducts();
    };
    init();

    const channel = supabase.channel('realtime_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_items' }, () => {
        fetchProducts(); // Removed delay
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('store_items')
        .insert([{
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock),
          category: newCat,
          image_url: newImage,
          on_sale: onSale
        }]);

      if (error) throw error;
      setNewName('');
      setNewPrice(0);
      setNewStock(0);
      setNewImage('');
      setShowAdd(false);
      // Immediate fetch
      await fetchProducts();
      playNotificationSound();
      alert('Produto cadastrado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      alert('Erro ao criar produto: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleStockUpdate = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      const { error } = await supabase
        .from('store_items')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
      // Immediate fetch for fallback
      fetchProducts();
      playNotificationSound();
    } catch (error) {
       console.error("Erro ao atualizar estoque:", error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', itemToDelete);
      
      if (error) {
        console.error("Erro detalhado do Supabase ao deletar:", error);
        throw error;
      }
      
      await fetchProducts();
      setItemToDelete(null);
      playNotificationSound();
      alert('Item excluído com sucesso!');
    } catch (error: any) {
      console.error("Erro detalhado ao deletar produto:", error);
      alert(`Erro ao excluir produto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { error } = await supabase
        .from('store_items')
        .update({
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock),
          category: newCat,
          image_url: newImage,
          on_sale: onSale
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
      playNotificationSound();
      alert('Produto atualizado com sucesso!');
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      alert('Erro ao atualizar produto: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewName(product.name);
    setNewPrice(product.price);
    setNewStock(product.stock);
    setNewCat(product.category);
    setNewImage(product.image_url || '');
    setOnSale(product.on_sale || false);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 uppercase">CATÁLOGO</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Loja oficial Muzenza Garanhuns</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="w-full md:w-auto bg-brand-red hover:bg-[#B71C1C] text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-2xl"
            >
              {showAdd ? <Package size={20} /> : <Plus size={20} />}
              {showAdd ? 'FECHAR ESTOQUE' : 'ADICIONAR PRODUTO'}
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Nome do Produto</label>
                    <input 
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Ex: Abadá Oficial Muzenza"
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Categoria</label>
                    <select 
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold appearance-none"
                    >
                      <option>Vestuário</option>
                      <option>Instrumentos</option>
                      <option>Acessórios</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">URL da Imagem (Opcional)</label>
                    <input 
                      value={newImage}
                      onChange={e => setNewImage(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Preço (R$)</label>
                    <input 
                      required
                      type="number"
                      value={newPrice}
                      onChange={e => setNewPrice(Number(e.target.value))}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-4 bg-[#121212] border border-[#333333] rounded-xl p-5 mt-6">
                    <input 
                      type="checkbox"
                      id="onSale"
                      checked={onSale}
                      onChange={e => setOnSale(e.target.checked)}
                      className="w-5 h-5 accent-brand-red rounded border-[#333333]"
                    />
                    <label htmlFor="onSale" className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer">Colocar em Promoção</label>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Quantidade em Estoque</label>
                    <input 
                      required
                      type="number"
                      value={newStock}
                      onChange={e => setNewStock(Number(e.target.value))}
                      className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                    />
                </div>
                <button type="submit" className="w-full bg-brand-red py-5 rounded-xl font-black uppercase tracking-widest text-sm italic">
                  CADASTRAR NO SISTEMA
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="group bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="h-48 bg-[#121212] flex items-center justify-center border-b border-[#333333] relative">
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.name} 
                    fill 
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-gray-800 flex flex-col items-center gap-2">
                    <Package size={48} />
                    <span className="text-[9px] font-black tracking-widest uppercase">Sem Imagem</span>
                  </div>
                )}
                {product.on_sale && (
                  <div className="absolute top-4 left-4 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 z-10 shadow-lg">
                    PROMOÇÃO
                  </div>
                )}
                {product.stock <= 5 && (
                  <div className="absolute top-4 right-4 bg-brand-red/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse border border-white/20">
                    Estoque Crítico
                  </div>
                )}
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-red mb-1 block">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">{product.name}</h3>
                  </div>
                  <p className="text-2xl font-black italic text-brand-red">R$ {product.price}</p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest mb-1">
                    <span className="text-gray-500">Nível de Estoque</span>
                    <span className={cn(product.stock <= 5 ? "text-brand-red" : "text-gray-400")}>
                      {product.stock} Unidades
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden border border-[#333333]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                      className={cn(
                        "h-full transition-colors duration-500",
                        product.stock <= 2 ? "bg-red-600" : product.stock <= 5 ? "bg-brand-red" : "bg-green-600"
                      )}
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  {isAdmin ? (
                    <>
                      <div className="flex-1 flex items-center bg-[#121212] border border-[#333333] rounded-xl overflow-hidden">
                        <button 
                          onClick={() => handleStockUpdate(product.id, product.stock - 1)}
                          className="flex-1 py-3 text-gray-500 hover:text-white hover:bg-[#1A1A1A] transition-colors font-black"
                        >
                          -
                        </button>
                        <div className="w-px h-6 bg-[#333333]"></div>
                        <span className="px-4 font-black text-xs">{product.stock}</span>
                        <div className="w-px h-6 bg-[#333333]"></div>
                        <button 
                          onClick={() => handleStockUpdate(product.id, product.stock + 1)}
                          className="flex-1 py-3 text-gray-500 hover:text-white hover:bg-[#1A1A1A] transition-colors font-black"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-3 bg-[#121212] border border-[#333333] text-gray-500 hover:text-white rounded-xl transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(product.id)}
                        disabled={isDeleting && itemToDelete === product.id}
                        className="p-3 bg-[#121212] border border-[#333333] text-gray-500 hover:text-red-500 hover:border-red-500/50 rounded-xl transition-all disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <button 
                      className="w-full py-4 bg-brand-red hover:bg-[#B71C1C] text-white font-black italic text-xs uppercase tracking-widest rounded-xl shadow-2xl transition-all flex items-center justify-center gap-3"
                    >
                      Solicitar com Mestre <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-[#333333] rounded-3xl">
              <ShoppingBag size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">Loja ainda sem itens cadastrados</p>
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
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Excluir Item</h3>
                <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-widest">
                  Você tem certeza que deseja remover este item da loja? Alunos não poderão mais visualizá-lo ou solicitá-lo.
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
                        REMOVENDO...
                      </>
                    ) : (
                      'REMOVER DEFINITIVAMENTE'
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
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Editar Produto</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Nome do Produto</label>
                      <input 
                        required
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Categoria</label>
                      <select 
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold appearance-none"
                      >
                        <option>Vestuário</option>
                        <option>Instrumentos</option>
                        <option>Acessórios</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">URL da Imagem (Opcional)</label>
                      <input 
                        value={newImage}
                        onChange={e => setNewImage(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                      />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Preço (R$)</label>
                      <input 
                        required
                        type="number"
                        value={newPrice}
                        onChange={e => setNewPrice(Number(e.target.value))}
                        className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-4 bg-[#121212] border border-[#333333] rounded-xl p-5 mt-6">
                      <input 
                        type="checkbox"
                        id="onSaleEdit"
                        checked={onSale}
                        onChange={e => setOnSale(e.target.checked)}
                        className="w-5 h-5 accent-brand-red rounded border-[#333333]"
                      />
                      <label htmlFor="onSaleEdit" className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer">Colocar em Promoção</label>
                    </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Quantidade em Estoque</label>
                      <input 
                        required
                        type="number"
                        value={newStock}
                        onChange={e => setNewStock(Number(e.target.value))}
                        className="w-full bg-[#121212] border border-[#333333] rounded-xl p-5 text-white outline-none focus:border-brand-red font-bold"
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
};

export default StorePage;
