
import React from 'react';
import { ICONS } from '../../constants';

interface EventHeaderProps {
  title: string;
  city: string;
  state: string;
  image: string;
  isRestricted: boolean;
  onBack: () => void;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ 
  title, city, state, image, isRestricted, onBack 
}) => {
  return (
    <>
      <div className="sticky top-0 z-[210] p-6 flex items-center justify-between safe-top">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
          <ICONS.ArrowLeft className="w-5 h-5" />
        </button>
        <div className="px-4 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full">
          <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-[0.3em]">Sessão</span>
        </div>
        <div className="w-12" />
      </div>

      <div className="relative w-full aspect-square md:aspect-video -mt-24">
        <img src={image} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        {isRestricted && (
          <div className="absolute inset-0 bg-red-900/10 backdrop-grayscale flex items-center justify-center">
             <div className="px-4 py-2 bg-red-600 rounded-full shadow-2xl">
               <span className="text-[8px] font-black text-white uppercase tracking-widest">Aura de Restrição</span>
             </div>
          </div>
        )}
      </div>

      <div className="px-8 -mt-20 relative z-10 space-y-2">
        <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.4em]">{city} • {state}</span>
        <h1 className="text-5xl font-serif italic text-white tracking-tighter leading-none uppercase">{title}</h1>
      </div>
    </>
  );
};
