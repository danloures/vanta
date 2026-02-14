
import React, { useState, useEffect } from 'react';
import { Event, User, Community } from '../../types';
import { ICONS } from '../../constants';
import { isEventExpired } from '../../lib/eventsApi';
import { usePortariaLogic } from '../../hooks/usePortariaLogic';
import { fetchMyCommunities } from '../../lib/communitiesApi';

// Sub-componentes Fragmentados
import { PortariaTimeline } from './portaria/PortariaTimeline';
import { PortariaGuestList } from './portaria/PortariaGuestList';
import { PortariaReport } from './portaria/PortariaReport';
import { PortariaScanner } from './portaria/PortariaScanner';

interface AdminPortariaProps {
  events: Event[];
  currentUser: User;
  initialSelectedEventId?: string | null;
}

type PortariaView = 'TIMELINE' | 'SEARCH_LIST' | 'SCANNER' | 'REPORT';

export const AdminPortaria: React.FC<AdminPortariaProps> = ({ events, currentUser, initialSelectedEventId }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<PortariaView>('TIMELINE');
  const [myOwnedCommunities, setMyOwnedCommunities] = useState<string[]>([]);

  const logic = usePortariaLogic(selectedEvent, currentUser);

  useEffect(() => {
    if (initialSelectedEventId) {
      const target = events.find(e => e.id === initialSelectedEventId);
      if (target) setSelectedEvent(target);
    }
  }, [initialSelectedEventId, events]);

  useEffect(() => {
    const loadJurisdiction = async () => {
      const roleLower = currentUser.role.toLowerCase();
      if (['vanta_prod', 'produtor', 'vanta_socio', 'socio'].includes(roleLower)) {
        const comms = await fetchMyCommunities(currentUser.id);
        setMyOwnedCommunities(comms.map(c => c.id));
      }
    };
    loadJurisdiction();
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    if (selectedEvent) {
      if (isEventExpired(selectedEvent)) {
        setViewMode('REPORT');
      } else {
        // Se for staff de portaria, abre direto no scanner
        const isEntryStaff = ['vanta_portaria', 'portaria'].includes(currentUser.role.toLowerCase());
        setViewMode(isEntryStaff ? 'SCANNER' : logic.isPromoter ? 'SEARCH_LIST' : 'TIMELINE');
      }
    }
  }, [selectedEvent?.id, logic.isPromoter, currentUser.role]);

  // VANTA_SYNC: Protocolo de Invisibilidade na Seleção de Portaria
  const activeEvents = events.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    const isDateValid = e.startDate >= today; 
    if (!isDateValid) return false;

    // Master veem tudo
    const isMaster = ['admin', 'master', 'vanta_master'].includes(currentUser.role.toLowerCase());
    if (isMaster) return true;

    // Produtor e Sócio veem eventos das SUAS unidades
    const isUnitAdmin = ['vanta_prod', 'produtor', 'vanta_socio', 'socio'].includes(currentUser.role.toLowerCase());
    if (isUnitAdmin) {
      return myOwnedCommunities.includes(e.communityId);
    }

    // Promoter, Portaria e Staff comum só veem se estiverem vinculados
    return (e.staff || []).some(member => member.id === currentUser.id);
  });

  if (!selectedEvent) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">GESTÃO DE ACESSOS</h3>
          <p className="text-[20px] font-serif italic text-white tracking-tighter">Selecione a Sessão</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeEvents.length > 0 ? activeEvents.map(event => (
            <button 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="w-full p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center gap-5 active:scale-95 transition-all text-left group"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 group-hover:border-[#d4af37]/40 transition-colors">
                <img src={event.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                   <h3 className="text-white text-[11px] font-black uppercase tracking-widest truncate">{event.title}</h3>
                   {isEventExpired(event) && (
                     <span className="text-[6px] px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full font-black uppercase">Encerrado</span>
                   )}
                </div>
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mt-1">{event.startDate} • {event.location}</p>
              </div>
              <ICONS.ArrowLeft className="w-4 h-4 text-[#d4af37] rotate-180" />
            </button>
          )) : (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] bg-zinc-950/20 opacity-30">
              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                {['admin', 'master', 'vanta_master'].includes(currentUser.role.toLowerCase()) 
                  ? "Nenhuma sessão disponível para check-in." 
                  : "Nenhum protocolo ativo vinculado à sua identidade."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-32">
      <header className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <button onClick={() => setSelectedEvent(null)} className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-1 mb-2">
            <ICONS.ArrowLeft className="w-3 h-3" /> Alterar Sessão
          </button>
          <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter leading-none">{selectedEvent.title}</h2>
          <div className="flex items-center gap-3">
             <span className="text-[10px] text-[#d4af37] font-black uppercase">{logic.now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
             <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest italic">{currentUser.role.replace('VANTA_', '')} • Protocolo {selectedEvent.id.substring(0,8)}</span>
          </div>
        </div>
        <button onClick={logic.loadGuests} disabled={logic.isSyncing} className={`p-3 bg-zinc-950 border border-white/5 rounded-full text-[#d4af37] ${logic.isSyncing ? 'animate-spin' : ''}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>
      </header>

      <div className="flex gap-6 border-b border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'TIMELINE', label: 'Timeline', hidden: logic.isPromoter },
          { id: 'SCANNER', label: 'Scanner QR', hidden: !logic.canCheckIn },
          { id: 'SEARCH_LIST', label: 'Lista de Nomes' },
          { id: 'REPORT', label: 'Balanço Final' }
        ].filter(t => !t.hidden).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all relative shrink-0 ${
              viewMode === tab.id ? 'text-[#d4af37]' : 'text-zinc-700'
            }`}
          >
            {tab.label}
            {viewMode === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}
          </button>
        ))}
      </div>

      {viewMode === 'TIMELINE' && (
        <PortariaTimeline 
          filteredTimeline={logic.filteredTimeline}
          genderFilter={logic.genderFilter}
          setGenderFilter={logic.setGenderFilter}
          now={logic.now}
        />
      )}

      {viewMode === 'SCANNER' && (
        <PortariaScanner 
          eventId={selectedEvent.id}
          onSuccess={() => {
            logic.loadGuests(); // Recarrega dados para atualizar relatório e lista
          }}
        />
      )}

      {viewMode === 'SEARCH_LIST' && (
        <PortariaGuestList 
          searchQuery={logic.searchQuery}
          setSearchQuery={logic.setSearchQuery}
          filteredGuests={logic.filteredGuests}
          isPromoter={logic.isPromoter}
          isSocio={logic.isSocio}
          canCheckIn={logic.canCheckIn}
          handleCheckIn={logic.handleCheckIn}
          bulkText={logic.bulkText}
          setBulkText={logic.setBulkText}
          selectedRuleId={logic.selectedRuleId}
          setSelectedRuleId={logic.setSelectedRuleId}
          handleBulkAddGuests={logic.handleBulkAddGuests}
          availableRules={selectedEvent.guestListRules || []}
        />
      )}

      {viewMode === 'REPORT' && (
        <PortariaReport 
          reportData={logic.reportData}
          isPromoter={logic.isPromoter}
          currentUser={currentUser}
        />
      )}

      <div className="pt-10 space-y-4">
        <p className="text-[7px] text-zinc-700 font-black uppercase tracking-[0.4em] text-center italic leading-relaxed">
          VANTA_SECURE: DADOS ISOLADOS POR CONTEXTO E PRIVACIDADE.<br/>ESTA SESSÃO ESTÁ SENDO AUDITADA EM TEMPO REAL.
        </p>
      </div>
    </div>
  );
};
