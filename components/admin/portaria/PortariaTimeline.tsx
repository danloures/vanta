
import React from 'react';
import { GuestListRule } from '../../../types';
import { getRuleStatus, formatRuleValue } from '../../../lib/accessRulesLogic';

interface PortariaTimelineProps {
  filteredTimeline: GuestListRule[];
  genderFilter: 'M' | 'F' | 'ALL';
  setGenderFilter: (filter: 'M' | 'F' | 'ALL') => void;
  now: Date;
}

export const PortariaTimeline: React.FC<PortariaTimelineProps> = ({ 
  filteredTimeline, 
  genderFilter, 
  setGenderFilter, 
  now 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex bg-zinc-950 rounded-full p-1 border border-white/5">
        {[
          { id: 'ALL', label: 'TODOS' },
          { id: 'M', label: 'MASCULINO' },
          { id: 'F', label: 'FEMININO' }
        ].map(opt => (
          <button 
            key={opt.id}
            onClick={() => setGenderFilter(opt.id as any)}
            className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${
              genderFilter === opt.id ? 'bg-white text-black' : 'text-zinc-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTimeline.map((rule, idx) => {
          const status = getRuleStatus(rule, now);
          const isActive = status === 'ACTIVE';

          return (
            <div 
              key={rule.id || idx}
              className={`p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden flex items-center justify-between ${
                isActive 
                  ? 'bg-zinc-900 border-[#d4af37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] scale-[1.02]' 
                  : 'bg-zinc-950 border-white/5 opacity-40 grayscale'
              }`}
            >
              {isActive && <div className="absolute left-0 top-0 w-1.5 h-full bg-[#d4af37]"></div>}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className={`text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                    rule.gender.toString().startsWith('F') ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {rule.gender}
                  </span>
                  <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">{rule.area}</span>
                </div>
                <h4 className={`text-xl font-serif italic uppercase tracking-tighter ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                  {rule.type} {formatRuleValue(rule)}
                </h4>
                {rule.deadline && (
                  <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isActive ? 'text-[#d4af37]' : 'text-zinc-700'}`}>
                    {isActive ? `VÁLIDO ATÉ ${rule.deadline}` : `EXPIRADO ÀS ${rule.deadline}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
