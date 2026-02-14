
import React from 'react';
import { VantaUserPicker } from '../../../components/VantaUserPicker';
import { SelfieCapture } from '../../../components/SelfieCapture';
import { MemberProfile } from '../../../lib/membersApi';

interface GiftTransferFlowProps {
  step: 'IDLE' | 'AUTH' | 'PICK_USER' | 'SELFIE_CHECK' | 'PROCESSING';
  transferAuthPassword: string;
  setTransferAuthPassword: (val: string) => void;
  isProcessingLocal: boolean;
  onAuthSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUserSelect: (user: MemberProfile) => void;
  transferTarget: MemberProfile | null;
  onFinalize: (blob: Blob) => void;
}

export const GiftTransferFlow: React.FC<GiftTransferFlowProps> = ({
  step,
  transferAuthPassword,
  setTransferAuthPassword,
  isProcessingLocal,
  onAuthSubmit,
  onCancel,
  onUserSelect,
  transferTarget,
  onFinalize
}) => {
  return (
    <>
      {step === 'AUTH' && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="w-full max-w-xs space-y-8 text-center">
            <div className="w-16 h-16 rounded-full border border-[#d4af37]/30 flex items-center justify-center mx-auto bg-zinc-900 shadow-xl">
               <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#d4af37]"><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 1 1 6 0v2H9V6z"/></svg>
            </div>
            <div className="space-y-2">
               <h3 className="text-xl font-serif italic text-white uppercase tracking-tighter">Re-autenticação</h3>
               <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                 Confirme sua senha para liberar a transferência segura de acesso.
               </p>
            </div>
            <form onSubmit={onAuthSubmit} className="space-y-4">
              <input 
                type="password" 
                value={transferAuthPassword} 
                onChange={(e) => setTransferAuthPassword(e.target.value)} 
                placeholder="SENHA ATUAL" 
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-center text-white text-[12px] uppercase tracking-[0.5em] outline-none focus:border-[#d4af37]/30" 
              />
              <button disabled={isProcessingLocal || !transferAuthPassword} className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-widest shadow-xl">
                {isProcessingLocal ? "Validando..." : "Confirmar Protocolo"}
              </button>
            </form>
            <button onClick={onCancel} className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {step === 'PICK_USER' && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in slide-in-from-bottom duration-500">
           <div className="w-full max-sm space-y-8">
              <header className="text-center space-y-2">
                 <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">GIFT PROTOCOL: PASSO 1</span>
                 <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Destinatário</h3>
              </header>
              <div className="bg-zinc-950 border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                 <VantaUserPicker 
                  onSelect={onUserSelect} 
                  placeholder="BUSCAR AMIGO PARA PRESENTEAR..."
                  label="Selecionar Membro"
                 />
              </div>
              <button onClick={onCancel} className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest text-center">Abortar Transferência</button>
           </div>
        </div>
      )}

      {step === 'SELFIE_CHECK' && transferTarget && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-500 overflow-y-auto no-scrollbar">
           <div className="w-full max-sm space-y-10 py-10">
              <header className="text-center space-y-2">
                 <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">GIFT PROTOCOL: PASSO 2</span>
                 <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Assinatura Biométrica</h3>
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                   Precisamos de uma selfie rápida para validar que você<br/>está transferindo o acesso a {transferTarget.full_name?.split(' ')[0]}.
                 </p>
              </header>
              <div className="bg-zinc-950 border border-white/5 rounded-[3.5rem] p-10 shadow-2xl">
                 <SelfieCapture 
                  onCapture={onFinalize} 
                  onCancel={onCancel}
                  ctaLabel="Assinar e Enviar"
                 />
              </div>
           </div>
        </div>
      )}

      {step === 'PROCESSING' && (
        <div className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
           <div className="w-12 h-12 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
           <p className="text-[10px] text-white font-black uppercase tracking-[0.4em] animate-pulse">Criptografando Presente...</p>
        </div>
      )}
    </>
  );
};
