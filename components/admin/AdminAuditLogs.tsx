import React, { useState, useEffect } from 'react';
import { AuditCategory, VantaAuditLog } from '../../types';
import { fetchAuditLogs } from '../../lib/auditApi';
import { ICONS } from '../../constants';

interface AdminAuditLogsProps {
  communityId?: string;
  eventId?: string;
  category?: AuditCategory;
  title?: string;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ communityId, eventId, category: initialCategory, title }) => {
  const [logs, setLogs] = useState<VantaAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<AuditCategory | 'ALL'>(initialCategory || 'ALL');

  useEffect(() => {
    loadLogs();
  }, [communityId, eventId, category]);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchAuditLogs({
      communityId,
      eventId,
      category: category === 'ALL' ? undefined : category,
      limit: 50
    });
    setLogs(data);
    setIsLoading(false);
  };

  const getCategoryIcon = (cat: AuditCategory) => {
    switch (cat) {
      case 'FINANCE': return '💰';
      case 'STAFF': return '👥';
      case 'LIST': return '📋';
      case 'ETHICS': return '⚖️';
      default: return '🛡️';
    }
  };

  return (
    <div className="space-y-6 bg-black border border-white/5 rounded-[2.5rem] p-8 shadow-inner overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">CAIXA DE AUDITORIA</h3>
          <p className="text-xl font-serif italic text-white uppercase tracking-tighter">{title || 'Fluxo de Atividade'}</p>
        </div>
        <button onClick={loadLogs} className="p-3 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-all">
           <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current ${isLoading ? 'animate-spin' : ''}`}><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>
      </div>

      {!initialCategory && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['ALL', 'GENERAL', 'FINANCE', 'STAFF', 'LIST'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat as any)}
              className={`px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${category === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
        {isLoading ? (
          <div className="py-12 flex justify-center"><div className="w-4 h-4 border border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : logs.length > 0 ? logs.map(log => (
          <div key={log.id} className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex gap-4 items-start group hover:border-white/10 transition-all">
            <div className="w-8 h-8 rounded-full bg-black border border-white/5 flex items-center justify-center shrink-0 text-[10px]">
              {getCategoryIcon(log.category)}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">{log.performed_by_name}</span>
                  <span className="text-[6px] text-zinc-800 font-black">{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               <p className="text-[9px] text-zinc-300 font-black uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</p>
               {log.details && Object.keys(log.details).length > 0 && (
                 <p className="text-[7px] text-zinc-500 mt-1 italic line-clamp-1">{JSON.stringify(log.details)}</p>
               )}
            </div>
          </div>
        )) : (
          <div className="py-12 text-center opacity-20 italic">
            <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma atividade protocolada nesta seção.</p>
          </div>
        )}
      </div>
    </div>
  );
};