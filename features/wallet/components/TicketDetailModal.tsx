
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketDetailModalProps {
  selectedTicket: any | null;
  ticketToValidate: any | null;
  validationData: { name: string; cpf: string };
  setValidationData: (data: { name: string; cpf: string }) => void;
  isValidating: boolean;
  onCloseSelection: () => void;
  onCloseValidation: () => void;
  onValidationSubmit: (e: React.FormEvent) => void;
  isRestricted: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  selectedTicket,
  ticketToValidate,
  validationData,
  setValidationData,
  isValidating,
  onCloseSelection,
  onCloseValidation,
  onValidationSubmit,
  isRestricted
}) => {
  return (
    <>
      {selectedTicket && !isRestricted && (
        <div className="fixed inset-0 z-[9000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={onCloseSelection}>
           <div className="w-full max-sm bg-zinc-950 border border-white/10 rounded-[3.5rem] p-10 flex flex-col items-center text-center space-y-10" onClick={e => e.stopPropagation()}>
              <div className="space-y-4">
                 <h3 className="text-3xl font-serif italic text-white uppercase tracking-tighter">{selectedTicket.events?.title}</h3>
                 {selectedTicket.source === 'complimentary' && (
                   <span className="text-[9px] text-[#d4af37] font-black uppercase tracking-[0.3em] bg-[#d4af37]/10 px-4 py-1.5 rounded-full border border-[#d4af37]/30">CORTESIA EXCLUSIVA</span>
                 )}
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(255,255,255,0.15)] relative">
                <QRCodeSVG value={`VANTA_AUTH:${selectedTicket.hash || selectedTicket.id}`} size={200} />
              </div>
              <div className="space-y-4 w-full">
                <div className="bg-black/60 rounded-3xl p-6 border border-white/5 space-y-2">
                   <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">TITULAR VALIDADO</p>
                   <h4 className="text-white text-lg font-black uppercase tracking-tighter leading-none">{selectedTicket.guest_name}</h4>
                   <p className="text-[#d4af37] text-[10px] font-mono tracking-widest">CPF: ***.{selectedTicket.guest_cpf?.slice(3,6)}.{selectedTicket.guest_cpf?.slice(6,9)}-**</p>
                </div>
                <button onClick={onCloseSelection} className="w-full py-6 bg-white text-black text-[11px] font-black uppercase rounded-full shadow-2xl">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {/* VANTA_VALIDATION: Modal de Titularidade */}
      {ticketToValidate && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95" onClick={onCloseValidation}>
           <div className="w-full max-sm bg-zinc-950 border border-emerald-500/20 rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="text-center space-y-2">
                 <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.5em] italic">ETAPA OBRIGATÓRIA</span>
                 <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Validar Titularidade</h3>
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                   Para liberar o QR Code, confirme os dados de quem usará este ingresso.
                 </p>
              </div>

              <form onSubmit={onValidationSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Nome Completo</label>
                    <input 
                      value={validationData.name}
                      onChange={e => setValidationData({...validationData, name: e.target.value})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-[10px] uppercase outline-none focus:border-emerald-500/30"
                      placeholder="NOME DO TITULAR"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">CPF (Somente Números)</label>
                    <input 
                      value={validationData.cpf}
                      onChange={e => setValidationData({...validationData, cpf: e.target.value.replace(/\D/g, '').slice(0,11)})}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-[10px] uppercase outline-none focus:border-emerald-500/30"
                      placeholder="00011122233"
                    />
                 </div>
                 <button 
                   disabled={isValidating}
                   className="w-full py-6 bg-emerald-500 text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-50 mt-4"
                 >
                   {isValidating ? "Validando..." : "Confirmar e Gerar QR"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </>
  );
};
