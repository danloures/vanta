
import React from 'react';

interface AuthLandingProps {
  hasActiveSession: boolean;
  isProcessing: boolean;
  onContinueAsMember: () => void;
  onSignOut: () => void;
  onSetView: (view: 'form' | 'signup' | 'recovery' | 'redefine') => void;
  onClose?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  hasActiveSession,
  isProcessing,
  onContinueAsMember,
  onSignOut,
  onSetView,
  onClose
}) => {
  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-1000 relative">
      {/* Botão de Fechamento para Visitantes */}
      <button 
        onClick={onClose}
        className="absolute top-12 right-8 p-4 text-zinc-500 hover:text-white transition-colors z-20"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>

      <div className="flex-1" />
      <div className="flex-none flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-serif font-bold text-white italic mb-4">VANTA</h1>
        <p className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.7em]">estilo de vida é acesso.</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 safe-bottom">
        <div className="space-y-3 w-[280px]">
          {hasActiveSession ? (
            <>
              <button 
                onClick={onContinueAsMember} 
                className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-transform"
              >
                Continuar como Membro
              </button>
              <button 
                onClick={onSignOut}
                disabled={isProcessing}
                className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest"
              >
                {isProcessing ? "Encerrando..." : "Sair"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onSetView('form')} className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-transform">Entrar</button>
              <button onClick={() => onSetView('signup')} className="w-full py-5 bg-transparent border border-white/10 text-white font-black rounded-full uppercase text-[9px] tracking-widest active:scale-95 transition-all">Solicitar Acesso</button>
              
              <button 
                onClick={onClose}
                className="w-full py-4 text-zinc-700 text-[8px] font-black uppercase tracking-[0.3em] hover:text-zinc-500 transition-colors mt-4"
              >
                Explorar como Convidado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
