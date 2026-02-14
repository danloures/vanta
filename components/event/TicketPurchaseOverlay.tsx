
import React from 'react';
import { TicketBatch, TicketVariation } from '../../types';
import { ICONS } from '../../constants';
import { vantaFeedback } from '../../lib/feedbackStore';

interface TicketPurchaseOverlayProps {
  batches: TicketBatch[];
  salesCounts: Record<string, number>;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (variation: TicketVariation) => void;
}

export const TicketPurchaseOverlay: React.FC<TicketPurchaseOverlayProps> = ({ 
  batches, salesCounts, isLoading, onClose, onConfirm 
}) => {

  const handlePurchase = (variant: TicketVariation) => {
    vantaFeedback.confirm({
      title: 'Aquisição de Acesso',
      message: 'Confirmar compra?',
      confirmLabel: 'Sim, Confirmar',
      onConfirm: () => onConfirm(variant)
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-end animate-in fade-in duration-300">
       <div className="w-full bg-zinc-950 rounded-t-[3.5rem] border-t border-white/10 p-10 space-y-10 animate-in slide-in-from-bottom duration-500 max-h-[80vh] overflow-y-auto no-scrollbar">
          <header className="flex justify-between items-center">
             <div className="flex flex-col gap-1">
                <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">CATEGORIAS DISPONÍVEIS</span>
                <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Escolha seu Acesso</h3>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
               <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current rotate-45"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
             </button>
          </header>

          <div className="space-y-4">
             {batches.map(batch => (
               <div key={batch.id} className="space-y-3">
                  <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">{batch.name}</span>
                  <div className="grid grid-cols-1 gap-3">
                     {batch.variations.map(variant => {
                        const sold = salesCounts[variant.id] || 0;
                        const remaining = variant.limit - sold;
                        const isSoldOut = remaining <= 0;
                        
                        return (
                          <button
                            key={variant.id}
                            disabled={isSoldOut || isLoading}
                            onClick={() => handlePurchase(variant)}
                            className={`p-6 rounded-[2.5rem] border text-left flex items-center justify-between transition-all group ${isSoldOut ? 'bg-zinc-950 border-white/5 opacity-40 grayscale' : 'bg-zinc-900/60 border-white/5 hover:border-[#d4af37]/30 hover:bg-zinc-900 active:scale-[0.98]'}`}
                          >
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{variant.area}</h4>
                                  <span className="text-[7px] text-zinc-500 uppercase font-black">● {variant.gender}</span>
                               </div>
                               <span className="text-[9px] text-[#d4af37] font-black uppercase tracking-widest">
                                 {isSoldOut ? 'ESGOTADO' : `R$ ${variant.price.toLocaleString('pt-BR')}`}
                               </span>
                            </div>
                            {!isSoldOut && (
                              <div className="flex flex-col items-end gap-1">
                                 <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ICONS.Plus className="w-4 h-4" />
                                 </div>
                                 <span className="text-[6px] text-zinc-700 font-black uppercase">Últimas {remaining} vagas</span>
                              </div>
                            )}
                          </button>
                        );
                     })}
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};
