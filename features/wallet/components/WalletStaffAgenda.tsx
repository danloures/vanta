
import React, { useState } from 'react';
import { Event, StaffMember, User } from '../../../types';
import { dropComplimentaryTicket } from '../../../lib/ticketsApi';
import { VantaUserPicker } from '../../../components/VantaUserPicker';
import { MemberProfile } from '../../../lib/membersApi';
import { vantaFeedback } from '../../../lib/feedbackStore';

interface WalletStaffAgendaProps {
  staffEvents: Event[];
  currentUser: User;
  onGenerateInvite: (eventId: string) => void;
  onConfirmPresence: (eventId: string) => void;
}

export const WalletStaffAgenda: React.FC<WalletStaffAgendaProps> = ({
  staffEvents,
  currentUser,
  onGenerateInvite,
  onConfirmPresence
}) => {
  const [showDropModal, setShowDropModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenDrop = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowDropModal(true);
  };

  const handleUserSelect = async (user: MemberProfile) => {
    if (!selectedEventId) return;
    setIsProcessing(true);
    try {
      const result = await dropComplimentaryTicket({
        eventId: selectedEventId,
        promoterId: currentUser.id,
        targetUserId: user.id
      });

      if (result.success) {
        vantaFeedback.toast('success', 'Convite Enviado', `O acesso VIP já está na carteira de ${user.full_name?.split(' ')[0]}.`);
        setShowDropModal(false);
        setSelectedEventId(null);
      } else {
        vantaFeedback.toast('error', 'Protocolo Negado', result.message || 'Falha ao enviar convite.');
      }
    } catch (err) {
      vantaFeedback.toast('error', 'Falha de Rede', 'Não foi possível concluir o Direct Drop.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500">
       <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-4">
          <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic text-center block">MINHAS ESCALAS PROTOCOLADAS</span>
          <div className="grid grid-cols-1 gap-4">
            {staffEvents.map(event => {
              const myAssignment = event.staff.find((s: StaffMember) => s.id === currentUser.id);
              const isConfirmed = myAssignment?.status === 'CONFIRMED';
              
              const vipTotal = myAssignment?.vipQuota || 0;
              const vipUsed = (event as any).vipUsed || 0;
              const vipEntered = (event as any).vipEntered || 0;
              const vipRemaining = Math.max(0, vipTotal - vipUsed);

              return (
                <div key={event.id} className={`p-6 rounded-[2.5rem] border transition-all ${isConfirmed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900 border-[#d4af37]/20 shadow-xl scale-[1.02]'}`}>
                  <div className="flex justify-between items-start mb-4">
                     <div className="space-y-1">
                        <h4 className="text-white text-[12px] font-black uppercase tracking-widest">{event.title}</h4>
                        <p className="text-zinc-500 text-[8px] font-black uppercase">{event.startDate} • {event.startTime}</p>
                     </div>
                     <span className={`px-2 py-1 rounded-full text-[6px] font-black uppercase ${isConfirmed ? 'bg-emerald-500 text-black' : 'bg-[#d4af37] text-black animate-pulse'}`}>
                       {isConfirmed ? 'CONFIRMADO ✓' : 'PENDENTE'}
                     </span>
                  </div>

                  {isConfirmed && vipTotal > 0 && (
                    <div className="p-4 bg-black/60 rounded-2xl border border-[#d4af37]/20 mb-4 space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[7px] text-white font-black uppercase tracking-widest">Cota Cortesia VIP</span>
                          <span className="text-[10px] text-white font-black">{vipUsed}/{vipTotal}</span>
                       </div>
                       <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-[#d4af37]" style={{ width: `${(vipUsed/vipTotal)*100}%` }}></div>
                       </div>
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[6px] text-zinc-500 uppercase font-black">{vipEntered} convidados entraram</p>
                            <p className="text-[6px] text-emerald-500 uppercase font-black">{vipRemaining} envios livres</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenDrop(event.id)} disabled={vipRemaining === 0} className="px-4 py-2 bg-zinc-800 text-white text-[7px] font-black uppercase rounded-full border border-white/10 active:scale-95 disabled:opacity-20">Enviar Direto</button>
                            <button onClick={() => onGenerateInvite(event.id)} disabled={vipRemaining === 0} className="px-4 py-2 bg-white text-black text-[7px] font-black uppercase rounded-full shadow-lg active:scale-95 disabled:opacity-20">Gerar Link</button>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6 p-3 bg-black/40 rounded-2xl border border-white/5">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">👔</div>
                     <div className="flex flex-col"><span className="text-[6px] text-zinc-600 font-black uppercase">Função</span><span className="text-[9px] text-white font-black uppercase">{myAssignment?.role}</span></div>
                  </div>
                  {!isConfirmed && <button onClick={() => onConfirmPresence(event.id)} className="w-full py-4 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all">Confirmar Presença na Noite</button>}
                </div>
              );
            })}
          </div>
       </div>

       {showDropModal && (
         <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="w-full max-sm bg-zinc-950 border border-white/10 rounded-[3rem] p-8 space-y-6 shadow-2xl">
               <div className="text-center space-y-2">
                  <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">DIRECT DROP</span>
                  <h3 className="text-xl font-serif italic text-white uppercase">Enviar VIP</h3>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">O ingresso será enviado diretamente para a carteira.</p>
               </div>
               {isProcessing ? <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div> : <VantaUserPicker onSelect={handleUserSelect} placeholder="BUSCAR MEMBRO..." label="Destinatário" />}
               <button onClick={() => { setShowDropModal(false); setSelectedEventId(null); }} className="w-full py-4 text-zinc-600 text-[8px] font-black uppercase tracking-widest" disabled={isProcessing}>Cancelar</button>
            </div>
         </div>
       )}
    </div>
  );
};
