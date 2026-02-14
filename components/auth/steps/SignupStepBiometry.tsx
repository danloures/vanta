
import React from 'react';
import { SelfieCapture } from '../../SelfieCapture';
import { vantaFeedback } from '../../../lib/feedbackStore';

interface SignupStepBiometryProps {
  signupErrors: Record<string, string>;
  setSignupErrors: (errors: any) => void;
  setSignupStep: (step: number) => void;
  isProcessing: boolean;
  onSignupFinalize: (blob: Blob) => void;
  onBackToLanding: () => void;
}

export const SignupStepBiometry: React.FC<SignupStepBiometryProps> = ({
  signupErrors, setSignupErrors, setSignupStep, isProcessing, onSignupFinalize, onBackToLanding
}) => {

  const handleCaptureConfirm = (blob: Blob) => {
    if (isProcessing) return;
    vantaFeedback.confirm({
      title: 'Finalizar Cadastro',
      message: 'Protocolar sua identidade para curadoria?',
      confirmLabel: 'Sim, Protocolar',
      onConfirm: () => {
        onSignupFinalize(blob);
        vantaFeedback.toast('success', 'Boas Vindas', 'Cadastro concluído com sucesso. Bem vindo ao VANTA');
      }
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in relative">
      {(signupErrors.form || signupErrors.action) && (
        <div className="p-6 bg-red-950/30 border border-red-500/40 rounded-3xl flex flex-col items-center text-center space-y-4 animate-in slide-in-from-top duration-300 ring-1 ring-red-500/20">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-[12px] font-bold">!</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-red-500 text-[9px] font-black uppercase tracking-[0.2em]">Protocolo Interrompido</h4>
            <p className="text-[10px] text-white/90 font-medium leading-relaxed">
              {signupErrors.form}
            </p>
          </div>
          {signupErrors.action && (
            <div className="pt-3 border-t border-red-500/10 w-full space-y-4">
              <div className="space-y-1">
                <span className="text-[7px] text-red-400 font-black uppercase tracking-[0.2em] block">Diagnóstico:</span>
                <p className="text-[8px] text-zinc-400 font-medium italic">
                  {signupErrors.action}
                </p>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => setSignupErrors({})}
                  className="w-full py-3 bg-white/10 border border-white/10 text-white text-[8px] font-black uppercase rounded-full hover:bg-white/20 transition-all"
                >
                  Tentar Novamente
                </button>
                <button 
                  onClick={() => { setSignupErrors({}); setSignupStep(2); }}
                  className="w-full py-3 bg-red-600 text-white text-[8px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
                >
                  Corrigir Dados (E-mail/Insta)
                </button>
                <button 
                  onClick={onBackToLanding}
                  className="w-full py-2 text-zinc-600 text-[7px] font-black uppercase tracking-widest"
                >
                  Abortar Cadastro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {(!signupErrors.form && !signupErrors.action) && (
        <SelfieCapture 
          onCapture={handleCaptureConfirm} 
          onCancel={() => setSignupStep(2)} 
          ctaLabel="Concluir cadastro"
        />
      )}
      
      {(!signupErrors.form && !signupErrors.action) && (
        <button type="button" onClick={() => setSignupStep(2)} className="w-full py-2 text-zinc-700 text-[8px] font-black uppercase tracking-widest">Voltar</button>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-50 rounded-[3rem]">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
          <span className="text-[8px] text-white font-black uppercase tracking-widest animate-pulse">Sincronizando Protocolo...</span>
        </div>
      )}
    </div>
  );
};
