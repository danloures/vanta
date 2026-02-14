
import React, { useState, useMemo } from 'react';
import { Event } from '../../types';

interface VantaCalendarProps {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  events: Event[];
}

export const VantaCalendar: React.FC<VantaCalendarProps> = ({ selectedDate, onSelect, events }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  
  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const daysWithEvents = useMemo(() => new Set(events.map(e => { 
    const anyE = e as any; 
    return anyE.startDate ?? anyE.start_date ?? anyE.startDateStr ?? null; 
  })), [events]);

  const formatDateForComparison = (date: Date) => date.toISOString().split('T')[0];
  const isCurrentMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  return (
    <div className="space-y-12">
      <div className="relative flex items-center justify-center min-h-[80px]">
        <button 
          disabled={isCurrentMonth}
          onClick={() => !isCurrentMonth && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} 
          className={`absolute left-0 p-4 transition-all z-20 ${isCurrentMonth ? 'opacity-5 cursor-not-allowed' : 'text-zinc-600 active:scale-90'}`}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 rotate-180 fill-current"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-4xl font-serif italic text-white tracking-tighter">{monthName}</h2>
          <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-[0.4em]">{viewDate.getFullYear()}</span>
        </div>

        <button 
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} 
          className="absolute right-0 p-4 text-zinc-600 active:scale-90 transition-all z-20"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
  <div
    key={`weekday-${i}`}
    className="text-center text-[8px] text-zinc-700 font-black mb-4 uppercase tracking-widest"
  >
    {d}
  </div>
))}

        {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} />))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1; const currDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
          const dateStr = formatDateForComparison(currDate); const hasEvent = daysWithEvents.has(dateStr);
          const isSelected = formatDateForComparison(selectedDate) === dateStr;
          
          const isPast = currDate < today;

          return (
            <button 
              key={d} 
              disabled={isPast} 
              onClick={() => !isPast && onSelect(currDate)} 
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative ${
                isSelected ? 'bg-white text-black shadow-2xl scale-105 z-10' : 
                hasEvent && !isPast ? 'bg-zinc-900 border border-white/5 text-white hover:border-[#d4af37]/30' : 
                'text-zinc-600'
              } ${isPast ? 'opacity-5 cursor-not-allowed saturate-0 pointer-events-none' : 'active:scale-90 hover:bg-zinc-800'}`}
            >
              <span className={`text-[11px] font-black ${isPast ? 'line-through decoration-zinc-800' : ''}`}>{d}</span>
              {hasEvent && !isSelected && !isPast && (<div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-pulse"></div>)}
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-zinc-900/20 border border-dashed border-white/5 rounded-[2rem] text-center">
        <p className="text-[7px] text-zinc-700 font-black uppercase tracking-[0.4em] leading-loose italic">
          O PASSADO NÃO EXISTE NA PLATAFORMA.<br/>APENAS O PRESENTE E O FUTURO SÃO RELEVANTES.
        </p>
      </div>
    </div>
  );
};
