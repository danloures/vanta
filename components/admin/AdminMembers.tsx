import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ICONS } from '../../constants';
import { VantaAvatar } from '../VantaAvatar';
import { fetchGlobalTags } from '../../lib/tagsApi';
import { GlobalTag, MemberProfile } from '../../types';

type SortOption = 'name' | 'influence' | 'newest';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [globalTags, setGlobalTags] = useState<GlobalTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [presenceSet, setPresenceSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const tags = await fetchGlobalTags();
      setGlobalTags(tags);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or('approved_at.not.is.null,is_globally_restricted.eq.true');
      
      if (error) throw error;
      setMembers(profiles || []);

      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('user_id, events(start_at, end_at)')
        .eq('status', 'going');
      
      if (rsvps) {
        const now = new Date();
        const activeIds = rsvps.filter((r: any) => {
          const start = new Date(r.events.start_at);
          const end = r.events.end_at ? new Date(r.events.end_at) : new Date(start.getTime() + 8 * 60 * 60 * 1000);
          return now >= start && now <= end;
        }).map((r: any) => r.user_id);
        setPresenceSet(new Set(activeIds));
      }

    } catch (err) {
      console.error("[VANTA ADMIN] Erro ao carregar inteligência de rede:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedMembers = useMemo(() => {
    let list = [...members];

    if (activeTab === 'RESTRITOS') {
      list = list.filter(m => m.is_globally_restricted);
    } else if (activeTab !== 'TODOS') {
      const targetTag = activeTab.toLowerCase();
      list = list.filter(m => 
        m.curated_level && m.curated_level.some(tag => tag.toLowerCase() === targetTag)
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.full_name?.toLowerCase().includes(q) || 
        m.instagram_handle?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'influence') return (b.followers_count || 0) - (a.followers_count || 0);
      if (sortBy === 'newest') return new Date(b.approved_at || 0).getTime() - new Date(a.approved_at || 0).getTime();
      return 0;
    });

    return list;
  }, [members, activeTab, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700 pb-32">
      <div className="space-y-6">
        <div className="relative">
          <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="ESCANEAR NOME OU @INSTAGRAM..." 
            className="w-full bg-zinc-900/50 border border-white/5 rounded-full py-6 pl-14 pr-6 text-[10px] text-white uppercase tracking-[0.2em] outline-none focus:border-[#d4af37]/30 transition-all" 
          />
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-2">
          {['TODOS', ...globalTags.map(t => t.name.toUpperCase()), 'RESTRITOS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shrink-0 ${
                activeTab === tab 
                ? 'bg-white text-black border-white shadow-xl scale-105' 
                : 'bg-zinc-900/40 text-zinc-600 border-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 px-4">
          <span className="text-[7px] text-zinc-700 font-black uppercase self-center tracking-widest">ORDEM:</span>
          {[
            { id: 'name', label: 'A-Z' },
            { id: 'influence', label: 'INFLUÊNCIA' },
            { id: 'newest', label: 'RECENTES' }
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setSortBy(opt.id as any)}
              className={`text-[8px] font-black uppercase tracking-widest ${sortBy === opt.id ? 'text-[#d4af37]' : 'text-zinc-500'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedMembers.map(member => {
          const isAtivo = presenceSet.has(member.id);
          return (
            <div 
              key={member.id} 
              onClick={() => setSelectedMember(member)}
              className="p-6 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] flex items-center gap-6 group hover:bg-zinc-800/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className={`w-16 h-16 rounded-full border p-1 bg-black overflow-hidden shrink-0 relative transition-all ${isAtivo ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10'}`}>
                <VantaAvatar src={member.avatar_url} gender={member.gender} />
                {isAtivo && <div className="absolute top-0 right-0 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full animate-pulse shadow-lg"></div>}
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-[12px] font-black text-white uppercase tracking-widest truncate">{member.full_name || 'Sem Nome'}</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-zinc-600 text-[9px] font-black uppercase">@{member.instagram_handle}</p>
                    <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                    <span className="text-[8px] text-[#d4af37] font-black uppercase">{(member.followers_count || 0) / 1000 >= 1 ? `${((member.followers_count || 0) / 1000).toFixed(1)}k` : member.followers_count} Reach</span>
                 </div>
              </div>
              <ICONS.ArrowLeft className="w-4 h-4 text-zinc-800 rotate-180 group-hover:text-white transition-colors" />
            </div>
          );
        })}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-hidden">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <header className="px-10 pt-10 pb-6 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.5em] mb-1">AUDITORIA DE ELITE</span>
                <h3 className="text-xl font-serif italic text-white uppercase tracking-tighter">Ficha do Membro</h3>
              </div>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current rotate-45"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-10 space-y-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full border p-1.5 bg-zinc-900 overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.15)] ${presenceSet.has(selectedMember.id) ? 'border-[#d4af37]' : 'border-white/10'}`}>
                    <VantaAvatar src={selectedMember.avatar_url} gender={selectedMember.gender} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {selectedMember.curated_level.map(tag => (
                      <div key={tag} className="bg-[#d4af37] text-black px-3 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl">
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase leading-none">{selectedMember.full_name}</h2>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">@{selectedMember.instagram_handle}</p>
                    <p className="text-[#d4af37] text-[8px] font-black uppercase tracking-[0.2em]">Membro desde {new Date(selectedMember.approved_at || 0).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] text-center">
                    <p className="text-zinc-400 text-[11px] leading-relaxed uppercase tracking-wider italic">
                      "{selectedMember.bio || "SEM BIOGRAFIA DEFINIDA PELO USUÁRIO."}"
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center space-y-1">
                       <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Reach Bruto</span>
                       <p className="text-xl font-serif italic text-white">{(selectedMember.followers_count || 0).toLocaleString()} <span className="text-[10px] text-zinc-500 not-italic">followers</span></p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center space-y-1">
                       <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Cidade/Base</span>
                       <p className="text-xl font-serif italic text-white truncate">{selectedMember.city || 'RIO'}</p>
                    </div>
                 </div>
              </div>

              {selectedMember.gallery && Array.isArray(selectedMember.gallery) && selectedMember.gallery.filter(Boolean).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em] text-center italic">Escaneamento Visual</h4>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {selectedMember.gallery.filter(Boolean).map((img, i) => (
                      <div key={i} className="w-48 aspect-[3/4] shrink-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-lg">
                        <img src={img as string} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="text-[8px] text-zinc-600 font-black uppercase tracking-widest text-center mb-6 italic">Painel de Comandos SOBERANOS</h4>
                <div className="grid grid-cols-2 gap-3">
                   <button className="flex flex-col items-center justify-center p-6 bg-white text-black rounded-[2.5rem] gap-2 active:scale-95 transition-all">
                      <ICONS.Star className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase">Convite VIP</span>
                   </button>
                   <button className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-white/10 text-white rounded-[2.5rem] gap-2 active:scale-95 transition-all">
                      <ICONS.Message className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase">Broadcaster</span>
                   </button>
                </div>
                <button className="w-full py-6 bg-red-600/10 border border-red-600/30 text-red-500 text-[10px] font-black uppercase rounded-[2.5rem] active:scale-95 transition-all mt-4">
                  Abrir Tribunal de Ética
                </button>
              </div>
            </div>
            
            <footer className="p-8 bg-black/80 backdrop-blur-md border-t border-white/5 text-center shrink-0">
               <p className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.4em] italic leading-loose">
                 CONFIDENCIAL: TODO O HISTÓRICO DE VISUALIZAÇÃO DE PERFIL ESTÁ SENDO AUDITADO.
               </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};