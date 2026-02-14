
import React, { useState, useEffect } from 'react';
import { MemberProfile, searchMembers } from '../lib/membersApi';
import { ICONS } from '../constants';
import { VantaAvatar } from './VantaAvatar';

interface VantaUserPickerProps {
  onSelect: (user: MemberProfile) => void;
  placeholder?: string;
  label?: string;
}

export const VantaUserPicker: React.FC<VantaUserPickerProps> = ({ onSelect, placeholder, label }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchMembers(query);
      setResults(data);
      setShowResults(true);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full space-y-2">
      {label && <label className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.3em] ml-4">{label}</label>}
      <div className="relative">
        <ICONS.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "BUSCAR POR NOME, @INSTA OU E-MAIL..."}
          className="w-full bg-zinc-900/60 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[9px] text-white uppercase tracking-widest outline-none focus:border-[#d4af37]/30 transition-all"
        />
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl z-[500] max-h-60 overflow-y-auto no-scrollbar py-2 animate-in fade-in slide-in-from-top-2">
          {results.map((user) => {
            return (
              <button
                key={user.id}
                onClick={() => {
                  onSelect(user);
                  setQuery('');
                  setShowResults(false);
                }}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden bg-zinc-900 shrink-0">
                  <VantaAvatar 
                    src={user.avatar_url} 
                    gender={user.gender} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-white uppercase truncate">{user.full_name || 'Sem Nome'}</h4>
                  <div className="flex flex-col">
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest truncate">@{user.instagram_handle || 'vanta'}</p>
                  </div>
                </div>
                <div className="text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ICONS.Plus className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
