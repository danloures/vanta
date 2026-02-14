
import React, { useEffect, useState } from 'react';
import { Event } from '../types';
import { getEventById } from '../lib/inviteHelper';

interface InviteViewProps {
  eventId: string;
  initialEvent?: Event | null;
  onOpenApp: (eventId: string) => void;
}

export const InviteView: React.FC<InviteViewProps> = ({ eventId, onOpenApp, initialEvent }) => {
  const [event, setEvent] = useState<Event | null>(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Só busca se o evento não foi passado via prop (ex: link direto sem cache global)
    if (!initialEvent) {
      getEventById(eventId).then(data => {
        setEvent(data);
        setLoading(false);
      });
    } else {
      setEvent(initialEvent);
      setLoading(false);
    }
  }, [eventId, initialEvent]);

  const handleCopy = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 space-y-4 z-[3000]">
        <div className="w-12 h-12 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Carregando Convite...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center space-y-6 z-[3000]">
        <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter">Evento não encontrado</h2>
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-loose">A sessão pode ter expirado ou o link é inválido.</p>
        <button 
          onClick={() => onOpenApp(eventId)} 
          className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase rounded-full active:scale-95 transition-all shadow-xl"
        >
          Voltar ao App
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto no-scrollbar pb-32 z-[3000] animate-in fade-in duration-500">
      <div className="relative w-full aspect-square">
        <img src={event.image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      </div>

      <div className="px-10 -mt-20 relative z-10 space-y-10 text-center">
        <div className="space-y-4">
          <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.5em] italic">Você foi convidado</p>
          <h1 className="text-5xl font-serif italic text-white tracking-tighter leading-none uppercase">{event.title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl">
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest block mb-1">Data</span>
            <span className="text-[11px] text-white font-black uppercase">{event.startDate}</span>
          </div>
          <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl">
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest block mb-1">Cidade</span>
            <span className="text-[11px] text-white font-black uppercase">{event.city}</span>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => onOpenApp(event.id)} 
            className="w-full py-6 bg-white text-black font-black rounded-full uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all"
          >
            Abrir Sessão
          </button>
          <button 
            onClick={handleCopy} 
            className="w-full py-5 bg-transparent border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full active:scale-95 transition-all"
          >
            {copied ? "Copiado!" : "Copiar Link"}
          </button>
        </div>

        <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest leading-loose">VANTA CLUBE PRIVADO • ACESSO RESTRITO</p>
      </div>
    </div>
  );
};
