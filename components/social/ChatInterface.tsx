
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { VantaAvatar } from '../VantaAvatar';
import { User } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const CONCIERGE_ID = "vanta-concierge";

interface ChatInterfaceProps {
  currentUser: User;
  activeConversation: any;
  messages: any[];
  isTyping: boolean;
  isLoading: boolean;
  draft: string;
  setDraft: (val: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onBack: () => void;
  activePresence: Set<string>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser, activeConversation, messages, isTyping, isLoading,
  draft, setDraft, onSend, onTyping, onBack, activePresence
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);

  const isConcierge = activeConversation?.id === CONCIERGE_ID;
  const isOnline = activePresence.has(activeConversation?.id);

  // VANTA_REALTIME: Reset do buffer ao trocar de conversa
  useEffect(() => {
    setRealtimeMessages([]);
  }, [activeConversation?.id]);

  // VANTA_REALTIME: Assinatura do Canal
  useEffect(() => {
    if (!activeConversation?.id || !currentUser?.id || isConcierge) return;

    const channel = supabase.channel(`chat_interface:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new;
          const otherId = activeConversation.id;
          const myId = currentUser.id;

          // Filtro de Relevância: Garante que a mensagem pertence a esta conversa específica
          // (Seja enviada por mim em outro dispositivo, ou enviada pelo outro usuário)
          const isRelevant = 
            (newMsg.sender_id === myId && newMsg.receiver_id === otherId) ||
            (newMsg.sender_id === otherId && newMsg.receiver_id === myId);

          if (isRelevant) {
            setRealtimeMessages((prev) => {
              // De-duplicação preventiva contra o próprio buffer
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation?.id, currentUser.id, isConcierge]);

  // VANTA_LOGIC: Fusão de Fontes (Props + Realtime) com De-duplicação
  const displayMessages = useMemo(() => {
    const combined = [...messages, ...realtimeMessages];
    const uniqueMap = new Map();
    
    combined.forEach(msg => {
      // Prioriza a mensagem mais recente se houver conflito de ID (ex: atualização de status)
      uniqueMap.set(msg.id, msg);
    });

    return Array.from(uniqueMap.values()).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, realtimeMessages]);

  // Scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [displayMessages.length, isTyping]);

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-500 h-full">
      <header className="px-6 pt-16 pb-6 border-b border-white/5 flex items-center gap-4 bg-black/80 backdrop-blur-xl">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current rotate-180"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full border p-0.5 bg-zinc-900 overflow-hidden transition-all ${isOnline ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}>
            {isConcierge ? (
              <div className="w-full h-full flex items-center justify-center bg-black"><span className="text-sm font-serif italic text-[#d4af37]">V</span></div>
            ) : (
              <VantaAvatar src={activeConversation?.avatar_url} gender={activeConversation?.gender} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-[11px] font-black uppercase tracking-widest truncate">{activeConversation?.participantName}</h3>
            <div className="flex items-center gap-2">
               <div className={`w-1 h-1 rounded-full transition-all duration-500 ${isTyping ? 'bg-[#d4af37] animate-pulse scale-150' : isOnline ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
               <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-widest italic">
                {isConcierge ? 'Vanta AI Support' : isTyping ? 'Digitando...' : isOnline ? 'Online' : 'Visto recentemente'}
               </span>
            </div>
          </div>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {displayMessages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] p-4 rounded-3xl text-[11px] leading-relaxed ${isMe ? 'bg-white text-black rounded-tr-none shadow-lg' : 'bg-zinc-900 text-white rounded-tl-none border border-white/5'}`}>
                {msg.text}
                <div className={`text-[6px] mt-1 opacity-40 font-black uppercase ${isMe ? 'text-black' : 'text-zinc-500'}`}>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl flex gap-1 items-center">
              <div className="w-1 h-1 bg-[#d4af37] rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <footer className="p-6 bg-black border-t border-white/5 pb-10">
        <div className="relative">
          <input
            type="text"
            value={draft}
            onChange={e => { setDraft(e.target.value); onTyping(); }}
            onKeyDown={e => e.key === 'Enter' && onSend()}
            placeholder="ESCREVA SUA MENSAGEM..."
            className="w-full bg-zinc-900 border border-white/5 rounded-full py-5 pl-8 pr-16 text-[10px] text-white uppercase tracking-widest outline-none focus:border-white/20 transition-all shadow-inner"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-20 shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
};
