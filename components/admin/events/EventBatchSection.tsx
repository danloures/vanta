
import React from 'react';
import { TicketBatch, TicketVariation } from '../../../types';
import { ICONS } from '../../../constants';

interface EventBatchSectionProps {
  eventForm: any;
  setEventForm: (form: any) => void;
  showBatchEditor: boolean;
  setShowBatchEditor: (show: boolean) => void;
  tempBatch: Partial<TicketBatch>;
  setTempBatch: (batch: Partial<TicketBatch>) => void;
  tempVariation: Partial<TicketVariation>;
  setTempVariation: (variation: Partial<TicketVariation>) => void;
  addVariationToBatch: () => void;
  confirmBatch: () => void;
}

export const EventBatchSection: React.FC<EventBatchSectionProps> = ({
  eventForm, setEventForm, showBatchEditor, setShowBatchEditor,
  tempBatch, setTempBatch, tempVariation, setTempVariation,
  addVariationToBatch, confirmBatch
}) => {
  
  const removeBatch = (id: string) => {
    setEventForm({
      ...eventForm,
      batches: eventForm.batches.filter((b: TicketBatch) => b.id !== id)
    });
  };

  return (
    <div className="space-y-8 p-8 bg-zinc-950 border border-white/5 rounded-[3rem] shadow-inner">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-[#d4af37]">02. LOTES & INGRESSOS</h3>
          <p className="text-lg font-serif italic text-white">Inventário de Vendas</p>
        </div>
        <button 
          onClick={() => setShowBatchEditor(true)}
          className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
        >
          Criar Lote
        </button>
      </div>

      <div className="space-y-4">
        {eventForm.batches && eventForm.batches.length > 0 ? (
          eventForm.batches.map((batch: TicketBatch) => (
            <div key={batch.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl space-y-4 relative group">
               <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{batch.name}</span>
                     <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Válido até: {batch.validUntil} • {batch.validUntilTime}</span>
                  </div>
                  <button onClick={() => removeBatch(batch.id)} className="text-red-900/40 hover:text-red-500 transition-colors p-2">
                    <ICONS.Trash className="w-4 h-4" />
                  </button>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  {batch.variations.map(v => (
                    <div key={v.id} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                       <span className="text-[8px] font-black text-zinc-300 uppercase">{v.area} • {v.gender}</span>
                       <span className="text-[8px] font-black text-[#d4af37]">R$ {v.price}</span>
                    </div>
                  ))}
               </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center opacity-20 border border-dashed border-white/5 rounded-2xl">
            <p className="text-[8px] font-black uppercase">Nenhum lote configurado.</p>
          </div>
        )}
      </div>

      {/* Editor Modal Overlay */}
      {showBatchEditor && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
           <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[3rem] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="text-center space-y-2">
                 <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">CONFIGURAÇÃO DE LOTE</span>
                 <h3 className="text-2xl font-serif italic text-white uppercase">Novo Inventário</h3>
              </div>

              <div className="space-y-4">
                 <input 
                   type="text" 
                   value={tempBatch.name} 
                   onChange={e => setTempBatch({...tempBatch, name: e.target.value})}
                   placeholder="NOME DO LOTE (EX: PRÉ-VENDA)" 
                   className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none" 
                 />
                 <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={tempBatch.validUntil} 
                      onChange={e => setTempBatch({...tempBatch, validUntil: e.target.value})}
                      className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none" 
                    />
                    <input 
                      type="time" 
                      value={tempBatch.validUntilTime} 
                      onChange={e => setTempBatch({...tempBatch, validUntilTime: e.target.value})}
                      className="w-24 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none text-center" 
                    />
                 </div>
              </div>

              <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl space-y-4">
                 <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block text-center">ADICIONAR VARIAÇÃO</span>
                 <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={tempVariation.area} 
                      onChange={e => setTempVariation({...tempVariation, area: e.target.value})}
                      className="bg-black border border-white/5 rounded-xl p-3 text-[8px] text-white uppercase outline-none"
                    >
                       {['Pista', 'VIP', 'Camarote', 'Backstage'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                    </select>
                    <select 
                      value={tempVariation.gender} 
                      onChange={e => setTempVariation({...tempVariation, gender: e.target.value})}
                      className="bg-black border border-white/5 rounded-xl p-3 text-[8px] text-white uppercase outline-none"
                    >
                       {['Unisex', 'Masculino', 'Feminino'].map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                    </select>
                    <input 
                      type="number" 
                      placeholder="PREÇO R$" 
                      value={tempVariation.price || ''} 
                      onChange={e => setTempVariation({...tempVariation, price: parseFloat(e.target.value)})}
                      className="bg-black border border-white/5 rounded-xl p-3 text-[8px] text-white uppercase outline-none" 
                    />
                    <input 
                      type="number" 
                      placeholder="QTD LIMIT" 
                      value={tempVariation.limit || ''} 
                      onChange={e => setTempVariation({...tempVariation, limit: parseInt(e.target.value)})}
                      className="bg-black border border-white/5 rounded-xl p-3 text-[8px] text-white uppercase outline-none" 
                    />
                 </div>
                 <button onClick={addVariationToBatch} className="w-full py-3 bg-white text-black text-[8px] font-black uppercase rounded-full">Adicionar Variação</button>
                 
                 {/* Lista de Variações Temporárias */}
                 <div className="space-y-2">
                    {(tempBatch.variations || []).map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-[8px] text-zinc-400 border-b border-white/5 pb-1">
                         <span>{v.area} / {v.gender}</span>
                         <span>R$ {v.price} ({v.limit} un)</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={confirmBatch} className="flex-1 py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-full shadow-xl active:scale-95">Confirmar Lote</button>
                 <button onClick={() => setShowBatchEditor(false)} className="px-8 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase rounded-full">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
