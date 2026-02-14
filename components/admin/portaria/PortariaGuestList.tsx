
import React, { useState } from 'react';
import { GuestEntry, GuestListRule } from '../../../types';
import { ICONS } from '../../../constants';
import { toggleGuestPriority } from '../../../lib/guestListApi';

interface PortariaGuestListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredGuests: GuestEntry[];
  isPromoter: boolean;
  isSocio: boolean;
  canCheckIn: boolean;
  handleCheckIn: (guest: GuestEntry) => void;
  bulkText?: string;
  setBulkText?: (val: string) => void;
  selectedRuleId?: string;
  setSelectedRuleId?: (val: string) => void;
  handleBulkAddGuests?: () => void;
  availableRules?: GuestListRule[];
}

export const PortariaGuestList: React.FC<PortariaGuestListProps> = ({
  searchQuery,
  setSearchQuery,
  filteredGuests,
  isPromoter,
  isSocio,
  canCheckIn,
  handleCheckIn,
  bulkText,
  setBulkText,
  selectedRuleId,
  setSelectedRuleId,
  handleBulkAddGuests,
  availableRules = []
}) => {
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [localGuests, setLocalGuests] = useState<GuestEntry[]>([]);

  // Sincroniza estado local para reatividade instantânea do sininho
  const displayGuests = filteredGuests.map(fg => {
    const local = localGuests.find(lg => lg.id === fg.id);
    return local ? { ...fg, notifyOnArrival: local.notifyOnArrival } : fg;
  });

  const handleTogglePriority = async (e: React.MouseEvent, guest: GuestEntry) => {
    e.stopPropagation();
    const success = await toggleGuestPriority(guest.id, !!guest.notifyOnArrival);
    if (success) {
      const updated = { ...guest, notifyOnArrival: !guest.notifyOnArrival };
      setLocalGuests(prev => {
        const other = prev.filter(p => p.id !== guest.id);
        return [...other, updated];
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Gatilho de Adição */}
      {isPromoter && (
        <div className="p-6 bg-zinc-950 border border-[#d4af37]/20 rounded-[2.5rem] space-y-4">
          <div className="flex justify-between items-center px-2">
             <div className="flex flex-col gap-0.5">
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest">MINHA LISTA NOMINAL</h3>
               <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Adicione nomes separando por Enter</p>
             </div>
             <button 
               onClick={() => setShowBulkAdd(!showBulkAdd)}
               className="p-3 bg-white/5 border border-white/10 rounded-full text-[#d4af37] active:scale-90 transition-all"
             >
               <ICONS.Plus className={`w-4 h-4 transition-transform ${showBulkAdd ? 'rotate-45' : ''}`} />
             </button>
          </div>

          {showBulkAdd && (
            <div className="space-y-4 animate-in slide-in-from-top duration-300 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Categoria de Acesso</label>
                <select 
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId?.(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none"
                >
                  <option value="">SELECIONE A REGRA...</option>
                  {availableRules.map(r => (
                    <option key={r.id} value={r.id}>{r.type} {r.gender} ({r.area})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Nomes da Lista</label>
                <textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText?.(e.target.value)}
                  placeholder="NOME COMPLETO 1&#10;NOME COMPLETO 2..."
                  className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] p-6 text-[10px] text-white uppercase outline-none h-40 resize-none"
                />
              </div>

              <button 
                onClick={handleBulkAddGuests}
                disabled={!selectedRuleId || !bulkText?.trim()}
                className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all"
              >
                Protocolar Nomes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isPromoter ? "BUSCAR EM MEUS CONVIDADOS..." : "BUSCAR NOME NA LISTA GERAL..."}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-full py-5 pl-14 pr-6 text-[10px] text-white uppercase outline-none"
        />
      </div>

      {/* Listagem */}
      <div className="space-y-3">
        {displayGuests.length > 0 ? displayGuests.map(guest => (
          <div 
            key={guest.id} 
            className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
              guest.checkedIn ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-zinc-900 border-white/5'
            }`}
          >
            <div className="flex-1 min-w-0 flex items-center gap-4">
              {/* Botão de Prioridade (Sininho) */}
              <button 
                onClick={(e) => handleTogglePriority(e, guest)}
                className={`transition-all active:scale-75 ${guest.notifyOnArrival ? 'text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'text-zinc-800'}`}
                title={guest.notifyOnArrival ? "Aviso de chegada ativado" : "Ativar aviso de chegada"}
              >
                <ICONS.Bell className={`w-4 h-4 ${guest.notifyOnArrival ? 'fill-current' : 'stroke-current'}`} />
              </button>

              <div className="min-w-0">
                <h4 className={`text-[11px] font-black uppercase tracking-widest truncate ${guest.checkedIn ? 'text-emerald-500' : 'text-white'}`}>
                  {guest.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {!isPromoter && <span className="text-[7px] text-zinc-600 font-black uppercase">POR: {guest.addedByEmail.split('@')[0]}</span>}
                  {guest.checkedIn && (
                    <span className="text-[6px] text-emerald-500/60 font-black uppercase">
                      ENTRADA: {new Date(guest.checkInTime!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!guest.checkedIn ? (
              canCheckIn ? (
                <button 
                  onClick={() => handleCheckIn(guest)}
                  className="px-6 py-3 bg-white text-black text-[8px] font-black uppercase rounded-full shadow-xl"
                >
                  Confirmar
                </button>
              ) : (
                <div className="px-4 py-2 border border-white/5 rounded-xl opacity-30">
                   <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest italic">Aguardando</span>
                </div>
              )
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              </div>
            )}
          </div>
        )) : (
          <div className="py-20 text-center opacity-20 border border-dashed border-white/10 rounded-[3rem]">
            <p className="text-[9px] font-black uppercase tracking-widest">Nenhum nome encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
