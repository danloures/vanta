
import React from 'react';
import { ICONS } from '../../../../constants';

interface CitySelectorProps {
  show: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  availableCities: string[];
  isLoading?: boolean;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ 
  show, onClose, selectedCity, onSelectCity, availableCities, isLoading 
}) => {
  if (!show) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[5000] cursor-default bg-black/20"
        onClick={onClose}
      />
      <div className="fixed top-28 left-1/2 -translate-x-1/2 w-[85%] max-w-xs z-[5010] animate-in slide-in-from-top-2 fade-in duration-300 origin-top">
        <div className="bg-zinc-950/95 border border-[#d4af37]/20 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col backdrop-blur-3xl ring-1 ring-white/5">
          <div className="p-6 border-b border-white/5 text-center relative bg-black/40">
            <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.3em]">SELECIONAR LOCAL</span>
            <button 
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div className="flex flex-col max-h-[50vh] overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
            ) : availableCities.length > 0 ? (
              <>
                {availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => { onSelectCity(city); onClose(); }}
                    className={`w-full py-5 px-8 text-[10px] font-black uppercase tracking-widest text-left transition-all flex justify-between items-center border-b border-white/5 last:border-0 hover:bg-white/5 ${
                      selectedCity === city ? 'text-white bg-white/5' : 'text-zinc-500'
                    }`}
                  >
                    {city}
                    {selectedCity === city && <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>}
                  </button>
                ))}
                {availableCities.length < 5 && (
                  <div className="p-5 text-center bg-black/20">
                     <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] italic opacity-60">Em breve mais cidades...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 px-8 text-center space-y-4">
                 <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center mx-auto opacity-20">
                    <ICONS.MapPin className="w-4 h-4 text-zinc-500" />
                 </div>
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed italic">
                    Em breve novas cidades
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const CitySelectorTrigger: React.FC<{ selectedCity: string; onClick: () => void }> = ({ selectedCity, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center active:scale-95 transition-all">
    <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.3em] mb-1 italic">ESTOU EM</span>
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white font-black uppercase tracking-[0.4em]">{selectedCity}</span>
      <div className="w-2 h-2 border-r border-b border-zinc-600 rotate-45 mb-1"></div>
    </div>
  </button>
);
