
import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { LegoRule, generateRuleLabel, transformToGuestListRule } from '../../lib/guestListBuilder';
import { GuestListRule as TypeGuestListRule } from '../../types';

interface GuestListBuilderProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  rules: TypeGuestListRule[];
  onAddRule: (rule: TypeGuestListRule) => void;
  onRemoveRule: (id: string) => void;
  readOnly?: boolean;
}

export const GuestListBuilder: React.FC<GuestListBuilderProps> = ({
  isEnabled, onToggle, rules, onAddRule, onRemoveRule, readOnly = false
}) => {
  const [currentLego, setCurrentLego] = useState<LegoRule>({
    benefit: 'VIP',
    gender: 'F',
    timingType: 'DEADLINE',
    deadline: '22:00',
    area: 'Pista',
    value: 0
  });

  const [customBenefit, setCustomBenefit] = useState('');
  const [customArea, setCustomArea] = useState('');

  const benefits = ['VIP', 'DESCONTO', 'CONSUMAÇÃO'];
  const genders = [
    { id: 'M', label: 'Masc' },
    { id: 'F', label: 'Fem' },
    { id: 'U', label: 'Uni' }
  ];
  const areas = ['Pista', 'VIP', 'Camarote', 'Backstage'];

  const handleAdd = () => {
    const newRule = {
      ...transformToGuestListRule(currentLego),
      id: Math.random().toString(36).substr(2, 9)
    } as TypeGuestListRule;
    onAddRule(newRule);
  };

  return (
    <div className={`space-y-8 p-8 bg-zinc-950 border border-white/5 rounded-[3rem] shadow-inner transition-opacity ${readOnly ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">PROTOCOLOS DE LISTA</h3>
          <p className="text-lg font-serif italic text-white">Lego de Acesso</p>
        </div>
        {!readOnly && (
          <button 
            onClick={() => onToggle(!isEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${isEnabled ? 'bg-[#d4af37]' : 'bg-zinc-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isEnabled ? 'left-7' : 'left-1'}`}></div>
          </button>
        )}
      </div>

      {isEnabled && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Lego Pieces (Hide if ReadOnly) */}
          {!readOnly && (
            <div className="space-y-6">
              {/* Benefício */}
              <div className="space-y-2">
                <span className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Benefício</span>
                <div className="flex flex-wrap gap-2">
                  {benefits.map(b => (
                    <button 
                      key={b}
                      onClick={() => setCurrentLego({...currentLego, benefit: b})}
                      className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${currentLego.benefit === b ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}
                    >
                      {b}
                    </button>
                  ))}
                  <input 
                    placeholder="OUTRO..."
                    className="bg-zinc-900 border border-white/5 rounded-full px-4 py-2 text-[8px] text-white uppercase outline-none w-24 focus:border-[#d4af37]/30"
                    onChange={(e) => setCurrentLego({...currentLego, benefit: e.target.value})}
                  />
                </div>
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <span className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Gênero</span>
                <div className="flex gap-2">
                  {genders.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => setCurrentLego({...currentLego, gender: g.id as any})}
                      className={`flex-1 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all ${currentLego.gender === g.id ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gatilho Temporal */}
              <div className="space-y-2">
                <span className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Gatilho Temporal</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentLego({...currentLego, timingType: 'ALL_NIGHT'})}
                    className={`flex-1 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all ${currentLego.timingType === 'ALL_NIGHT' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}
                  >
                    Noite Toda
                  </button>
                  <div className={`flex-[1.5] flex items-center gap-2 p-1 rounded-2xl border ${currentLego.timingType === 'DEADLINE' ? 'bg-zinc-900 border-[#d4af37]/30' : 'bg-zinc-950 border-white/5'}`}>
                    <button 
                      onClick={() => setCurrentLego({...currentLego, timingType: 'DEADLINE'})}
                      className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${currentLego.timingType === 'DEADLINE' ? 'bg-[#d4af37] text-black' : 'text-zinc-700'}`}
                    >
                      Até as
                    </button>
                    <input 
                      type="time" 
                      value={currentLego.deadline}
                      onChange={(e) => setCurrentLego({...currentLego, timingType: 'DEADLINE', deadline: e.target.value})}
                      className="bg-transparent text-white text-[10px] font-black outline-none w-16"
                    />
                  </div>
                </div>
              </div>

              {/* Área e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Área</span>
                  <select 
                    value={currentLego.area}
                    onChange={(e) => setCurrentLego({...currentLego, area: e.target.value})}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[9px] text-white uppercase outline-none"
                  >
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[7px] text-zinc-700 font-black uppercase tracking-widest ml-4">Valor R$</span>
                  <input 
                    type="number"
                    value={currentLego.value}
                    onChange={(e) => setCurrentLego({...currentLego, value: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview & Add (Hide if ReadOnly) */}
          {!readOnly && (
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="p-5 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-3xl text-center">
                <span className="text-[6px] text-zinc-600 font-black uppercase tracking-[0.3em] block mb-2">Rótulo Gerado Automático</span>
                <p className="text-xs font-serif italic text-[#d4af37] uppercase tracking-tighter">
                  {generateRuleLabel(currentLego)}
                </p>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
              >
                Adicionar Combinação
              </button>
            </div>
          )}

          {/* Listagem de Combinações */}
          <div className="space-y-3">
             {rules.length > 0 ? rules.map((rule) => (
               <div key={rule.id} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-white/5 rounded-2xl group animate-in slide-in-from-right duration-300">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">
                      {rule.type} {rule.gender} ({rule.area})
                    </span>
                    <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-widest">
                      {rule.deadline ? `ATÉ AS ${rule.deadline}` : 'NOITE TODA'} • R$ {rule.value}
                    </span>
                  </div>
                  {!readOnly && (
                    <button 
                      onClick={() => onRemoveRule(rule.id)}
                      className="p-2 text-red-900/40 hover:text-red-500 transition-colors"
                    >
                      <ICONS.Trash className="w-4 h-4" />
                    </button>
                  )}
               </div>
             )) : (
               <div className="py-4 text-center opacity-30">
                 <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma regra definida.</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
