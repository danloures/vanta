
import React from 'react';

interface AuthRedefineProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (val: string) => void;
  loginError: string | null;
  isProcessing: boolean;
  onUpdate: (e: React.FormEvent) => void;
}

export const AuthRedefine: React.FC<AuthRedefineProps> = ({
  newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword, loginError, isProcessing, onUpdate
}) => {
  return (
    <div className="w-full max-sm px-8 py-10 animate-in fade-in duration-500">
      <h1 className="text-4xl font-serif font-bold text-white text-center mb-8 italic uppercase tracking-tighter leading-tight">Redefinição de Protocolo</h1>
      <form onSubmit={onUpdate} className="space-y-4">
        <p className="text-[9px] text-[#d4af37] font-black uppercase tracking-[0.3em] text-center mb-4 italic">
          Sua identidade foi confirmada via token de rede.
        </p>
        <input 
          required 
          type="password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          placeholder="NOVA SENHA" 
          className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white text-[10px] uppercase outline-none focus:border-white/20 transition-all" 
        />
        <input 
          required 
          type="password" 
          value={confirmNewPassword} 
          onChange={(e) => setConfirmNewPassword(e.target.value)} 
          placeholder="CONFIRMAR NOVA SENHA" 
          className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white text-[10px] uppercase outline-none focus:border-white/20 transition-all" 
        />
        {loginError && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center animate-pulse">{loginError}</p>}
        <button 
          disabled={isProcessing} 
          className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? 'Sincronizando...' : 'Atualizar Credenciais'}
        </button>
      </form>
    </div>
  );
};
