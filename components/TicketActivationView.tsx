import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { getEventById } from '../lib/inviteHelper';
import { issueComplimentaryTicket } from '../lib/ticketsApi';
import { ICONS } from '../constants';

interface TicketActivationViewProps {
  eventId: string;
  promoterId: string;
  onSuccess: () => void;
}

export const TicketActivationView: React.FC<TicketActivationViewProps> = ({ eventId, promoterId, onSuccess }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', cpf: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEventById(eventId).then(data => {
      setEvent(data);
      setLoading(false);
    });
  }, [eventId]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.length < 5 || formData.cpf.length !== 11) {
      setError("Preencha o nome completo e o CPF (11 dígitos).");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const result = await issueComplimentaryTicket({
        eventId,
        promoterId,
        guestName: formData.name,
        guestCpf: formData.cpf
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Falha na conexão com o protocolo VANTA.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Autenticando Convite...</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-500">
      <div className="relative w-full aspect-square md:aspect-video">
        <img src={event.image} className="w-full h-full object-cover brightness-[0.3]" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
           <span className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.6em] mb-4">CONVITE EXCLUSIVO</span>
           <h1 className="text-5xl font-serif italic text-white uppercase tracking-tighter leading-none">{event.title}</h1>
        </div>
      </div>

      <div className="px-10 -mt-10 relative z-10 space-y-10">
        <div className="p-8 bg-zinc-950 border border-white/10 rounded-[3rem] shadow-2xl space-y-8">
           <div className="text-center space-y-2">
             <h3 className="text-white text-xl font-serif italic">Ativar Acesso VIP</h3>
             <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-relaxed">
               ESTE CONVITE É NOMINAL E INTRANSFERÍVEL.<br/>IDENTIFICAÇÃO OBRIGATÓRIA NA PORTARIA.
             </p>
           </div>

           <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Nome Completo</label>
                 <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white text-[10px] uppercase outline-none focus:border-[#d4af37]/30"
                  placeholder="EX: GABRIEL OLIVEIRA SILVA"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">CPF (Somente números)</label>
                 <input 
                  required
                  maxLength={11}
                  value={formData.cpf}
                  onChange={e => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white text-[10px] uppercase outline-none focus:border-[#d4af37]/30"
                  placeholder="00011122233"
                 />
              </div>

              {error && (
                <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-2xl animate-in slide-in-from-top duration-300">
                  <p className="text-[8px] text-red-500 font-black uppercase text-center leading-relaxed">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full py-6 bg-white text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-30"
              >
                {isProcessing ? "Validando Protocolo..." : "Ativar Ingresso Cortesia"}
              </button>
           </form>
        </div>

        <div className="p-8 bg-zinc-900/40 border border-dashed border-white/10 rounded-[2.5rem] text-center">
           <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em] leading-loose">
             LIMITE DE 2 CONVITES POR CPF.<br/>VANTA LIFESTYLE © 2025
           </p>
        </div>
      </div>
    </div>
  );
};