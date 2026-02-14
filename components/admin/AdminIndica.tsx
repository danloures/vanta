import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../../constants';
import { Event } from '../../types';
import { fetchAdminIndica, saveIndicaItem, deleteIndicaItem, IndicaAdminItem } from '../../lib/indicaApi';
import { BR_STATES_CITIES } from '../../data/brStatesCities';
import { vantaFeedback } from '../../lib/feedbackStore';
import { VantaImageCropper } from '../../features/profile/VantaImageCropper';

interface AdminIndicaProps {
  events: Event[];
}

export const AdminIndica: React.FC<AdminIndicaProps> = ({ events }) => {
  const [items, setItems] = useState<IndicaAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado do Formulário
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IndicaAdminItem>({
    title: '',
    image_url: '',
    tag: 'EXCLUSIVE ACCESS',
    type: 'EVENT',
    city: null, // Global por padrão
    is_active: true,
    event_id: '',
    url: ''
  });

  // Local Cropper State
  const [cropper, setCropper] = useState<{ isOpen: boolean, src: string }>({ isOpen: false, src: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega lista inicial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchAdminIndica();
    setItems(data);
    setIsLoading(false);
  };

  const handleEdit = (item: IndicaAdminItem) => {
    setFormData({
      ...item,
      event_id: item.event_id || '',
      url: item.url || ''
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setFormData({
      title: '',
      image_url: '',
      tag: 'EXCLUSIVE ACCESS',
      type: 'EVENT',
      city: null,
      is_active: true,
      event_id: '',
      url: ''
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    vantaFeedback.confirm({
      title: 'Excluir Destaque',
      message: 'Esta ação removerá o item permanentemente.',
      confirmLabel: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        setIsProcessing(true);
        const success = await deleteIndicaItem(id);
        if (success) {
          vantaFeedback.toast('success', 'Removido', 'Item excluído com sucesso.');
          loadData();
        } else {
          vantaFeedback.toast('error', 'Erro', 'Falha ao excluir item.');
        }
        setIsProcessing(false);
      }
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) {
      vantaFeedback.toast('warning', 'Dados Incompletos', 'Título e Imagem são obrigatórios.');
      return;
    }
    if (formData.type === 'EVENT' && !formData.event_id) {
      vantaFeedback.toast('warning', 'Dados Incompletos', 'Selecione um evento para vincular.');
      return;
    }
    if (formData.type === 'LINK' && !formData.url) {
      vantaFeedback.toast('warning', 'Dados Incompletos', 'Insira a URL de destino.');
      return;
    }

    setIsProcessing(true);
    const result = await saveIndicaItem({ ...formData, id: editingId || undefined });
    
    if (result.success) {
      vantaFeedback.toast('success', editingId ? 'Atualizado' : 'Criado', 'Destaque salvo no sistema.');
      setShowForm(false);
      loadData();
    } else {
      vantaFeedback.toast('error', 'Operação Negada', result.message || 'Erro desconhecido.');
    }
    setIsProcessing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropper({ isOpen: true, src: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setFormData(prev => ({ ...prev, image_url: croppedBase64 }));
    setCropper({ isOpen: false, src: '' });
  };

  // Extrai lista de todas as cidades disponíveis no app
  const allCities = React.useMemo(() => {
    const cities: string[] = [];
    Object.values(BR_STATES_CITIES).forEach(state => {
      cities.push(...state.cities);
    });
    return cities.sort();
  }, []);

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">GESTÃO DE VITRINE</h3>
          <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Vanta Indica</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleCreateNew} 
            className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
          >
            Novo Destaque
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-6 shadow-2xl animate-in zoom-in-95">
          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37]">
            {editingId ? 'EDITAR DESTAQUE' : 'CRIAR NOVO DESTAQUE'}
          </h3>
          
          {/* Banner Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[16/9] w-full bg-zinc-900 border border-dashed border-white/5 rounded-[2rem] overflow-hidden cursor-pointer group relative flex flex-col items-center justify-center text-center hover:border-[#d4af37]/30 transition-all"
          >
            {formData.image_url ? (
              <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="space-y-2 opacity-30 group-hover:opacity-100 transition-opacity">
                <ICONS.Plus className="w-8 h-8 mx-auto" />
                <span className="text-[7px] font-black uppercase tracking-widest block">Carregar Banner (16:9)</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Título Principal</label>
               <input 
                 type="text" 
                 value={formData.title} 
                 onChange={e => setFormData({...formData, title: e.target.value})}
                 placeholder="EX: A CHAVE ESTÁ EM SUAS MÃOS" 
                 className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white/20"
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Etiqueta (Tag)</label>
                  <input 
                    type="text" 
                    value={formData.tag} 
                    onChange={e => setFormData({...formData, tag: e.target.value})}
                    placeholder="EX: EXCLUSIVE ACCESS" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-white/20"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Abrangência</label>
                  <select 
                    value={formData.city || ''} 
                    onChange={e => setFormData({...formData, city: e.target.value || null})}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-white/20"
                  >
                    <option value="">GLOBAL (TODAS AS CIDADES)</option>
                    {allCities.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Destino</label>
               <div className="flex bg-zinc-900 rounded-full p-1 border border-white/5 mb-2">
                  <button 
                    onClick={() => setFormData({...formData, type: 'EVENT'})}
                    className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${formData.type === 'EVENT' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}
                  >
                    Evento Interno
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, type: 'LINK'})}
                    className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${formData.type === 'LINK' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}
                  >
                    Link Externo
                  </button>
               </div>

               {formData.type === 'EVENT' ? (
                 <select 
                   value={formData.event_id || ''} 
                   onChange={e => setFormData({...formData, event_id: e.target.value})}
                   className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-[#d4af37]/20"
                 >
                   <option value="">SELECIONE UM EVENTO...</option>
                   {events.map(e => <option key={e.id} value={e.id}>{e.title} ({e.city})</option>)}
                 </select>
               ) : (
                 <input 
                   type="text" 
                   value={formData.url || ''} 
                   onChange={e => setFormData({...formData, url: e.target.value})}
                   placeholder="HTTPS://..." 
                   className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-[#d4af37]/20"
                 />
               )}
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
               <span className="text-[9px] font-black text-white uppercase tracking-widest ml-2">Visibilidade Ativa</span>
               <button 
                 onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                 className={`w-12 h-7 rounded-full relative transition-all ${formData.is_active ? 'bg-[#d4af37]' : 'bg-zinc-800'}`}
               >
                 <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.is_active ? 'left-6' : 'left-1'}`}></div>
               </button>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
             <button 
               onClick={handleSave}
               disabled={isProcessing}
               className="flex-1 py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-50"
             >
               {isProcessing ? "Salvando..." : "Salvar Destaque"}
             </button>
             <button 
               onClick={() => setShowForm(false)}
               disabled={isProcessing}
               className="px-8 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase rounded-full"
             >
               Cancelar
             </button>
          </div>
        </div>
      )}

      {cropper.isOpen && (
        <VantaImageCropper 
          imageSrc={cropper.src}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropper({ isOpen: false, src: '' })}
          aspectRatio={16/9}
          maskShape="rect"
        />
      )}

      <div className="space-y-4">
        <h4 className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">
          Itens no Banco de Dados ({items.length})
        </h4>
        
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-5 flex items-center gap-5 group hover:border-[#d4af37]/20 transition-all">
                 <div className="w-20 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                    <img src={item.image_url} className={`w-full h-full object-cover transition-all ${!item.is_active ? 'grayscale opacity-50' : ''}`} alt="" />
                 </div>
                 {/* PATCH DE ALTA VISIBILIDADE: Container de Texto Corrigido */}
                 <div className="flex-1 relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                       <h5 className={`text-[10px] font-black uppercase break-words whitespace-normal leading-tight ${item.is_active ? 'text-white' : 'text-zinc-500 line-through'}`}>
                         {item.title || '(SEM TÍTULO)'}
                       </h5>
                       <span className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-600'}`}>
                         {item.is_active ? 'ATIVO' : 'INATIVO'}
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-widest">{item.city || 'GLOBAL'}</span>
                       <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">• {item.type}</span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-400 hover:text-[#d4af37] transition-all"><ICONS.Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id!)} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-red-900/40 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
             <p className="text-[8px] font-black uppercase">Nenhum destaque cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};