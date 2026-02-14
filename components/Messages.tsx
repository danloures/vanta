
import React from "react";
import type { User } from "../types";
import { useSocialLogic } from "../hooks/useSocialLogic";

// VANTA_SOCIAL_FRAGMENTS: Importação de componentes atômicos
import { SocialHeader } from "./social/SocialHeader";
import { ConversationList } from "./social/ConversationList";
import { FriendList } from "./social/FriendList";
import { ChatInterface } from "./social/ChatInterface";

type Props = {
  currentUser?: User | null;
  conversations: any[];
  setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  activeConversationId: string | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function Messages({ currentUser, activeConversationId, setActiveConversationId, conversations, setConversations }: Props) {
  const logic = useSocialLogic(currentUser, conversations, setConversations, activeConversationId, setActiveConversationId);
  const isRestricted = !!currentUser?.isGloballyRestricted;

  if (isRestricted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-10 text-center space-y-8 animate-in fade-in duration-1000">
        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-red-900/30 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-pulse">⚖️</div>
        <div className="space-y-4">
           <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter">Comunicação Suspensa</h2>
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
             Seu privilégio social foi temporariamente revogado pelo Conselho de Ética.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black h-full overflow-hidden animate-in fade-in duration-500">
      {!activeConversationId ? (
        <>
          <SocialHeader 
            activeTab={logic.activeTab} 
            setActiveTab={logic.setActiveTab} 
            searchQuery={logic.activeTab === 'MENSAGENS' ? logic.msgSearchQuery : logic.friendSearchQuery}
            setSearchQuery={logic.activeTab === 'MENSAGENS' ? logic.setMsgSearchQuery : logic.setFriendSearchQuery}
          />
          <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-10">
            {logic.activeTab === 'MENSAGENS' ? (
              <ConversationList 
                conversations={logic.filteredConversations} 
                activePresence={logic.activePresence} 
                onSelect={setActiveConversationId} 
              />
            ) : (
              <FriendList 
                friends={logic.filteredFriends} 
                activePresence={logic.activePresence} 
                onChat={(id) => { setActiveConversationId(id); logic.setActiveTab('MENSAGENS'); }} 
              />
            )}
          </div>
        </>
      ) : (
        <ChatInterface 
          currentUser={currentUser!} 
          activeConversation={conversations.find(c => c.id === activeConversationId)} 
          messages={logic.messages} 
          isTyping={logic.isTyping} 
          isLoading={logic.isLoading} 
          draft={logic.draft} 
          setDraft={logic.setDraft} 
          onSend={logic.handleSendMessage} 
          onTyping={logic.handleTyping} 
          onBack={() => setActiveConversationId(null)} 
          activePresence={logic.activePresence}
        />
      )}
    </div>
  );
}
