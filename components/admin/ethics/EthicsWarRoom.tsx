import React, { useState, useEffect } from 'react';
import { User, IncidenceReport, IncidenceStatus, IncidenceStatus as Status, Community, VerdictChoice } from '../../../types';
import { fetchIncidences } from '../../../lib/incidenceApi';
import { ReporterPanel } from './ReporterPanel';
import { VoterPanel } from './VoterPanel';
import { ICONS } from '../../../constants';

interface EthicsWarRoomProps {
  currentUser: User;
  communityId?: string;
  communities?: Community[];
}

type EthicsView = 'UNIT_SELECTOR' | 'LIST' | 'CREATE' | 'VOTE' | 'HISTORY';

export const EthicsWarRoom: React.FC<EthicsWarRoomProps> = ({ currentUser, communityId, communities = [] }) => {
  const [localCommunityId, setLocalCommunityId] = useState<string | null>(communityId || null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [view, setView] = useState<EthicsView>(communityId ? 'LIST' : 'UNIT_SELECTOR');
  const [reports, setReports] = useState<IncidenceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fixed: Defined canOpenCase to resolve "Cannot find name 'canOpenCase'" error
  const canOpenCase = ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor'].includes(currentUser.role.toLowerCase());

  // VANTA_SCROLL_PROTOCOL
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [view]);

  useEffect(() => {
    if (localCommunityId) {
      loadReports();
    }
  }, [localCommunityId, view]);

  const loadReports = async () => {
    if (!localCommunityId) return;
    setIsLoading(true);
    
    // Filtro de status baseado na visualização atual
    const statusFilter = view === 'HISTORY' ? [Status.CLOSED] : [Status.OPEN, Status.VOTING];
    
    const active = await fetchIncidences(statusFilter);
    setReports(active.filter(r => r.communityId === localCommunityId));
    setIsLoading(false);
  };

  const handleSelectCase = (id: string) => {
    if (view === 'HISTORY') return; // Histórico é apenas leitura
    setActiveReportId(id);
    setView('VOTE');
  };

  const handleUnitSelect = (id: string) => {
    setLocalCommunityId(id);
    setView('LIST');
  };

  const getStatusLabel = (report: IncidenceReport) => {
    if (report.status === Status.CLOSED) {
      const verdict = report.finalVerdict || 'ABSOLVICAO';
      const colors: Record<string, string> = {
        [VerdictChoice.BANIMENTO]: 'text-white bg-red-600',
        [VerdictChoice.SUSPENSAO]: 'text-black bg-orange-500',
        [VerdictChoice.ADVERTENCIA]: 'text-black bg-yellow-400',
        [VerdictChoice.ABSOLVICAO]: 'text-white bg-emerald-600'
      };
      return { label: `SENTENÇA: ${verdict.toUpperCase()}`, color: colors[verdict] || 'text-zinc-500 bg-black' };
    }

    switch(report.status) {
      case Status.OPEN: return { label: 'AGUARDANDO CONSELHO', color: 'text-white bg-zinc-800' };
      case Status.VOTING: return { label: 'DELIBERAÇÃO ATIVA', color: 'text-black bg-[#d4af37]' };
      default: return { label: 'EM ANÁLISE', color: 'text-zinc-500 bg-black' };
    }
  };

  const currentUnitName = communities.find(c => c.id === localCommunityId)?.name || "Unidade";

  if (view === 'UNIT_SELECTOR') {
    return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-32">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 italic">JURISDIÇÃO OBRIGATÓRIA</h3>
          <p className="text-2xl font-serif italic text-white tracking-tighter uppercase">Tribunal de Ética</p>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed mt-2">
            Selecione a Unidade onde o incidente ocorreu para acessar o dossiê local.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {communities.length > 0 ? communities.map(comm => (
            <button 
              key={comm.id}
              onClick={() => handleUnitSelect(comm.id)}
              className="w-full p-6 bg-zinc-950 border border-white/5 rounded-[2.5rem] flex items-center gap-6 text-left hover:border-red-600/30 transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 p-1 bg-black">
                <img src={comm.logo_url} className="w-full h-full object-cover rounded-xl" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{comm.name}</h4>
                <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mt-1 truncate">
                  Local: {comm.address?.split(',')[0]}
                </p>
              </div>
              <ICONS.ArrowLeft className="w-4 h-4 text-red-600 rotate-180" />
            </button>
          )) : (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
               <p className="text-[8px] font-black uppercase">Nenhuma unidade disponível para auditoria.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      <header className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => setView('UNIT_SELECTOR')} 
            className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-1"
          >
            <ICONS.ArrowLeft className="w-3 h-3" /> Alterar Jurisdição
          </button>
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 italic">WAR ROOM: {currentUnitName}</h3>
          <p className="text-2xl font-serif italic text-white tracking-tighter uppercase">Justiça Interna</p>
        </div>
        <div className="flex flex-col gap-2">
           {canOpenCase && (view === 'LIST' || view === 'HISTORY') && (
            <button 
              onClick={() => setView('CREATE')}
              className="px-6 py-3 bg-red-600 text-white text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
            >
              Abrir Dossiê
            </button>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => setView('LIST')} 
              className={`px-4 py-2 rounded-full text-[7px] font-black uppercase transition-all ${view === 'LIST' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}
            >
              Ativos
            </button>
            <button 
              onClick={() => setView('HISTORY')} 
              className={`px-4 py-2 rounded-full text-[7px] font-black uppercase transition-all ${view === 'HISTORY' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}
            >
              Histórico
            </button>
          </div>
        </div>
      </header>

      {(view === 'LIST' || view === 'HISTORY') && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          ) : reports.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {reports.map(report => {
                const badge = getStatusLabel(report);
                return (
                  <button 
                    key={report.id}
                    disabled={view === 'HISTORY'}
                    onClick={() => handleSelectCase(report.id)}
                    className={`w-full p-6 bg-zinc-950 border border-white/5 rounded-[2.5rem] flex items-center gap-6 text-left transition-all group ${view === 'HISTORY' ? 'opacity-80 grayscale-[0.5]' : 'hover:border-red-600/30 active:scale-[0.98]'}`}
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 group-hover:border-red-600/40 transition-all">
                      <img src={(report as any).subject?.avatar_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest ${badge.color}`}>
                            {badge.label}
                          </span>
                       </div>
                       <h4 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{report.subjectName}</h4>
                       <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1 truncate italic">
                         Relator: {(report as any).reporter?.full_name?.split(' ')[0]}
                       </p>
                    </div>
                    {view === 'LIST' && <ICONS.ArrowLeft className="w-4 h-4 text-red-600 rotate-180 opacity-0 group-hover:opacity-100 transition-all" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[3rem] text-center space-y-4 opacity-50">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                 <span className="text-xl">⚖️</span>
              </div>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                Nenhum protocolo {view === 'HISTORY' ? 'no histórico' : 'ativo'} nesta unidade.<br/>O ecossistema opera em harmonia.
              </p>
            </div>
          )}
          
          <div className="pt-10 border-t border-white/5">
             <button 
               onClick={loadReports}
               className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em] mb-6 ml-4 flex items-center gap-2"
             >
               Sincronizar Protocolos Ativos ↻
             </button>
          </div>
        </div>
      )}

      {view === 'CREATE' && localCommunityId && (
        <ReporterPanel 
          currentUser={currentUser} 
          communityId={localCommunityId} 
          onCancel={() => setView('LIST')} 
          onSuccess={() => { setView('LIST'); loadReports(); }}
        />
      )}

      {view === 'VOTE' && activeReportId && (
        <div className="space-y-4">
           <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 mb-4 ml-2">
             <ICONS.ArrowLeft className="w-4 h-4" /> Voltar à Lista
           </button>
           <VoterPanel 
            reportId={activeReportId} 
            currentUser={currentUser} 
            onVoteSuccess={() => { setView('LIST'); loadReports(); }} 
           />
        </div>
      )}

      <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] text-center">
         <p className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.4em] leading-loose italic">
           CÓDIGO DE CONDUTA VANTA V2.1<br/>AS DECISÕES DO CONSELHO SÃO SOBERANAS E IRREVOGÁVEIS.
         </p>
      </div>
    </div>
  );
};