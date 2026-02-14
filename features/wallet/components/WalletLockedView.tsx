
import React from 'react';

interface WalletLockedViewProps {
  embedMode: boolean;
  lockoutTimestamp: number | null;
  timeLeft: string;
  password: string;
  setPassword: (pass: string) => void;
  isVerifying: boolean;
  onUnlock: (e: React.FormEvent) => void;
}

export const WalletLockedView: React.FC<WalletLockedViewProps> = ({
  embedMode,
  lockoutTimestamp,
  timeLeft,
  password,
  setPassword,
  isVerifying,
  onUnlock
}) => {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500 p-8 relative overflow-hidden ${embedMode ? 'min-h-[400px] w-full bg-zinc-900/10 rounded-[2rem] border border-white/5' : 'bg-black h-full'}`}>
      <div className="w-full max-w-xs space-y-8 text-center relative z-10">
        <div className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${lockoutTimestamp ? 'bg-red-500/10 border-red-500 animate-pulse' : 'bg-zinc-900 border-white/5'}`}>
          <svg viewBox="0 0 24 24" className={`w-8 h-8 ${lockoutTimestamp ? 'fill-red-500' : 'text-[#d4af37] fill-current'}`}><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 1 1 6 0v2H9V6z"/></svg>
        </div>
        <h3 className={`text-2xl font-serif italic uppercase tracking-tighter ${lockoutTimestamp ? 'text-red-500' : 'text-white'}`}>{lockoutTimestamp ? 'Carteira Bloqueada' : 'Acesso Restrito'}</h3>
        {!lockoutTimestamp ? (
          <form onSubmit={onUnlock} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="SENHA DO APP" className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-center text-white text-[12px] uppercase tracking-[0.5em] outline-none" />
            <button disabled={isVerifying || !password} className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-widest">{isVerifying ? "Verificando..." : "Desbloquear"}</button>
          </form>
        ) : (
          <div className="text-3xl font-mono text-red-500 font-black tracking-widest">{timeLeft}</div>
        )}
      </div>
    </div>
  );
};
