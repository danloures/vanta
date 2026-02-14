
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../../constants';
import { LocationPickerModal } from './LocationPickerModal';

interface EventIdentitySectionProps {
  eventForm: any;
  setEventForm: (form: any) => void;
  eventImageInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, field: any) => void;
  canEditDetails: boolean;
  handleRestrictedAction: (action: () => void) => void;
}

export const EventIdentitySection: React.FC<EventIdentitySectionProps> = ({
  eventForm,
  setEventForm,
  eventImageInputRef,
  handleFileSelect,
  canEditDetails,
  handleRestrictedAction
}) => {
  const [tagInput, setTagInput] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Sincronizar input local de tags se o form já tiver dados
  useEffect(() => {
    if (eventForm.vibeTags && Array.isArray(eventForm.vibeTags)) {
      // Opcional: pré-popular o input ou apenas mostrar os chips
    }
  }, [eventForm.vibeTags]);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const currentTags = eventForm.vibeTags || [];
    // Merge único
    const uniqueTags = Array.from(new Set([...currentTags, ...newTags]));
    setEventForm({ ...eventForm, vibeTags: uniqueTags });
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = eventForm.vibeTags || [];
    setEventForm({ 
      ...eventForm, 
      vibeTags: currentTags.filter((t: string) => t !== tagToRemove) 
    });
  };

  return (
    <div className={`space-y-8 p-8 bg-zinc-950 border border-white/5 rounded-[3rem] shadow-inner transition-opacity ${!canEditDetails ? 'opacity-60' : ''}`}>
      <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-[#d4af37]">01. IDENTIDADE DO EVENTO</h3>
      
      <div className="space-y-4">
        <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Título & Descrição</label>
        <input 
          type="text" 
          value={eventForm.title} 
          onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
          placeholder="NOME DA SESSÃO" 
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20"
          readOnly={!canEditDetails}
        />
        <textarea 
          value={eventForm.description} 
          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
          placeholder="DESCRIÇÃO BREVE..." 
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20 h-24 resize-none"
          readOnly={!canEditDetails}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
           <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Data</label>
           <input type="date" value={eventForm.startDate} onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none" readOnly={!canEditDetails} />
        </div>
        <div className="space-y-2">
           <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Início</label>
           <input type="time" value={eventForm.startTime} onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none text-center" readOnly={!canEditDetails} />
        </div>
        <div className="space-y-2">
           <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Fim</label>
           <input type="time" value={eventForm.endTime} onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none text-center" readOnly={!canEditDetails} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Localização & Mapa</label>
        <div className="flex gap-2">
          <input 
            type="text"
            value={eventForm.location}
            onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
            placeholder="ENDEREÇO / NOME DO LOCAL"
            className="flex-[2] bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20"
            readOnly={!canEditDetails}
          />
          <button 
            onClick={() => handleRestrictedAction(() => setShowMap(true))}
            className={`flex-1 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${eventForm.latitude ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
          >
            <ICONS.MapPin className="w-4 h-4" />
            <span className="text-[6px] font-black uppercase tracking-widest">{eventForm.latitude ? 'GPS OK' : 'NO MAPA'}</span>
          </button>
        </div>
        <div className="flex gap-2">
           <input type="text" value={eventForm.city} onChange={(e) => setEventForm({...eventForm, city: e.target.value})} placeholder="CIDADE" className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none" readOnly={!canEditDetails} />
           <input type="text" value={eventForm.state} onChange={(e) => setEventForm({...eventForm, state: e.target.value})} placeholder="UF" className="w-20 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none" readOnly={!canEditDetails} />
        </div>
      </div>

      {/* VANTA_CLARITY: Info Operacional Inputs */}
      <div className="space-y-4">
        <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Protocolo Operacional (Clarity Pack)</label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input 
             type="text" 
             value={eventForm.dressCode || ''} 
             onChange={(e) => setEventForm({...eventForm, dressCode: e.target.value})}
             placeholder="DRESS CODE (EX: ESPORTE FINO)" 
             className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/20"
             readOnly={!canEditDetails}
           />
           <input 
             type="text" 
             value={eventForm.lineup || ''} 
             onChange={(e) => setEventForm({...eventForm, lineup: e.target.value})}
             placeholder="LINE-UP (ARTISTAS)" 
             className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/20"
             readOnly={!canEditDetails}
           />
        </div>
        
        <textarea 
          value={eventForm.entryTips || ''} 
          onChange={(e) => setEventForm({...eventForm, entryTips: e.target.value})}
          placeholder="DICAS DE CHEGADA / PORTARIA (EX: ENTRADA PELA RUA LATERAL)" 
          className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/20 h-20 resize-none"
          readOnly={!canEditDetails}
        />
      </div>

      {/* VANTA_CLARITY: Vibe Tags Input */}
      <div className="space-y-4">
        <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Vibe Tags (Filtros)</label>
        <div className="flex gap-2">
           <input 
             type="text" 
             value={tagInput}
             onChange={(e) => setTagInput(e.target.value)}
             placeholder="ADICIONAR TAGS (EX: FUNK, ROOFTOP, HOUSE)..."
             className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/20"
             onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
             readOnly={!canEditDetails}
           />
           <button 
             onClick={handleAddTag}
             className="px-6 bg-zinc-800 rounded-2xl text-white text-xl font-light hover:bg-zinc-700 transition-colors"
             disabled={!canEditDetails}
           >
             +
           </button>
        </div>
        
        {eventForm.vibeTags && eventForm.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
             {eventForm.vibeTags.map((tag: string, i: number) => (
               <span key={i} className="px-3 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full text-[8px] font-black uppercase text-[#d4af37] flex items-center gap-2">
                 {tag}
                 {canEditDetails && (
                   <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">×</button>
                 )}
               </span>
             ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Banner do Evento *</label>
        <div 
          onClick={() => handleRestrictedAction(() => eventImageInputRef.current?.click())}
          className={`aspect-video w-full bg-zinc-900 border border-dashed rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center text-center group transition-all cursor-pointer ${eventForm.image ? 'border-[#d4af37]/40' : 'border-white/10 hover:border-white/30'}`}
        >
          {eventForm.image ? <img src={eventForm.image} className="w-full h-full object-cover" alt="Banner" /> : <ICONS.Plus className="w-8 h-8 text-[#d4af37] opacity-20" />}
          <input ref={eventImageInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'event_image')} className="hidden" />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
         <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Transferência Permitida</span>
            <p className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Gift Protocol P2P Habilitado</p>
         </div>
         <button 
           onClick={() => handleRestrictedAction(() => setEventForm((prev: any) => ({ ...prev, isTransferEnabled: !prev.isTransferEnabled })))}
           className={`w-12 h-7 rounded-full relative transition-all ${eventForm.isTransferEnabled ? 'bg-[#d4af37]' : 'bg-zinc-800'}`}
         >
           <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${eventForm.isTransferEnabled ? 'left-6' : 'left-1'}`}></div>
         </button>
      </div>

      <LocationPickerModal 
        isOpen={showMap} 
        onClose={() => setShowMap(false)}
        onConfirm={(lat, lng) => {
          setEventForm({...eventForm, latitude: lat, longitude: lng});
          setShowMap(false);
        }}
        initialLat={eventForm.latitude}
        initialLng={eventForm.longitude}
        city={eventForm.city}
      />
    </div>
  );
};
