
import React from 'react';
import { BR_DDDS } from '../../../data/brStatesCities';

interface SignupStepContactProps {
  signupData: any;
  setSignupData: (data: any) => void;
  signupErrors: Record<string, string>;
  setSignupErrors: (errors: any) => void;
  handleBlur: (field: string) => void;
  getInputClass: (field: string) => string;
  renderError: (field: string) => React.ReactNode;
  setSignupStep: (step: number) => void;
  isStep2Valid: boolean;
}

export const SignupStepContact: React.FC<SignupStepContactProps> = ({
  signupData, setSignupData, signupErrors, setSignupErrors,
  handleBlur, getInputClass, renderError, setSignupStep, isStep2Valid
}) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSignupStep(3); }} className="space-y-6 animate-in fade-in">
      
      {/* INSTAGRAM */}
      <div className="space-y-2">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.3em] ml-4">Instagram (Sem @)</label>
        <input 
          required 
          value={signupData.instagram} 
          onBlur={() => handleBlur('instagram')}
          onChange={e => {
            setSignupData({...signupData, instagram: e.target.value});
            if(signupErrors.instagram) setSignupErrors({...signupErrors, instagram: ''});
          }} 
          placeholder="SEU.PERFIL" 
          className={getInputClass('instagram')}
        />
        {renderError('instagram')}
      </div>

      {/* EMAIL */}
      <div className="space-y-2">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.3em] ml-4">Email Pessoal</label>
        <input 
          required 
          type="email" 
          value={signupData.email} 
          onBlur={() => handleBlur('email')}
          onChange={e => {
            setSignupData({...signupData, email: e.target.value});
            if(signupErrors.email) setSignupErrors({...signupErrors, email: ''});
          }} 
          placeholder="SEU MELHOR EMAIL" 
          className={getInputClass('email')}
        />
        {renderError('email')}
      </div>

      {/* TELEFONE - UNIFIED CAPSULE DESIGN */}
      <div className="space-y-2">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.3em] ml-4">Contato (WhatsApp)</label>
        
        <div className={`relative w-full bg-zinc-900 border rounded-2xl flex items-center transition-all focus-within:border-[#d4af37]/50 focus-within:bg-zinc-900/80 ${signupErrors.phone ? 'border-red-500/50' : 'border-white/5'}`}>
          
          {/* Seletor de DDD Integrado (Área Esquerda) */}
          <div className="relative flex items-center h-full pl-5 pr-4 border-r border-white/5 group cursor-pointer hover:bg-white/5 transition-colors rounded-l-2xl">
             <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 text-[9px] font-black tracking-widest pointer-events-none">+55</span>
                <span className="text-[#d4af37] text-[11px] font-black tracking-widest pointer-events-none">({signupData.ddd})</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-zinc-700 group-hover:fill-white transition-colors ml-1 pointer-events-none"><path d="M7 10l5 5 5-5z"/></svg>
             </div>
             {/* Seletor Nativo Invisível (Overlay) */}
             <select 
                value={signupData.ddd} 
                onChange={e => setSignupData({...signupData, ddd: e.target.value})} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[16px]" // 16px para evitar zoom no iOS
             >
                {BR_DDDS.map(ddd => <option key={ddd} value={ddd}>{ddd}</option>)}
             </select>
          </div>

          {/* Input de Telefone (Área Direita) */}
          <input 
            required 
            type="tel"
            value={signupData.phone} 
            onBlur={() => handleBlur('phone')}
            onChange={e => {
              setSignupData({...signupData, phone: e.target.value.replace(/\D/g, '').slice(0,9)});
              if(signupErrors.phone) setSignupErrors({...signupErrors, phone: ''});
            }} 
            placeholder="99999-9999" 
            className="flex-1 bg-transparent border-none outline-none text-white text-[11px] font-black uppercase tracking-[0.25em] pl-5 py-5 placeholder:text-zinc-700/50 h-full rounded-r-2xl"
          />
        </div>
        {renderError('phone')}
      </div>

      {/* SENHAS */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-2">
          <input 
            required 
            type="password" 
            value={signupData.password} 
            onBlur={() => handleBlur('password')}
            onChange={e => {
              setSignupData({...signupData, password: e.target.value});
              if(signupErrors.password) setSignupErrors({...signupErrors, password: ''});
            }} 
            placeholder="CRIAR SENHA" 
            className={getInputClass('password')}
          />
          {renderError('password')}
        </div>
        <div className="space-y-2">
          <input 
            required 
            type="password" 
            value={signupData.confirmPassword} 
            onBlur={() => handleBlur('confirmPassword')}
            onChange={e => setSignupData({...signupData, confirmPassword: e.target.value})} 
            placeholder="CONFIRMAR" 
            className={getInputClass('password')}
          />
          {renderError('confirmPassword')}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={!isStep2Valid}
        className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-[0.2em] shadow-xl mt-6 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
      >
        Avançar para Biometria
      </button>
      <button type="button" onClick={() => setSignupStep(1)} className="w-full py-3 text-zinc-600 text-[8px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors">Voltar</button>
    </form>
  );
};
