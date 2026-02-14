
import React, { useState, useRef, useEffect } from 'react';
import { Event, User } from '../../types';
import { ICONS } from '../../constants';
import { useRadarLogic, CITY_CENTERS, RJ_FALLBACK } from '../../hooks/useRadarLogic';

// VANTA_RADAR_FRAGMENTS: Importação de componentes atômicos
import { VantaCalendar } from '../../components/map/VantaCalendar';
import { EventPreviewCard } from '../../components/map/EventPreviewCard';

interface MapFeatureProps {
  events: Event[];
  currentUser?: User | null;
  onRequireAuth?: (featureName?: string) => void;
  onEventClick?: (eventId: string) => void;
}

export const MapFeature: React.FC<MapFeatureProps> = ({ events, currentUser, onRequireAuth, onEventClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const logic = useRadarLogic(events, currentUser);

  // VANTA_RADAR_AUTO_BOOT: Inicialização silenciosa baseada no consentimento prévio
  useEffect(() => {
    if (logic.permissionStatus === 'granted' && mapContainer.current && !logic.mapLoaded) {
      logic.initMap(logic.userCoords || RJ_FALLBACK, mapContainer.current);
    } else if (logic.permissionStatus === 'denied' && mapContainer.current && !logic.mapLoaded) {
      logic.initMap(RJ_FALLBACK, mapContainer.current);
    }
  }, [logic.permissionStatus, logic.mapLoaded]);

  const topDates = (() => {
    const today = new Date(); const tom = new Date(today); tom.setDate(today.getDate() + 1);
    const sat = new Date(today); sat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
    return [{ label: 'Hoje', date: today }, { label: 'Amanhã', date: tom }, { label: 'FDS', date: sat }];
  })();

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const previewEvent = logic.previewEventId ? events.find(e => e.id === logic.previewEventId) : null;
  
  return (
    <div className="flex-1 flex flex-col bg-black h-full relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainer} className="w-full h-full" style={{ background: '#050505' }} />
      </div>

      <div className="absolute top-10 left-0 right-0 z-40 text-center pointer-events-none px-6">
        <h1 className="text-white text-2xl font-serif italic uppercase tracking-tighter drop-shadow-lg">Radar de Eventos</h1>
        <p className="text-[#d4af37] text-[8px] font-black uppercase tracking-[0.4em]">
          {logic.filteredEvents.length} eventos em {logic.selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </p>
      </div>

      <div className="absolute top-24 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex gap-1.5 pointer-events-auto">
          {topDates.map((item, idx) => {
            const isSelected = formatDate(logic.selectedDate) === formatDate(item.date);
            return (
              <button 
                key={idx} 
                onClick={() => logic.handleDateChange(item.date)} 
                className={`flex-1 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                  isSelected ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-black/60 border border-white/10 text-white backdrop-blur-md'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button 
            onClick={() => logic.setShowCalendar(true)} 
            className="flex-1 py-3 bg-black/60 border border-white/10 rounded-2xl text-[7px] font-black uppercase tracking-widest text-zinc-400 backdrop-blur-md"
          >
            Calendário
          </button>
        </div>
      </div>

      <button 
        onClick={logic.recenterMap} 
        className="fixed bottom-[124px] right-4 z-[60] w-12 h-12 bg-black/80 backdrop-blur-xl border border-[#d4af37]/20 rounded-full flex items-center justify-center text-[#d4af37] shadow-2xl active:scale-90 transition-all"
      >
        <ICONS.MapPin className="w-5 h-5" />
      </button>

      {previewEvent && (
        <EventPreviewCard 
          event={previewEvent} 
          isLive={logic.isEventLiveNow(previewEvent)}
          onClose={() => logic.setPreviewEventId(null)}
          onEventClick={(id) => onEventClick?.(id)}
        />
      )}

      {logic.permissionStatus === 'prompt' && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-sm bg-zinc-950 border border-white/10 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-[#d4af37]/20 flex items-center justify-center mx-auto">
              <ICONS.MapPin className="w-8 h-8 text-[#d4af37]" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-serif italic text-white uppercase tracking-tighter leading-none">Fique por dentro</h3>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] leading-loose">
                Ative o GPS para visualizar eventos ao seu redor.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button 
                onClick={() => logic.requestLocation(mapContainer.current)} 
                className="w-full py-6 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-full shadow-xl"
              >
                Permitir
              </button>
              <button 
                onClick={() => { 
                  logic.setPermissionStatus('denied'); 
                  logic.initMap(CITY_CENTERS['Rio de Janeiro'] || RJ_FALLBACK, mapContainer.current); 
                }} 
                className="w-full py-6 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full"
              >
                Agora nao
              </button>
            </div>
          </div>
        </div>
      )}

      {logic.showCalendar && (
        <div className="fixed inset-0 z-[1100] bg-black flex flex-col safe-top animate-in slide-in-from-bottom duration-500">
          <header className="p-8 flex justify-between items-center border-b border-white/5">
            <button onClick={() => logic.setShowCalendar(false)} className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Fechar</button>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Agenda de Eventos</h4>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <VantaCalendar 
              selectedDate={logic.selectedDate} 
              onSelect={(d) => { logic.handleDateChange(d); logic.setShowCalendar(false); }} 
              events={events} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
