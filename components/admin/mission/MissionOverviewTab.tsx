
import React from 'react';
import { Event } from '../../../types';
import { VibeCheckCard } from './VibeCheckCard';
import { AccessMixCard } from './AccessMixCard';
import { PromoterRankingCard } from './PromoterRankingCard';

interface MissionOverviewTabProps {
  event: Event;
  stats: any;
}

export const MissionOverviewTab: React.FC<MissionOverviewTabProps> = ({ event, stats }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="p-10 bg-zinc-900/40 border border-white/5 rounded-[3rem] text-center space-y-6">
        <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] italic">Resumo da Sessão</h4>
        <p className="text-zinc-400 text-sm leading-relaxed uppercase tracking-wide italic">"{event.description}"</p>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[6px] text-zinc-600 font-black block uppercase">Capacidade</span>
            <span className="text-xs text-white font-black">{event.capacity} PAX</span>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[6px] text-zinc-600 font-black block uppercase">Vip Only</span>
            <span className="text-xs text-white font-black">{event.isVipOnly ? 'SIM' : 'NÃO'}</span>
          </div>
        </div>
      </div>

      {/* Relatórios de Inteligência Atômica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VibeCheckCard vibe={stats.vibe} />
        <AccessMixCard ruleDistribution={stats.ruleDistribution} checkedIn={stats.checkedIn} />
        <PromoterRankingCard promoterPerformance={stats.promoterPerformance} />
      </div>
    </div>
  );
};
