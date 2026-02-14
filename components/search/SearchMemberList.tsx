
import React from 'react';
import { MemberProfile } from '../../lib/membersApi';
import { FriendshipStatus } from '../../lib/friendshipStore';
import { VantaAvatar } from '../VantaAvatar';

interface SearchMemberListProps {
  members: MemberProfile[];
  isLoading: boolean;
  query: string;
  friendships: Record<string, FriendshipStatus>;
  onMemberClick: (member: MemberProfile) => void;
  onAction: (e: React.MouseEvent, id: string, status: FriendshipStatus) => void;
}

export const SearchMemberList: React.FC<SearchMemberListProps> = ({ 
  members, isLoading, query, friendships, onMemberClick, onAction 
}) => {
  return (
    <div className="space-y-4">
      {!query.trim() ? (
        <div className="h-64 flex flex-col items-center justify-center text-center px-8 space-y-6">
          <div className="w-12 h-12 rounded-full border border-zinc-800/30 flex items-center justify-center opacity-20">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-zinc-700"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-700 leading-relaxed max-w-[280px]">
            CONECTE-SE AO TOPO. ENCONTRE UM AMIGO PARA EXPANDIR SEU CÍRCULO.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
        </div>
      ) : members.length > 0 ? (
        members.map(member => {
          const status = friendships[member.id] || 'none';

          return (
            <div key={member.id} onClick={() => onMemberClick(member)} className="flex items-center gap-6 p-5 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] hover:bg-white/5 transition-all cursor-pointer active:scale-95">
              <div className="w-16 h-16 rounded-full border border-white/10 p-1 flex-shrink-0 bg-zinc-900 overflow-hidden">
                <VantaAvatar 
                  src={member.avatar_url} 
                  gender={member.gender} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{member.full_name || 'Membro'}</h3>
                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest truncate">@{member.instagram_handle || 'vanta_member'}</p>
              </div>
              <div className="flex items-center gap-2">
                {status === 'none' && (
                  <button onClick={(e) => onAction(e, member.id, 'outgoing')} className="px-4 py-2 bg-white text-black text-[7px] font-black uppercase rounded-full">Solicitar</button>
                )}
                {status === 'outgoing' && (
                  <button disabled className="px-4 py-2 bg-zinc-900 border border-white/5 text-zinc-500 text-[7px] font-black uppercase rounded-full">Solicitado</button>
                )}
                {status === 'incoming' && (
                  <div className="flex gap-1">
                    <button onClick={(e) => onAction(e, member.id, 'none')} className="w-8 h-8 rounded-full border border-red-900/20 flex items-center justify-center text-red-500 text-[8px]">✕</button>
                    <button onClick={(e) => onAction(e, member.id, 'friends')} className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black text-[8px]">✓</button>
                  </div>
                )}
                {status === 'friends' && (
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[7px] font-black uppercase rounded-full">Amigos</div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-20 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-widest">Nenhum membro encontrado</p>
        </div>
      )}
    </div>
  );
};
