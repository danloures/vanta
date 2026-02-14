
import React, { useState, useMemo } from 'react';
import { Event, MemberCuratedLevel, User } from '../../types';
import { sendMassBroadcast } from '../../lib/broadcasterApi';
import { ICONS } from '../../constants';
import { vantaFeedback } from '../../lib/feedbackStore';

interface AdminBroadcasterProps {
  events: Event[];
  currentUser: User;
}

export const AdminBroadcaster: React.FC<AdminBroadcasterProps> = ({ events, currentUser }) => {
  const [selectedLevels, setSelectedLevels] = useState<MemberCuratedLevel[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [actionType, setActionType] = useState<'notification' | 'invite'>('notification');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; count: number } | null>(null);

  const availableCities = useMemo(() => [...new Set(events.map(e => e.city))].sort(), [events]);
  const levels = Object.values(MemberCuratedLevel);

  const toggleLevel = (level: MemberCuratedLevel) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const handleBroadcast = async () => {
    if (!selectedCity || selectedLevels.length === 0 || !message || (actionType === 'invite' && !selectedEventId)) {
      vantaFeedback.toast('warning', 'Dados Incompletos', 'Preencha segmentação e mensagem.');
      return;
    }

    const typeLabel = actionType === 'invite' ? 'Convite VIP' : 'Comunicado';
    
    vantaFeedback.confirm({
      title: 'Disparo em Massa',
      message: `Enviar ${typeLabel} para membros ${selectedLevels.join(', ')} em ${selectedCity}?`,
      confirmLabel: 'Disparar Protocolo',
      onConfirm: async () => {
        setIsProcessing(true);
        const result = await sendMassBroadcast({
          levels: selectedLevels,
          city: selectedCity,
          eventId: selectedEventId,
          actionType,
          message,
          senderId: currentUser.id
        });
        
        setIsProcessing(false);
        setBroadcastResult(result);
      }
    });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">COMANDOS DE ELITE</h3>
        <p className="text-[24px] font-serif italic text-white tracking-tighter uppercase">Broadcaster Master</p>
      </div>

      <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4af37]/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        {/* Segmentação por Nível */}
        <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Segmentar por Curadoria</label>
          <div className="grid grid-cols-2 gap-2">
            {levels.map(level => (
              <button 
                key={level}
                onClick={() => toggleLevel(level)}
                className={`py-4 px-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                  selectedLevels.includes(level) 
                    ? 'bg-white text-black border-white shadow-xl' 
                    : 'bg-zinc-900/50 text-zinc-500 border-white/5'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Localização e Evento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Cidade Alvo</label>
            <select 
              value={selectedCity} 
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20"
            >
              <option value="">SELECIONE A CIDADE</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Vincular Evento</label>
            <select 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20"
            >
              <option value="">SELECIONE O EVENTO</option>
              {events.filter(e => !selectedCity || e.city === selectedCity).map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo de Ação */}
        <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Protocolo de Gatilho</label>
          <div className="flex bg-zinc-900 rounded-full p-1 border border-white/5">
            {[
              { id: 'notification', label: 'COMUNICADO SIMPLES', icon: '📡' },
              { id: 'invite', label: 'CONVITE VIP REAL', icon: '💎' }
            ].map(opt => (
              <button 
                key={opt.id}
                onClick={() => setActionType(opt.id as any)}
                className={`flex-1 py-4 text-[8px] font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 ${
                  actionType === opt.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem */}
        <div className="space-y-2">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Conteúdo do Disparo</label>
          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={actionType === 'invite' ? "EX: VOCÊ FOI SELECIONADA PARA NOSSA NOITE EXCLUSIVA..." : "EX: O BOSQUE BAR ABRE EM 30 MINUTOS..."}
            className="w-full bg-zinc-900 border border-white/5 rounded-3xl p-6 text-[11px] text-white outline-none focus:border-white/20 h-32 resize-none uppercase leading-relaxed"
          />
        </div>

        {/* Console de Impacto */}
        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center space-y-2">
           <span className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.3em]">CONSOLE DE IMPACTO PREVISTO</span>
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
             {selectedLevels.length > 0 && selectedCity 
               ? `ESTE COMANDO SERÁ DISPARADO PARA ${selectedLevels.length} CATEGORIAS EM ${selectedCity.toUpperCase()}`
               : "CONFIGURE OS FILTROS PARA CALCULAR O IMPACTO"}
           </p>
        </div>

        <button 
          onClick={handleBroadcast}
          disabled={isProcessing}
          className="w-full py-6 bg-white text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-30"
        >
          {isProcessing ? "DISPARANDO PROTOCOLO..." : "EXECUTAR BROADCAST"}
        </button>
      </div>

      {broadcastResult && (
        <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center gap-6 animate-in zoom-in-95 duration-500">
           <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black">
             <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
           </div>
           <div className="flex-1">
             <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Broadcast Concluído</h4>
             <p className="text-[8px] text-emerald-500/80 font-black uppercase tracking-widest mt-1">Impacto: {broadcastResult.count} membros notificados.</p>
           </div>
           <button onClick={() => setBroadcastResult(null)} className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Limpar</button>
        </div>
      )}
    </div>
  );
};
