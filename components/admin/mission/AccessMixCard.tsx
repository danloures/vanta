
import React from 'react';

interface AccessMixCardProps {
  ruleDistribution: Array<{ label: string; count: number }>;
  checkedIn: number;
}

export const AccessMixCard: React.FC<AccessMixCardProps> = ({ ruleDistribution, checkedIn }) => {
  return (
    <div className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] space-y-6">
      <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">Mix de Acesso Principal</span>
      <div className="space-y-3">
         {ruleDistribution.length > 0 ? ruleDistribution.map((rule, i) => (
           <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[9px] font-black text-white uppercase truncate max-w-[140px]">{rule.label}</span>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] text-white font-bold">{rule.count}</span>
                 <div className="w-8 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#d4af37]" style={{ width: `${(rule.count/(checkedIn || 1))*100}%` }}></div>
                 </div>
              </div>
           </div>
         )) : (
           <p className="text-[8px] text-zinc-700 italic uppercase">Aguardando entradas...</p>
         )}
      </div>
    </div>
  );
};
