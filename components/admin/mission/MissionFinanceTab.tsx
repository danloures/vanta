
import React from 'react';
import { Event } from '../../../types';
import { AdminAuditLogs } from '../AdminAuditLogs';

interface MissionFinanceTabProps {
  event: Event;
  eventId: string;
}

export const MissionFinanceTab: React.FC<MissionFinanceTabProps> = ({ event, eventId }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="p-8 bg-zinc-950 border border-white/5 rounded-[3rem] space-y-6 shadow-inner">
        <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Desempenho de Lotes</h3>
        <div className="space-y-4">
          {(event.batches || []).map((batch: any) => (
            <div key={batch.id} className="flex justify-between items-center p-4 bg-zinc-900/60 border border-white/5 rounded-2xl">
              <span className="text-[9px] font-black text-zinc-400 uppercase">{batch.name}</span>
              <div className="flex gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-white font-bold">{batch.soldCount || 0} / {batch.limit}</span>
                  <p className="text-[5px] text-zinc-600 uppercase font-black">Conversão</p>
                </div>
              </div>
            </div>
          ))}
          {(!event.batches || event.batches.length === 0) && (
            <p className="text-[8px] text-zinc-700 italic uppercase text-center py-4">Nenhum lote configurado para esta sessão.</p>
          )}
        </div>
      </div>
      <AdminAuditLogs eventId={eventId} category="FINANCE" title="Auditoria Financeira Local" />
    </div>
  );
};
