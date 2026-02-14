
import React, { useState, useMemo } from 'react';
import { Event, User } from '../../types';
import { ICONS } from '../../constants';
import { AdminPortaria } from './AdminPortaria';
import { isEventExpired } from '../../lib/eventsApi';
import { useMissionStats } from '../../hooks/useMissionStats';

// VANTA_MISSION_TABS: Importação de componentes de aba fragmentados
import { MissionOverviewTab } from './mission/MissionOverviewTab';
import { MissionFinanceTab } from './mission/MissionFinanceTab';
import { MissionAuditTab } from './mission/MissionAuditTab';

interface EventMissionControlProps {
  eventId: string;
  currentUser: User;
  events: Event[];
  onBack: () => void;
}

type MissionTab = 'OVERVIEW' | 'OPERATIONS' | 'FINANCE' | 'AUDIT';

export const EventMissionControl: React.FC<EventMissionControlProps> = ({ eventId, currentUser, events, onBack }) => {
  const [activeTab, setActiveTab] = useState<MissionTab>('OVERVIEW');
  
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const isPast = event ? isEventExpired(event) : false;

  const { stats } = useMissionStats(eventId, event);

  // Permissões Granulares
  const roleLower = currentUser.role.toLowerCase();
  const isHighStaff = ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor'].includes(roleLower);
  const isFinanceAuthorized = isHighStaff || !!currentUser.permissions?.['finance_view'];

  if (!event) return null;

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-32">
      {/* Header de Missão */}
      <header className="flex flex-col gap-4">
        <button onClick={onBack} className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest flex items-center gap-1">
          <ICONS.ArrowLeft className="w-3 h-3" /> Retornar à Unidade
        </button>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter leading-none">{event.title}</h2>
               {isPast && (
                 <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-[6px] font-black uppercase border border-white/5">
                   Sessão Arquivada
                 </span>
               )}
            </div>
            <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">{event.startDate} • {event.location}</p>
          </div>
          <div className="flex gap-2">
             <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden bg-zinc-900 shadow-xl">
                <img src={event.image} className="w-full h-full object-cover rounded-full" alt="" />
             </div>
          </div>
        </div>
      </header>

      {/* War Room KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl space-y-1">
          <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block">Presença Real</span>
          <p className="text-2xl font-serif italic text-white">{stats.checkedIn}</p>
          <span className="text-[5px] text-zinc-700 font-black uppercase">de {stats.total} convidados</span>
        </div>
        <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl space-y-1">
          <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block">Conversão</span>
          <p className="text-2xl font-serif italic text-[#d4af37]">{stats.conversion.toFixed(1)}%</p>
          <div className="w-full h-0.5 bg-zinc-900 mt-2 overflow-hidden rounded-full">
             <div className="h-full bg-[#d4af37]" style={{ width: `${stats.conversion}%` }}></div>
          </div>
        </div>
        {isFinanceAuthorized && (
          <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl space-y-1">
            <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block">Faturamento Est.</span>
            <p className="text-2xl font-serif italic text-emerald-500">R$ {stats.revenue.toLocaleString()}</p>
            <span className="text-[5px] text-zinc-700 font-black uppercase">Tickets Liquidados</span>
          </div>
        )}
        <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl space-y-1">
          <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest block">Status Operacional</span>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-zinc-800' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
             <span className="text-[8px] text-white font-black uppercase">{isPast ? 'Operação Encerrada' : 'Portaria Ativa'}</span>
          </div>
        </div>
      </div>

      {/* Tabs de Comando */}
      <div className="flex gap-8 border-b border-white/5 px-2 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'OVERVIEW', label: 'Briefing' },
          { id: 'OPERATIONS', label: 'Portaria & Lista' },
          { id: 'FINANCE', label: 'Financeiro', hidden: !isFinanceAuthorized },
          { id: 'AUDIT', label: 'Caixa Preta', hidden: !isHighStaff }
        ].filter(t => !t.hidden).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-[9px] font-black uppercase tracking-[0.4em] relative transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'text-white' : 'text-zinc-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}
          </button>
        ))}
      </div>

      {/* Conteúdo Dinâmico Orchestration */}
      <div className="min-h-[400px]">
        {activeTab === 'OPERATIONS' && (
           <AdminPortaria 
            events={events} 
            currentUser={currentUser} 
            initialSelectedEventId={eventId} 
           />
        )}

        {activeTab === 'OVERVIEW' && (
          <MissionOverviewTab event={event} stats={stats} />
        )}

        {activeTab === 'FINANCE' && isFinanceAuthorized && (
          <MissionFinanceTab event={event} eventId={eventId} />
        )}

        {activeTab === 'AUDIT' && isHighStaff && (
           <MissionAuditTab eventId={eventId} />
        )}
      </div>

      {isPast && (
        <div className="p-8 bg-black border border-dashed border-white/10 rounded-[2.5rem] text-center mt-12">
           <p className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.4em] leading-loose italic">
             ESTA SESSÃO FOI PROTOCOLADA E ARQUIVADA.<br/>NÃO SÃO PERMITIDAS ALTERAÇÕES EM DADOS HISTÓRICOS.
           </p>
        </div>
      )}
    </div>
  );
};
