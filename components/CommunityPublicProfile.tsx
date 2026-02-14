
import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { User, Event } from '../types';
import { VantaAvatar } from './VantaAvatar';
import { deepLinkStore } from '../lib/deepLinkStore';
import { friendshipStore } from '../lib/friendshipStore';

// --- MOCK DATA & TYPES ---
interface Liker {
  id: string;
  fullName: string;
  instagramHandle: string;
  avatarUrl: string;
}

// Mock inicial de quem curtiu
const MOCK_LIKES: Liker[] = [
  { id: 'u1', fullName: 'Julia Costa', instagramHandle: 'juju.costa', avatarUrl: '' },
  { id: 'u2', fullName: 'Marcos Silva', instagramHandle: 'marcos.s', avatarUrl: '' },
  { id: 'u3', fullName: 'Beatriz Almeida', instagramHandle: 'bia.almeida', avatarUrl: '' },
  { id: 'u4', fullName: 'Rafael Torres', instagramHandle: 'rafa.torres', avatarUrl: '' },
  { id: 'u5', fullName: 'Camila Rocha', instagramHandle: 'camila.r', avatarUrl: '' },
];

interface CommunityPublicProfileProps {
  event: Event; // Usado para derivar dados da comunidade (já que não temos getCommunityById público ainda)
  currentUser: User;
  onClose: () => void;
}

