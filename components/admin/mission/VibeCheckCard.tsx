
import React from 'react';

interface VibeCheckCardProps {
  vibe: {
    femalePct: number;
    malePct: number;
    female: number;
    male: number;
  };
}

export const VibeCheckCard: React.FC<VibeCheckCardProps> = ({ vibe }) => {
  return (
    <div className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] space-y-6">
      <div className="flex justify-between items-center">
         <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">Vibe-Check (M vs F)</span>
         <span className="text-[7px] text-zinc-600 font-black uppercase italic">Em Tempo Real</span>
      </div>
      
      <div className="space-y-4">
         <div className="w-full h-12 bg-zinc-900 rounded-2xl overflow-hidden flex">
            <div className="h-full bg-pink-500/80 transition-all duration-1000 flex items-center justify-center" style={{ width: `${vibe.femalePct}%` }}>
               {vibe.femalePct > 10 && <span className="text-[8px] font-black text-white">{vibe.femalePct.toFixed(0)}%</span>}
            </div>
            <div className="h-full bg-blue-500/80 transition-all duration-1000 flex items-center justify-center border-l border-black/40" style={{ width: `${vibe.malePct}%` }}>
               {vibe.malePct > 10 && <span className="text-[8px] font-black text-white">{vibe.malePct.toFixed(0)}%</span>}
            </div>
         </div>
         <div className="flex justify-between px-2">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
               <span className="text-[8px] text-zinc-400 font-black uppercase">Feminino: {vibe.female}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[8px] text-zinc-400 font-black uppercase">Masculino: {vibe.male}</span>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            </div>
         </div>
      </div>
    </div>
  );
};
