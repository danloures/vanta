
import React from 'react';

interface AuthRecoveryProps {
  recoveryEmail: string;
  setRecoveryEmail: (val: string) => void;
  recoverySent: boolean;
  loginError: string | null;
  isProcessing: boolean;
  onRecover: (e: React.FormEvent) => void;
  onSetView: (view: 'form') => void;
}

export const AuthRecovery: React.FC<AuthRecoveryProps> = ({
  recoveryEmail, setRecoveryEmail, recoverySent, loginError, isProcessing, onRecover, onSetView
}) => {
  return (
    <div className="w-full max-sm px-8 py-10 animate-in fade-in duration-500">
      <h1 className="text-4xl font-serif font-bold text-white text-center mb-8 italic uppercase tracking-tighter">Recuperar Acesso</h1>
      
      {!recoverySent ? (
        <form onSubmit={onRecover} className="space-y-6">
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] text-center mb-4 leading-relaxed">
            Insira o e-mail cadastrado para receber o protocolo de redefinição de acesso.
          </p>
          <input 
            required 
            type="email" 
            value={recoveryEmail} 
            onChange={(e) => setRecoveryEmail(e.target.value)} 
            placeholder="E-MAIL" 
            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white text-[10px] uppercase outline-none focus:border-white/20 transition-all" 
          />
          {loginError && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center animate-pulse">{loginError}</p>}
          <button 
            disabled={isProcessing} 
            className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Enviando...' : 'Enviar Protocolo'}
          </button>
          <button 
            type="button" 
            onClick={() => onSetView('form')} 
            className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest"
          >
            Voltar ao Login
          </button>
        </form>
      ) : (
        <div className="space-y-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center mx-auto text-[#d4af37]">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
          </div>
          <div className="space-y-4">
            <p className="text-white text-[11px] font-black uppercase tracking-widest leading-relaxed">
              instrução de recuperação enviado.
            </p>
            <p className="text-zinc-500 text-[9px] font-medium uppercase tracking-[0.2em] leading-relaxed">
              Verifique sua caixa de entrada para recuperar seu acesso ao VANTA.
            </p>
          </div>
          <button 
            onClick={() => onSetView('form')} 
            className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all"
          >
            OK, ENTENDI
          </button>
        </div>
      )}
    </div>
  );
};