export const CommunityPublicProfile: React.FC<CommunityPublicProfileProps> = ({ event, currentUser, onClose }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showLikesList, setShowLikesList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Dados da Comunidade (Derivados do Evento por enquanto)
  const communityData = {
    id: event.communityId,
    name: "COMUNIDADE VANTA", // Placeholder, idealmente viria de um fetchCommunity(event.communityId)
    logo: event.image, // Placeholder usando img do evento
    description: "Espaço exclusivo de conexões e experiências de alto nível.",
    followers: 1240,
    isOfficial: true
  };

  // 2. Lógica de Amigos Mútuos
  const myFriendsIds = useMemo(() => {
    const friendsMap = friendshipStore.getAll();
    return new Set(Object.keys(friendsMap).filter(id => friendsMap[id] === 'friends'));
  }, []);

  // 3. Lista Combinada de Likes
  const allLikers = useMemo(() => {
    let list = [...MOCK_LIKES];
    
    // Adiciona o usuário atual se curtiu
    if (isLiked) {
      list.unshift({
        id: currentUser.id,
        fullName: currentUser.fullName,
        instagramHandle: currentUser.instagram,
        avatarUrl: currentUser.avatar
      });
    }
    return list;
  }, [isLiked, currentUser]);

  // 4. Texto Social Proof
  const socialText = useMemo(() => {
    const total = allLikers.length;
    if (total === 0) return "Seja o primeiro a curtir";

    // Busca amigos na lista de likes
    const mutuals = allLikers.filter(u => myFriendsIds.has(u.id) && u.id !== currentUser.id);
    
    if (isLiked) {
      if (total === 1) return "Curtido por você";
      if (mutuals.length > 0) return `Curtido por você, @${mutuals[0].instagramHandle} e outros ${total - 2 > 0 ? total - 2 : ''}`.replace(/ e outros $/, '');
      return `Curtido por você e outros ${total - 1}`;
    } else {
      if (mutuals.length > 0) {
        if (mutuals.length === 1) return `Curtido por @${mutuals[0].instagramHandle} e outros ${total - 1}`;
        return `Curtido por @${mutuals[0].instagramHandle}, @${mutuals[1].instagramHandle} e outros ${total - 2}`;
      }
      return `Curtido por @${allLikers[0].instagramHandle} e outros ${total - 1}`;
    }
  }, [isLiked, allLikers, myFriendsIds]);

  // 5. Lista Filtrada e Ordenada para o Modal
  const displayedLikers = useMemo(() => {
    let list = allLikers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => u.fullName.toLowerCase().includes(q) || u.instagramHandle.toLowerCase().includes(q));
    }
    
    // Ordenação: Amigos -> Resto
    return list.sort((a, b) => {
      const aIsFriend = myFriendsIds.has(a.id) ? 1 : 0;
      const bIsFriend = myFriendsIds.has(b.id) ? 1 : 0;
      const aIsMe = a.id === currentUser.id ? 2 : 0;
      const bIsMe = b.id === currentUser.id ? 2 : 0;
      return (bIsMe + bIsFriend) - (aIsMe + aIsFriend);
    });
  }, [allLikers, searchQuery, myFriendsIds, currentUser]);

  const handleMemberClick = (id: string) => {
    // Reusa a navegação global do AppLayout via Store
    deepLinkStore.setOpenMemberProfile(id);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black animate-in slide-in-from-right duration-500 overflow-y-auto no-scrollbar">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 p-6 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5 safe-top">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
          <ICONS.ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-[0.3em]">PERFIL DA COMUNIDADE</span>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center pt-10 px-8 pb-32 space-y-8">
        
        {/* IDENTIDADE */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-32 h-32 rounded-[2.5rem] border-2 border-[#d4af37]/30 p-1 overflow-hidden bg-zinc-900 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <img src={communityData.logo} className="w-full h-full object-cover rounded-[2rem]" alt="" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter">{communityData.name}</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{communityData.followers} SEGUIDORES</span>
              {communityData.isOfficial && <span className="text-[#d4af37] text-[10px]">Verify ✓</span>}
            </div>
          </div>
        </div>

        {/* SOCIAL ACTION BAR */}
        <div className="w-full bg-zinc-900/40 border border-white/5 rounded-[2rem] p-4 flex items-center justify-between">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all active:scale-95 ${isLiked ? 'bg-[#d4af37] text-black' : 'bg-black border border-white/10 text-white'}`}
          >
            <svg viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest">{isLiked ? 'CURTIDO' : 'CURTIR'}</span>
          </button>

          <button 
            onClick={() => setShowLikesList(true)}
            className="flex-1 flex justify-end items-center gap-3 active:opacity-60"
          >
            <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest text-right max-w-[120px] truncate">
              {socialText}
            </span>
            <div className="flex -space-x-2">
              {allLikers.slice(0, 2).map((u, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-black overflow-hidden bg-zinc-800">
                  <VantaAvatar src={u.avatarUrl} alt={u.fullName} />
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* DESCRIPTION */}
        <div className="w-full text-center">
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest leading-loose">
            {communityData.description}
          </p>
        </div>

        {/* MOCK GALLERY */}
        <div className="grid grid-cols-2 gap-3 w-full">
           <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5"></div>
           <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5"></div>
        </div>

      </div>

      {/* MODAL DE CURTIDAS */}
      {showLikesList && (
        <div className="fixed inset-0 z-[3100] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-6 border-b border-white/5 flex items-center justify-between bg-black/50">
             <div className="flex flex-col gap-1">
                <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.4em]">COMUNIDADE</span>
                <h3 className="text-xl font-serif italic text-white uppercase tracking-tighter">Curtidas</h3>
             </div>
             <button onClick={() => setShowLikesList(false)} className="w-10 h-10 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 active:scale-90">
                <span className="text-[10px] font-black">X</span>
             </button>
          </header>

          <div className="p-6 border-b border-white/5">
             <div className="relative">
                <ICONS.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="BUSCAR MEMBRO..."
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[9px] text-white uppercase tracking-widest outline-none focus:border-[#d4af37]/30"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
             {displayedLikers.length > 0 ? displayedLikers.map(user => {
               const isFriend = myFriendsIds.has(user.id);
               const isMe = user.id === currentUser.id;

               return (
                 <button 
                   key={user.id}
                   onClick={() => handleMemberClick(user.id)}
                   className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all active:scale-95 text-left"
                 >
                    <div className={`w-12 h-12 rounded-full border p-0.5 bg-black overflow-hidden shrink-0 ${isFriend || isMe ? 'border-[#d4af37]' : 'border-white/10'}`}>
                       <VantaAvatar src={user.avatarUrl} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-black text-white uppercase truncate">{user.fullName}</h4>
                          {isMe && <span className="text-[5px] bg-[#d4af37] text-black px-1.5 py-0.5 rounded-full font-black">VOCÊ</span>}
                          {isFriend && !isMe && <span className="text-[5px] bg-[#d4af37]/10 text-[#d4af37] px-1.5 py-0.5 rounded-full font-black border border-[#d4af37]/20">AMIGO</span>}
                       </div>
                       <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">@{user.instagramHandle}</p>
                    </div>
                    <ICONS.ArrowLeft className="w-3 h-3 text-zinc-600 rotate-180" />
                 </button>
               );
             }) : (
               <div className="py-20 text-center opacity-30">
                  <p className="text-[8px] font-black uppercase tracking-widest">Nenhum membro encontrado.</p>
               </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
};
