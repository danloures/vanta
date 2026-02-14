
import React from 'react';
import { ICONS } from '../../constants';

interface PushPermissionOverlayProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const PushPermissionOverlay: React.FC<PushPermissionOverlayProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-zinc-950 border border-[#d4af37]/30 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
        
        <div className="w-24 h-24 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-[#d4af37]/40 animate-ping opacity-20"></div>
          <ICONS.Bell className="w-10 h-10 text-[#d4af37]" />
        </div>

        <div className="space-y-4">
           <h2 className="text-2xl font-serif italic text-white uppercase tracking-tighter leading-tight">
             Nao perca nada
           </h2>
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] leading-relaxed">
             Ative as notificações para receber convites VIP, novidades, e muito mais em tempo real
           </p>
        </div>

        <div className="w-full space-y-3">
           <button 
             onClick={onAccept}
             className="w-full py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all hover:bg-[#e5c158]"
           >
             Ativar Notificações
           </button>
           
           <button 
             onClick={onDecline}
             className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors"
           >
             Agora não
           </button>
        </div>
      </div>
    </div>
  );
};
