
import React from 'react';
import { User } from '../../../types';

interface PortariaReportProps {
  reportData: any;
  isPromoter: boolean;
  currentUser: User;
}

export const PortariaReport: React.FC<PortariaReportProps> = ({
  reportData,
  isPromoter,
  currentUser
}) => {
  if (!reportData) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header do Balanço */}
      <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
         <div className="flex flex-col gap-1">
            <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">BALANÇO FINAL PROTOCOLADO</span>
            <p className="text-xl font-serif italic text-white">Performance da Sessão</p>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-2">
               <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Aproveitamento</span>
               <p className="text-3xl font-serif italic text-[#d4af37]">{reportData.occupancy.toFixed(1)}%</p>
               <span className="text-[6px] text-zinc-500 font-black uppercase tracking-widest block">Taxa de Conversão</span>
            </div>
            <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-2">
               <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Presenças</span>
               <p className="text-3xl font-serif italic text-white">{reportData.checkedInCount}</p>
               <span className="text-[6px] text-zinc-500 font-black uppercase tracking-widest block">de {reportData.totalGuests} nomes</span>
            </div>
         </div>
      </div>

      {/* Distribuição por Regras (Oculto para Promoter) */}
      {!isPromoter && (
        <div className="space-y-6">
          <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] px-2 italic">Distribuição por Categorias</h4>
          <div className="grid grid-cols-1 gap-3">
            {reportData.ruleStats.map((stat: any) => (
              <div key={stat.id} className="p-5 bg-zinc-900/40 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-[#d4af37]/20 transition-all">
                 <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[200px]">{stat.label}</span>
                 <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] text-[#d4af37] font-black">{stat.entries} IN</span>
                       <span className="text-[6px] text-zinc-600 font-black">DE {stat.total}</span>
                    </div>
                    <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-[#d4af37]" style={{ width: `${(stat.entries/stat.total)*100}%` }}></div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance de Promoters (Visão Global vs Visão Pessoal) */}
      <div className="space-y-6">
        <h4 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] px-2 italic">
           {isPromoter ? "Meu Histórico de Conversão" : "Ranking de Performance"}
        </h4>
        <div className="space-y-3">
          {reportData.promoterRanking
            .filter((p: any) => !isPromoter || p.fullEmail.toLowerCase() === currentUser.email.toLowerCase())
            .map((p: any, idx: number) => (
            <div key={p.fullEmail} className={`p-5 rounded-3xl flex items-center gap-5 transition-all ${p.fullEmail === currentUser.email ? 'bg-zinc-900/60 border border-[#d4af37]/30 shadow-lg' : 'bg-black border border-white/5 opacity-80'}`}>
               {!isPromoter && (
                 <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-zinc-500">{idx + 1}</span>
                 </div>
               )}
               <div className="flex-1 min-w-0">
                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest truncate">{p.email}</h5>
                  <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">{p.entries} Entradas efetivadas</p>
               </div>
               <div className="text-right">
                  <span className={`text-[11px] font-black ${p.conversion >= 70 ? 'text-emerald-500' : p.conversion >= 40 ? 'text-[#d4af37]' : 'text-red-500'}`}>
                    {p.conversion.toFixed(0)}%
                  </span>
                  <p className="text-[6px] text-zinc-700 font-black uppercase">Eficiência</p>
               </div>
            </div>
          ))}
          
          {isPromoter && reportData.promoterRanking.filter((p: any) => p.fullEmail.toLowerCase() === currentUser.email.toLowerCase()).length === 0 && (
            <div className="py-10 text-center opacity-30">
               <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma atividade registrada na sua lista.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
