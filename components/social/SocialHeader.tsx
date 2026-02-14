
import React from 'react';
import { ICONS } from '../../constants';

interface SocialHeaderProps {
  activeTab: 'MENSAGENS' | 'AMIGOS';
  setActiveTab: (tab: 'MENSAGENS' | 'AMIGOS') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SocialHeader: React.FC<SocialHeaderProps> = ({ 
  activeTab, setActiveTab, searchQuery, setSearchQuery 
}) => {
  return (
    <header className="px-10 pt-20 pb-6 flex-shrink-0 safe-top space-y-8">
      <h1 className="text-5xl font-serif italic text-white tracking-tighter">Social</h1>
      <div className="flex gap-8 border-b border-white/5">
        {['MENSAGENS', 'AMIGOS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 text-[9px] font-black uppercase tracking-[0.4em] transition-all relative ${
              activeTab === tab ? 'text-[#d4af37]' : 'text-zinc-700'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37] animate-in slide-in-from-left duration-300"></div>}
          </button>
        ))}
      </div>

      <div className="relative animate-in slide-in-from-top-2 duration-500">
        <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'MENSAGENS' ? "PROCURAR CONVERSAS ATIVAS..." : "BUSCAR NA MINHA REDE..."}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-full py-5 pl-14 pr-6 text-[9px] text-white uppercase tracking-[0.2em] outline-none focus:border-[#d4af37]/20 transition-all placeholder:text-zinc-700"
        />
      </div>
    </header>
  );
};
