import React from 'react';
import { GlobalTag, MemberProfile } from '../../types';
import { VantaAvatar } from '../VantaAvatar';

interface AdminCuratorshipProps {
  filteredQueue: MemberProfile[];
  isLoadingQueue: boolean;
  updateMemberLevel: (memberId: string, tagName: string) => void;
  handleQualifyMember: (memberId: string) => void;
  isProcessing: boolean;
  filterGender: 'all' | 'male' | 'female';
  setFilterGender: (val: 'all' | 'male' | 'female') => void;
  filterInfluence: 'all' | 'high';
  setFilterInfluence: (val: 'all' | 'high') => void;
  globalTags: GlobalTag[];
}

export const AdminCuratorship: React.FC<AdminCuratorshipProps> = ({
  filteredQueue, isLoadingQueue, updateMemberLevel, handleQualifyMember, isProcessing,
  filterGender, setFilterGender, filterInfluence, setFilterInfluence, globalTags
}) => {
  
  const tagsToDisplay = globalTags.length > 0 ? globalTags : [
    { id: '1', name: 'vanta classic', color: '#d4af37', priority: 1 },
    { id: '2', name: 'vanta vip', color: '#d4af37', priority: 10 }
  ];

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-48">
      <div className="flex flex-col gap-6 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">MESA DE QUALIFICAÇÃO</h3>
            <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Fila de Elite ({filteredQueue.length})</p>
          </div>
          {isLoadingQueue && <div className="w-4 h-4 border border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>}
        </div>

        <div className="space-y-4 bg-zinc-950/50 p-6 border border-white/5 rounded-[2rem]">
          <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">SEGMENTAR VISÃO</span>
          <div className="flex flex-col gap-3">
            <div className="flex bg-black rounded-full p-1 border border-white/5">
              {[
                { id: 'all', label: 'TODOS' },
                { id: 'male', label: 'MASCULINO' },
                { id: 'female', label: 'FEMININO' }
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setFilterGender(opt.id as any)}
                  className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${
                    filterGender === opt.id ? 'bg-white text-black' : 'text-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterInfluence(filterInfluence === 'all' ? 'high' : 'all')}
                className={`flex-1 py-3 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                  filterInfluence === 'high' 
                  ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' 
                  : 'bg-black border-white/5 text-zinc-600'
                }`}
              >
                {filterInfluence === 'high' ? '✨ ALTA INFLUÊNCIA ATIVA' : 'TODOS OS PERFIS'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredQueue.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredQueue.map((member) => (
            <div key={member.id} className="bg-zinc-950 border border-white/5 rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group hover:border-[#d4af37]/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full border border-white/10 p-1 bg-black overflow-hidden shrink-0">
                  <VantaAvatar src={member.avatar_url} gender={member.gender} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-[15px] font-black uppercase tracking-widest truncate">{member.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest">@{member.instagram_handle}</p>
                     <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                     <span className="text-[8px] text-zinc-500 font-black uppercase">{(member.followers_count || 0).toLocaleString()} Reach</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Atribuir Nível de Curadoria</span>
                <div className="grid grid-cols-2 gap-2">
                  {tagsToDisplay.map((tag) => {
                    const isSelected = member.curated_level?.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => updateMemberLevel(member.id, tag.name)}
                        className={`py-4 px-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                          isSelected 
                            ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-xl scale-[1.02]' 
                            : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => handleQualifyMember(member.id)}
                disabled={isProcessing || !member.curated_level || member.curated_level.length === 0}
                className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
              >
                {isProcessing ? "Efetivando..." : "Assinar Perfil e Finalizar"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-6 animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
             <span className="text-3xl">✓</span>
          </div>
          <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.5em] italic">
            FILA DE QUALIFICAÇÃO VAZIA.<br/>TODOS OS MEMBROS ESTÃO SINCRONIZADOS.
          </p>
        </div>
      )}
    </div>
  );
};