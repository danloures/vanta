
import React, { useState, useMemo } from 'react';
import { ICONS } from '../../../constants';
import { Community, Event, User, CustomRole } from '../../../types';
import { AdminAuditLogs } from '../../../components/admin/AdminAuditLogs';
import { isEventExpired } from '../../../lib/eventsApi';
import { VantaAvatar } from '../../../components/VantaAvatar';
import { friendshipStore } from '../../../lib/friendshipStore';
import { MemberProfile } from '../../../lib/membersApi';
import { MemberProfileView } from '../../../components/MemberProfileView';
import { vantaFeedback } from '../../../lib/feedbackStore';

const HeartIcon = ({ filled, className }: { filled: boolean, className?: string }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

// Fixed: Added required 'username' property to MOCK_LIKERS to conform to MemberProfile interface
const MOCK_LIKERS: MemberProfile[] = [
  { id: 'user-1', username: null, full_name: 'Ana Souza', instagram_handle: 'anasouza', avatar_url: '', gender: 'female', city: 'Rio de Janeiro', state: 'RJ', curated_level: [] },
  { id: 'user-2', username: null, full_name: 'Carlos Lima', instagram_handle: 'carlos.lima', avatar_url: '', gender: 'male', city: 'São Paulo', state: 'SP', curated_level: [] },
  { id: 'user-3', username: null, full_name: 'Beatriz Reis', instagram_handle: 'bia.reis', avatar_url: '', gender: 'female', city: 'Belo Horizonte', state: 'MG', curated_level: [] },
  { id: 'user-4', username: null, full_name: 'João Pedro', instagram_handle: 'jp_oficial', avatar_url: '', gender: 'male', city: 'Rio de Janeiro', state: 'RJ', curated_level: [] },
  { id: 'user-5', username: null, full_name: 'Fernanda Costa', instagram_handle: 'nanda.costa', avatar_url: '', gender: 'female', city: 'São Paulo', state: 'SP', curated_level: [] },
];

interface CommunityManageProps {
  community: Community;
  events: Event[];
  onCreateEvent: () => void;
  currentUser: User;
  onSelectEvent?: (eventId: string) => void;
  onEditEvent?: (eventId: string) => void;
  customRoles?: CustomRole[];
}

export const CommunityManage: React.FC<CommunityManageProps> = ({
  community, events, onCreateEvent, currentUser, onSelectEvent, onEditEvent, customRoles = []
}) => {
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'LOGS' | 'FINANCE'>('OVERVIEW');
  const [showArchived, setShowArchived] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesSearch, setLikesSearch] = useState('');
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<MemberProfile | null>(null);

  const roleLower = currentUser?.role?.toLowerCase() || 'guest';
  const isMasterByEmail = currentUser?.email?.toLowerCase() === 'vanta.master.app@gmail.com';
  const isHighStaff = isMasterByEmail || ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor'].includes(roleLower);

  const unitEvents = events.filter(e => {
    const isFromThisCommunity = e.communityId === community.id;
    if (!isFromThisCommunity) return false;
    const expired = isEventExpired(e);
    if (showArchived && !expired) return false;
    if (!showArchived && expired) return false;
    if (isHighStaff) return true;
    return (e.staff || []).some(member => member.id === currentUser?.id);
  });

  const totalTickets = unitEvents.reduce((acc, curr) => acc + (curr.rsvps || 0), 0);
  const estimatedRevenue = unitEvents.reduce((acc, curr) => acc + ((curr.rsvps || 0) * 150), 0);

  const myFriendsIds = useMemo(() => {
    if (!currentUser) return new Set();
    const friendsMap = friendshipStore.getAll();
    const ids = Object.keys(friendsMap).filter(id => friendsMap[id] === 'friends');
    return new Set(ids);
  }, [currentUser]);

  const allLikers = useMemo(() => {
    let list = [...MOCK_LIKERS];
    if (isLiked && currentUser) {
      // Fixed: Added required 'username' property to meAsMember to conform to MemberProfile interface
      const meAsMember: MemberProfile = {
        id: currentUser.id,
        username: currentUser.username,
        full_name: currentUser.fullName,
        instagram_handle: currentUser.instagram,
        avatar_url: currentUser.avatar,
        gender: currentUser.gender,
        city: 'Rio de Janeiro',
        state: 'RJ',
        curated_level: currentUser.curatedLevel
      };
      if (!list.find(u => u.id === currentUser.id)) list = [meAsMember, ...list];
    } else if (!isLiked && currentUser) {
      list = list.filter(u => u.id !== currentUser.id);
    }
    return list;
  }, [isLiked, currentUser]);

  const socialText = useMemo(() => {
    const totalLikes = allLikers.length;
    if (totalLikes === 0) return "Seja o primeiro a curtir";
    const mutuals = allLikers.filter(u => myFriendsIds.has(u.id) && u.id !== currentUser?.id);
    if (isLiked) {
      if (totalLikes === 1) return "Curtido por você";
      if (mutuals.length > 0) return `Curtido por você, @${mutuals[0].instagram_handle} e outros ${totalLikes - 2 > 0 ? totalLikes - 2 : ''}`.replace(/ e outros $/, '');
      return `Curtido por você e outros ${totalLikes - 1}`;
    } else {
      if (mutuals.length > 0) {
        if (mutuals.length === 1) return `Curtido por @${mutuals[0].instagram_handle} e outros ${totalLikes - 1}`;
        return `Curtido por @${mutuals[0].instagram_handle}, @${mutuals[1].instagram_handle} e outros ${totalLikes - 2}`;
      }
      if (totalLikes === 1) return `Curtido por @${allLikers[0].instagram_handle}`;
      return `Curtido por @${allLikers[0].instagram_handle} e outros ${totalLikes - 1}`;
    }
  }, [isLiked, allLikers, myFriendsIds, currentUser]);

  const handleToggleLike = () => {
    if (!currentUser) {
      vantaFeedback.toast('info', 'Acesso Restrito', 'Faça login para interagir com comunidades.');
      return;
    }
    setIsLiked(!isLiked);
  };

  const renderedLikersList = useMemo(() => {
    let list = allLikers;
    if (likesSearch.trim()) {
      const q = likesSearch.toLowerCase();
      list = list.filter(u => (u.full_name?.toLowerCase() || '').includes(q) || (u.instagram_handle?.toLowerCase() || '').includes(q));
    }
    return list.sort((a, b) => {
      const aIsFriend = myFriendsIds.has(a.id) ? 1 : 0;
      const bIsFriend = myFriendsIds.has(b.id) ? 1 : 0;
      const aIsMe = a.id === currentUser?.id ? 2 : 0;
      const bIsMe = b.id === currentUser?.id ? 2 : 0;
      return (bIsMe + bIsFriend) - (aIsMe + aIsFriend);
    });
  }, [allLikers, likesSearch, myFriendsIds, currentUser]);

  if (selectedMemberProfile) {
    return <MemberProfileView member={selectedMemberProfile} onBack={() => setSelectedMemberProfile(null)} />;
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex items-center gap-6 p-8 bg-zinc-950 border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="w-20 h-20 rounded-2xl border-2 border-[#d4af37]/20 p-1 bg-black overflow-hidden shrink-0 z-10">
          {community.image_url ? (
  <img src={community.image_url} alt="" className="w-full h-full object-cover" />
) : (
  <div className="w-full h-full bg-zinc-900" />
)}

        </div>
        <div className="flex-1 min-w-0 z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.4em] block">{community.type}</span>
              <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
              <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest truncate max-w-[100px]">{community.city || 'GLOBAL'}</span>
            </div>
            <button 
              onClick={handleToggleLike}
              className={`p-2 rounded-full border transition-all active:scale-90 ${isLiked ? 'bg-red-600/10 border-red-600/30 text-red-500' : 'bg-zinc-900 border-white/5 text-zinc-600 hover:text-white'}`}
            >
              <HeartIcon filled={isLiked} className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-3xl font-serif italic text-white tracking-tighter uppercase truncate">{community.name}</h2>
          <button 
            onClick={() => setShowLikesModal(true)}
            className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#d4af37] transition-colors"
          >
            {allLikers.length > 0 && (
              <div className="flex -space-x-1.5">
                {allLikers.slice(0, 3).map((u, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-black overflow-hidden">
                    <img src={u.avatar_url || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <span>{socialText}</span>
          </button>

          {isHighStaff && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => (window as any).__VANTA_NAV_TO__?.('UNIT_STAFF_MGMT')} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/5 px-3 py-1.5 rounded-full border border-[#d4af37]/20 active:scale-95 transition-all">
                <ICONS.User className="w-3 h-3" /> Minha Equipe
              </button>
            </div>
          )}
        </div>
      </div>

      {isHighStaff && (
        <div className="flex gap-6 border-b border-white/5 px-4 overflow-x-auto no-scrollbar">
           {[{ id: 'OVERVIEW', label: 'Agenda' }, { id: 'FINANCE', label: 'Faturamento' }, { id: 'LOGS', label: 'Auditoria Local' }].map(tab => (
             <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] relative transition-all ${activeView === tab.id ? 'text-white' : 'text-zinc-600'}`}>
               {tab.label}
               {activeView === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}
             </button>
           ))}
        </div>
      )}

      {activeView === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.4em] italic">{showArchived ? 'ARQUIVO DE SESSÕES' : 'SESSÕES DA UNIDADE'}</h3>
            <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest border transition-all ${showArchived ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-zinc-900 text-zinc-500 border-white/5'}`}>
              {showArchived ? 'Ver Ativos' : 'Ver Arquivo'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {unitEvents.map(event => (
              <div key={event.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 relative">
                    <img src={event.image} className="w-full h-full object-cover" alt="" />
                    {showArchived && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-[6px] font-black text-white">HISTÓRICO</span></div>}
                  </div>
                  <div className="min-w-0"><h4 className="text-[11px] font-black text-white uppercase tracking-widest truncate">{event.title}</h4><p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">{event.startDate} • {event.startTime}</p></div>
                </div>
                <div className="flex gap-2">
                  {isHighStaff && !showArchived && <button onClick={(e) => { e.stopPropagation(); onEditEvent?.(event.id); }} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>}
                  <button onClick={() => onSelectEvent?.(event.id)} className="px-6 py-3 bg-white text-black text-[8px] font-black uppercase rounded-full shadow-lg active:scale-90 transition-all shrink-0">{showArchived ? "Ver Dossiê" : "Mission Control"}</button>
                </div>
              </div>
            ))}
          </div>
          {isHighStaff && !showArchived && <div className="pt-6"><div className="p-10 bg-zinc-900/40 border border-[#d4af37]/10 rounded-[3rem] flex flex-col items-center text-center space-y-6"><div className="w-16 h-16 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/20 flex items-center justify-center"><ICONS.Plus className="w-6 h-6 text-[#d4af37]" /></div><button onClick={onCreateEvent} className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-90 transition-all">Criar nova sessão</button></div></div>}
        </div>
      )}

      {activeView === 'FINANCE' && isHighStaff && (
        <div className="space-y-10 animate-in fade-in duration-700">
           <div className="p-8 bg-zinc-900/60 border border-white/5 rounded-[3rem] space-y-8 shadow-xl">
              <div className="flex flex-col gap-1"><h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">INTELIGÊNCIA FINANCEIRA</h3><p className="text-xl font-serif italic text-white">Consolidado da Unidade</p></div>
              <div className="grid grid-cols-2 gap-4"><div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-2"><span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Tickets Totais</span><p className="text-2xl font-serif italic text-white">{totalTickets.toLocaleString('pt-BR')}</p></div><div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-2"><span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Estimativa de Receita</span><p className="text-2xl font-serif italic text-[#d4af37]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(estimatedRevenue)}</p></div></div>
           </div>
           <AdminAuditLogs communityId={community.id} category="FINANCE" title="Logs Financeiros da Unidade" />
        </div>
      )}

      {activeView === 'LOGS' && isHighStaff && <AdminAuditLogs communityId={community.id} title={`Black Box de ${community.name}`} />}

      {showLikesModal && (
        <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/50"><div className="flex flex-col gap-1"><span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">ENGAJAMENTO</span><h3 className="text-xl font-serif italic text-white uppercase tracking-tighter">Curtidas</h3></div><button onClick={() => setShowLikesModal(false)} className="p-3 bg-zinc-900 rounded-full border border-white/10 active:scale-90 transition-all"><span className="text-zinc-500 text-[10px] font-black">X</span></button></header>
          <div className="p-6 border-b border-white/5"><div className="relative"><ICONS.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" /><input type="text" value={likesSearch} onChange={e => setLikesSearch(e.target.value)} placeholder="BUSCAR POR NOME OU @" className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[9px] text-white uppercase tracking-widest outline-none focus:border-[#d4af37]/30" /></div></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
             {renderedLikersList.map(user => (
               <button key={user.id} onClick={() => setSelectedMemberProfile(user)} className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all active:scale-95 text-left"><div className={`w-12 h-12 rounded-full border p-0.5 bg-black overflow-hidden shrink-0 ${myFriendsIds.has(user.id) || user.id === currentUser?.id ? 'border-[#d4af37]' : 'border-white/10'}`}><VantaAvatar src={user.avatar_url} gender={user.gender} /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h4 className="text-[10px] font-black text-white uppercase truncate">{user.full_name}</h4>{user.id === currentUser?.id && <span className="text-[5px] bg-[#d4af37] text-black px-1.5 py-0.5 rounded-full font-black">VOCÊ</span>}</div><p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">@{user.instagram_handle}</p></div><div className="text-zinc-600"><ICONS.ArrowLeft className="w-3 h-3 rotate-180" /></div></button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
