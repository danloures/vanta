
import React from 'react';
import { TicketTransfer } from '../../../types';

interface WalletTicketListProps {
  tickets: any[];
  pendingGifts: TicketTransfer[];
  isRestricted: boolean;
  onGiftResponse: (id: string, action: 'accept' | 'return') => void;
  onOpenTicket: (ticket: any) => void;
  onStartTransfer: (ticket: any) => void;
}

export const WalletTicketList: React.FC<WalletTicketListProps> = ({
  tickets,
  pendingGifts,
  isRestricted,
  onGiftResponse,
  onOpenTicket,
  onStartTransfer
}) => {
  return (
    <>
      {isRestricted && (
        <div className="p-6 bg-red-600/10 border border-red-600/30 rounded-[2.5rem] flex flex-col items-center text-center gap-2">
           <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">AURA DE RESTRIÇÃO ATIVA</span>
           <p className="text-[9px] text-zinc-400 uppercase leading-relaxed">Seus tickets estão congelados até a resolução do seu dossiê no Conselho de Ética.</p>
        </div>
      )}
      
      {pendingGifts.length > 0 && !isRestricted && (
        <section className="space-y-6">
          <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] px-2 flex items-center gap-2">Protocolos de Entrada</h4>
          {pendingGifts.map(gift => (
            <div key={gift.id} className="p-6 bg-zinc-900/40 border border-[#d4af37]/30 rounded-[2.5rem] flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-white/10 p-0.5 overflow-hidden"><img src={gift.sender?.avatar} className="w-full h-full object-cover rounded-full" /></div>
                <div className="flex-1 min-w-0"><p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">PRESENTE DE {gift.sender?.name.split(' ')[0]}</p><h3 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{gift.event?.title}</h3></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onGiftResponse(gift.id, 'accept')} className="flex-1 py-3 bg-[#d4af37] text-black text-[8px] font-black uppercase rounded-full">Aceitar</button>
                <button onClick={() => onGiftResponse(gift.id, 'return')} className="px-6 py-3 border border-red-500/20 text-red-500 text-[8px] font-black uppercase rounded-full">Devolver</button>
              </div>
            </div>
          ))}
        </section>
      )}
      <section className="space-y-6">
        <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] px-2">Próximas Sessões</h4>
        {tickets.map(ticket => (
          <div key={ticket.id} className={`w-full p-6 bg-zinc-950 border border-white/5 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden ${isRestricted ? 'opacity-50 grayscale' : ''}`}>
            {ticket.source === 'complimentary' && (
              <div className="absolute top-0 right-0 px-4 py-1 bg-[#d4af37] text-black text-[6px] font-black uppercase tracking-widest rotate-0 rounded-bl-xl z-20 shadow-xl">
                CORTESIA - VENDA PROIBIDA
              </div>
            )}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg"><img src={ticket.events?.image} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{ticket.events?.title}</h3>
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mt-1">{ticket.events?.start_date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onOpenTicket(ticket)} 
                className={`flex-[2] py-4 text-[9px] font-black uppercase rounded-full shadow-xl active:scale-95 transition-all ${
                  isRestricted ? 'bg-zinc-800 text-zinc-500 opacity-30' : !ticket.guest_cpf ? 'bg-emerald-500 text-black' : 'bg-white text-black'
                }`}
              >
                {isRestricted ? "Acesso Suspenso" : !ticket.guest_cpf ? "Validar Titularidade" : "Ver QR Code"}
              </button>
              {/* VANTA_SECURITY: Botão de Transferência Condicional */}
              {ticket.events?.isTransferEnabled && (
                <button 
                  onClick={() => onStartTransfer(ticket)} 
                  disabled={isRestricted || !ticket.guest_cpf}
                  className="flex-1 py-4 bg-zinc-900 border border-white/10 text-white text-[9px] font-black uppercase rounded-full active:scale-95 transition-all disabled:opacity-20"
                >
                  Transferir
                </button>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="py-20 text-center opacity-20 border border-dashed border-white/10 rounded-[2.5rem]">
             <p className="text-[8px] font-black uppercase tracking-widest">Sua carteira está vazia.</p>
          </div>
        )}
      </section>
    </>
  );
};
