
import React from 'react';
import { ICONS } from '../../constants';

interface SearchHeaderProps {
  activeTab: 'EVENTOS' | 'MEMBROS';
  onTabChange: (tab: 'EVENTOS' | 'MEMBROS') => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ activeTab, onTabChange, query, onQueryChange }) => {
  return (
    <header className="px-10 pt-20 pb-6 flex-shrink-0 safe-top space-y-8">
      <h1 className="text-5xl font-serif italic text-white tracking-tighter">Buscar</h1>
      
      <div className="relative">
        <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input 
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={activeTab === 'EVENTOS' ? "PROCURAR SESSÕES..." : "BUSCAR MEMBROS..."}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-full py-6 pl-14 pr-6 text-[10px] text-white uppercase tracking-[0.2em] outline-none focus:border-[#d4af37]/30 transition-all placeholder:text-zinc-700"
        />
      </div>

      <div className="flex gap-8 border-b border-white/5">
        {(['EVENTOS', 'MEMBROS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`pb-4 text-[9px] font-black uppercase tracking-[0.4em] transition-all relative ${
              activeTab === tab ? 'text-[#d4af37]' : 'text-zinc-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37] animate-in slide-in-from-left duration-300"></div>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
