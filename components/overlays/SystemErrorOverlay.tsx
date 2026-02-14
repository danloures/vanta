
import React from 'react';

interface SystemErrorOverlayProps {
  error: string | null;
  onDismiss: () => void;
}

export const SystemErrorOverlay: React.FC<SystemErrorOverlayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-zinc-950 border border-red-900/30 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-[0_0_100px_rgba(220,38,38,0.2)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        
        <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center relative">
          <span className="text-3xl">⚠️</span>
        </div>

        <div className="space-y-4">
           <h2 className="text-2xl font-serif italic text-white uppercase tracking-tighter leading-tight">
             Interrupção de Sistema
           </h2>
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] leading-relaxed break-words">
             {error}
           </p>
        </div>

        <div className="w-full space-y-3">
           <button 
             onClick={() => window.location.reload()}
             className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all hover:bg-zinc-200"
           >
             Reiniciar VANTA
           </button>
           
           <button 
             onClick={onDismiss}
             className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors"
           >
             Ignorar e Tentar Continuar
           </button>
        </div>
        
        <div className="absolute bottom-4">
            <span className="text-[6px] text-red-900/40 font-mono">ERR_CODE: VANTA_DEADLOCK_PREVENTION</span>
        </div>
      </div>
    </div>
  );
};
