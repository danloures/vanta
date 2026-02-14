
import React from 'react';

interface AuthLoginProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loginError: string | null;
  isProcessing: boolean;
  onLogin: (e: React.FormEvent) => void;
  onSetView: (view: 'landing' | 'recovery') => void;
  onBack: () => void;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({
  email, setEmail, password, setPassword, loginError, isProcessing, onLogin, onSetView, onBack
}) => {
  return (
    <div className="w-full max-sm px-8 py-10 animate-in fade-in duration-500">
      <h1 className="text-4xl font-serif font-bold text-white text-center mb-12 italic">VANTA</h1>
      <form onSubmit={onLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <input 
              required 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="SEU E-MAIL CADASTRADO" 
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white text-[10px] uppercase outline-none focus:border-white/20 transition-all" 
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-2">
            <input 
              required 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="SENHA" 
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-white text-[10px] uppercase outline-none focus:border-white/20 transition-all" 
              disabled={isProcessing}
            />
            <div className="flex justify-end px-2">
              <button 
                type="button" 
                onClick={() => onSetView('recovery')} 
                className="text-[8px] text-zinc-500 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>
        </div>

        {loginError && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center animate-pulse">{loginError}</p>}
        
        <button 
          disabled={isProcessing} 
          className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? 'Entrando...' : 'Entrar'}
        </button>

        <button 
          type="button" 
          onClick={onBack} 
          className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest"
        >
          Voltar
        </button>
      </form>
    </div>
  );
};
