
import React from 'react';

interface PromoterPerformance {
  name: string;
  efficiency: number;
  in: number;
  total: number;
}

interface PromoterRankingCardProps {
  promoterPerformance: PromoterPerformance[];
}

export const PromoterRankingCard: React.FC<PromoterRankingCardProps> = ({ promoterPerformance }) => {
  return (
    <div className="md:col-span-2 p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] space-y-8">
      <div className="flex justify-between items-center">
         <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">Ranking de Conversão Staff</span>
         <span className="text-[6px] text-zinc-600 font-black uppercase tracking-widest">(Check-ins / Lista Nominal)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {promoterPerformance.length > 0 ? promoterPerformance.map((p, i) => (
           <div key={p.name} className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-4 group transition-all hover:border-[#d4af37]/20">
              <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">
                 <span className="text-[9px] font-black text-zinc-500">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1.5">
                    <h5 className="text-[9px] font-black text-white uppercase truncate">{p.name}</h5>
                    <span className={`text-[9px] font-black ${p.efficiency >= 70 ? 'text-emerald-500' : p.efficiency >= 40 ? 'text-[#d4af37]' : 'text-red-500'}`}>
                       {p.efficiency.toFixed(0)}%
                    </span>
                 </div>
                 <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${p.efficiency >= 70 ? 'bg-emerald-500' : p.efficiency >= 40 ? 'bg-[#d4af37]' : 'bg-red-500'}`} 
                      style={{ width: `${p.efficiency}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between mt-1.5">
                    <span className="text-[6px] text-zinc-600 font-black uppercase">{p.in} Entradas</span>
                    <span className="text-[6px] text-zinc-600 font-black uppercase">Alvo: {p.total}</span>
                 </div>
              </div>
           </div>
         )) : (
           <div className="col-span-2 py-10 text-center border border-dashed border-white/5 rounded-2xl opacity-20">
              <p className="text-[8px] font-black uppercase">Nenhum dado de staff disponível.</p>
           </div>
         )}
      </div>
    </div>
  );
};
