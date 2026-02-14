
import React from 'react';
import { VantaAvatar } from '../VantaAvatar';
import { MemberProfile } from '../../lib/membersApi';

interface EventSocialProofProps {
  confirmedFriends: any[]; // Usando any para flexibilidade com dados do Supabase, idealmente seria MemberProfile estendido
  presenceMap: Set<string>;
  onMemberClick: (id: string) => void;
}

export const EventSocialProof: React.FC<EventSocialProofProps> = ({ 
  confirmedFriends, presenceMap, onMemberClick 
}) => {
  if (confirmedFriends.length === 0) return null;

  return (
    <div className="p-6 bg-zinc-900/40 border border-[#d4af37]/20 rounded-3xl space-y-4 shadow-[0_0_40px_rgba(212,175,55,0.05)]">
      <div className="flex justify-between items-center">
        <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.3em] block">Amigos nesta sessão</span>
        {presenceMap.size > 0 && (
          <span className="px-2 py-0.5 bg-[#d4af37]/10 rounded-full text-[5px] text-[#d4af37] font-black uppercase tracking-widest animate-pulse">
            Ativo na Noite
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-3 overflow-hidden">
          {confirmedFriends.map((friend) => {
            const isAtivo = presenceMap.has(friend.id);
            return (
              <button 
                key={friend.id} 
                onClick={() => onMemberClick(friend.id)} 
                className={`w-11 h-11 rounded-full border-2 overflow-hidden bg-zinc-800 transition-all active:scale-90 ${
                  isAtivo ? 'border-[#d4af37] z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-black'
                }`}
              >
                <VantaAvatar src={friend.avatar_url} gender={friend.gender} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
