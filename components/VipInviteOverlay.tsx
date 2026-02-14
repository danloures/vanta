
import React, { useState } from 'react';
import { Event, User } from '../types';
import { issueTicket } from '../lib/ticketsApi';

interface VipInviteOverlayProps {
  event: Event;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const VipInviteOverlay: React.FC<VipInviteOverlayProps> = ({ event, currentUser, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isFemale = ['female', 'feminino', 'f', 'woman', 'mulher'].includes(currentUser.gender?.toLowerCase() || '');

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      // Emite um ticket de fonte 'benefit' (VIP Grátis)
      await issueTicket({
        userId: currentUser.id,
        eventId: event.id,
        variationId: 'vip_benefit', // ID fixo para convites do Broadcaster
        source: 'benefit'
      });
      onSuccess();
    } catch (err) {
      console.error("[VIP INVITE] Erro ao aceitar convite:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="w-full max-w-sm bg-zinc-950 border border-[#d4af37]/30 rounded-[3.5rem] p-10 flex flex-col items-center text-center space-y-10 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
        
        <div className="space-y-4">
           <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">VOCE É NOSSA (O) CONVIDADO</span>
           <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase leading-tight">
             {currentUser.fullName}, você é {isFemale ? 'nossa convidada' : 'nosso convidado'} especial.
           </h2>
        </div>

        <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 relative">
          <img src={event.image} className="w-full h-full object-cover brightness-50" alt="" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40">
             <h3 className="text-white text-lg font-serif italic uppercase tracking-tighter">{event.title}</h3>
             <p className="text-[8px] text-[#d4af37] font-black uppercase tracking-widest mt-2">{event.startDate} • {event.location}</p>
          </div>
        </div>

        <div className="space-y-4 w-full">
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] leading-loose">
             CURTA {event.title.toUpperCase()} POR NOSSA CONTA.<br/>CONVITE VIP LIBERADO NA CARTEIRA.
           </p>
           
           <button 
             onClick={handleAccept}
             disabled={isProcessing}
             className="w-full py-6 bg-white text-black text-[12px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-50"
           >
             {isProcessing ? "GERANDO ACESSO..." : "GARANTIR CONVITE VIP"}
           </button>
           
           <button 
             onClick={onClose}
             disabled={isProcessing}
             className="text-[9px] text-zinc-700 font-black uppercase tracking-widest hover:text-zinc-500 transition-colors"
           >
             Agora não, obrigado
           </button>
        </div>
      </div>
    </div>
  );
};
