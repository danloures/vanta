
import React from 'react';

interface EventActionPanelProps {
  isRestricted: boolean;
  isConfirmed: boolean;
  onShowTickets: () => void;
  onViewTicket: () => void;
}

export const EventActionPanel: React.FC<EventActionPanelProps> = ({ 
  isRestricted, isConfirmed, onShowTickets, onViewTicket 
}) => {
  return (
    <div className="pt-4">
       {isRestricted ? (
         <div className="p-8 bg-zinc-950 border border-red-900/20 rounded-[2.5rem] text-center space-y-4">
            <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em]">Protocolo Interrompido</span>
            <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest leading-relaxed italic">
               "MEMBRO SOB JURISDIÇÃO DO CONSELHO. AS FUNÇÕES DE AQUISIÇÃO E RSVP FORAM SUSPENSAS POR TEMPO INDETERMINADO."
            </p>
         </div>
       ) : isConfirmed ? (
         <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black">
               <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
            <div>
               <h3 className="text-white text-[11px] font-black uppercase tracking-widest">Sua Presença está Confirmada</h3>
               <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mt-1">Acesso disponível na sua carteira digital.</p>
            </div>
            <button onClick={onViewTicket} className="text-[8px] text-zinc-700 font-black uppercase tracking-widest border-b border-zinc-800 pb-1">Ver Ticket na Carteira</button>
         </div>
       ) : (
         <button 
           onClick={onShowTickets}
           className="w-full py-6 bg-white text-black text-[12px] font-black uppercase rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
         >
           Garantir Acesso
         </button>
       )}
    </div>
  );
};
