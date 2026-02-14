
import React from 'react';
import { VantaAvatar } from '../VantaAvatar';
import { deepLinkStore } from '../../lib/deepLinkStore';

interface FriendListProps {
  friends: any[];
  activePresence: Set<string>;
  onChat: (id: string) => void;
}

export const FriendList: React.FC<FriendListProps> = ({ friends, activePresence, onChat }) => {
  if (friends.length === 0) {
    return (
      <div className="py-20 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma conexão encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map(friend => {
        const isPresent = activePresence.has(friend.id);
        return (
          <div key={friend.id} className="flex items-center gap-6 p-5 bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
            <div className={`w-16 h-16 rounded-full border p-1 flex-shrink-0 bg-zinc-900 overflow-hidden transition-all ${isPresent ? 'border-[#d4af37]' : 'border-white/10'}`}>
              <VantaAvatar src={friend.avatar_url} gender={friend.gender} />
            </div>
            <div className="flex-1 min-w-0">
              <button onClick={() => deepLinkStore.setOpenMemberProfile(friend.id)} className="text-white text-[12px] font-black uppercase tracking-widest truncate hover:text-[#d4af37] transition-colors">{friend.full_name}</button>
              <div className="flex items-center gap-2">
                 <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest truncate">{friend.status === 'friends' ? 'AMIGO VERIFICADO' : 'AGUARDANDO APROVAÇÃO'}</p>
                 {isPresent && <span className="text-[#d4af37] text-[6px] font-black uppercase italic">Ativo na Noite</span>}
              </div>
            </div>
            {friend.status === 'friends' && (
              <button onClick={() => onChat(friend.id)} className="px-4 py-2 bg-white text-black text-[7px] font-black uppercase rounded-full active:scale-95">Conversar</button>
            )}
          </div>
        );
      })}
    </div>
  );
};
