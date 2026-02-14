
import React from 'react';
import { VantaAvatar } from '../VantaAvatar';

const CONCIERGE_ID = "vanta-concierge";

interface ConversationListProps {
  conversations: any[];
  activePresence: Set<string>;
  onSelect: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, activePresence, onSelect 
}) => {
  if (conversations.length === 0) {
    return (
      <div className="py-20 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map(conv => {
        const isPresent = activePresence.has(conv.participantId);
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="w-full flex items-center gap-6 p-5 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] hover:bg-white/5 transition-all text-left group"
          >
            <div className={`w-16 h-16 rounded-full border p-1 flex-shrink-0 bg-zinc-900 overflow-hidden relative transition-all ${isPresent ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}>
              {conv.id === CONCIERGE_ID ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <span className="text-xl font-serif italic text-[#d4af37]">V</span>
                </div>
              ) : (
                <VantaAvatar src={conv.avatar_url} gender={conv.gender} />
              )}
              {isPresent && <div className="absolute top-0 right-0 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{conv.participantName}</h3>
                {conv.unreadCount > 0 && <span className="px-2 py-0.5 bg-[#d4af37] text-black text-[7px] font-black rounded-full">{conv.unreadCount}</span>}
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest truncate ${conv.unreadCount > 0 ? 'text-[#d4af37]' : 'text-zinc-600'}`}>{conv.lastMessage}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
