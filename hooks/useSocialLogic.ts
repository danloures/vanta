
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getVantaConciergeResponse } from '../services/geminiService';
import { User } from '../types';
import { notificationStore } from '../lib/notificationStore';

const CONCIERGE_ID = "vanta-concierge";

// VANTA_VIRTUALIZATION: Entidade estática imutável.
// Garante presença 100% livre de erros de banco de dados.
const CONCIERGE_ITEM = {
  id: CONCIERGE_ID,
  participantId: CONCIERGE_ID,
  participantName: "Vanta Concierge",
  avatar_url: '',
  lastMessage: "Em que posso ajudar?",
  unreadCount: 0,
  timestamp: 8640000000000000 // Timestamp infinito para manter fixado no topo
};

export const useSocialLogic = (
  currentUser: User | null | undefined,
  conversations: any[],
  setConversations: React.Dispatch<React.SetStateAction<any[]>>,
  activeConversationId: string | null,
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MENSAGENS' | 'AMIGOS'>('MENSAGENS');
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [activePresence, setActivePresence] = useState<Set<string>>(new Set());
  
  const typingTimerRef = useRef<any>(null);
  const lastTypingSignalRef = useRef<number>(0);

  useEffect(() => {
    if (currentUser) {
      loadSocialData();
      checkAllPresence();
      const channel = subscribeToRealtime();
      return () => { 
        if (channel) supabase.removeChannel(channel); 
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeConversationId && currentUser) {
      loadMessages(activeConversationId);
      // VANTA_NOTIFICATIONS: Limpa notificações visuais ao entrar na conversa
      notificationStore.markMessagesAsRead(activeConversationId);
      
      setMsgSearchQuery("");
      setFriendSearchQuery("");
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, unreadCount: 0 } : c));
    }
  }, [activeConversationId, currentUser]);

  const checkAllPresence = async () => {
    if (!supabase || !currentUser) return;
    const { data } = await supabase
      .from('event_rsvps')
      .select('user_id, events(start_at, end_at)')
      .eq('status', 'going');
    
    if (data) {
      const now = new Date();
      const activeIds = data.filter((d: any) => {
        if (!d.events) return false;
        const start = new Date(d.events.start_at);
        const end = d.events.end_at ? new Date(d.events.end_at) : new Date(start.getTime() + 8 * 60 * 60 * 1000);
        return now >= start && now <= end;
      }).map((d: any) => d.user_id);
      setActivePresence(new Set(activeIds));
    }
  };

  const loadSocialData = async () => {
    if (!currentUser || !supabase) return;
    
    try {
      const { data: friendshipData, error } = await supabase
        .from('friendships')
        .select(`
          status, 
          user_id, 
          friend_id, 
          profiles:friendships_friend_id_fkey(id, full_name, instagram_handle, avatar_url, gender), 
          requester:friendships_user_id_fkey(id, full_name, instagram_handle, avatar_url, gender)
        `)
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);

      if (error) throw error;

      // VANTA_SANITIZATION: Blindagem contra dados nulos ou corrompidos
      const mappedFriends = (friendshipData || []).map(f => {
        const isRequester = f.user_id === currentUser.id;
        const otherProfile = isRequester ? (f as any).profiles : (f as any).requester;

        // CRITICAL FIX: Verifica se o perfil existe antes de acessar propriedades.
        // Isso previne o erro "null is not an object" que quebrava a tela branca.
        if (!otherProfile || !otherProfile.id) return null;

        return {
          id: otherProfile.id,
          full_name: otherProfile.full_name,
          avatar_url: otherProfile.avatar_url,
          gender: otherProfile.gender,
          status: f.status,
          isOutgoing: isRequester
        };
      }).filter(Boolean); // Remove entradas nulas geradas por dados corrompidos

      setFriendsList(mappedFriends);

      const mutualFriends = mappedFriends.filter(f => f.status === 'friends');
      
      const convs = await Promise.all(mutualFriends.map(async f => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('text, created_at')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${f.id}),and(sender_id.eq.${f.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: f.id,
          participantId: f.id,
          participantName: f.full_name,
          avatar_url: f.avatar_url,
          gender: f.gender,
          lastMessage: lastMsg?.text || "Inicie uma conversa",
          unreadCount: 0,
          timestamp: lastMsg ? new Date(lastMsg.created_at).getTime() : 0
        };
      }));

      // VANTA_INJECTION: Concierge é injetado como prioridade 0 (Topo Absoluto)
      // Mescla com conversas reais, garantindo que o Concierge nunca desapareça.
      setConversations([CONCIERGE_ITEM, ...convs]);

    } catch (err) {
      console.error("[VANTA SOCIAL] Erro na sincronização:", err);
      // VANTA_FAILSAFE: Garante que o Concierge esteja presente mesmo em falha total de rede ou banco
      setConversations(prev => {
        if (prev.some(c => c.id === CONCIERGE_ID)) return prev;
        return [CONCIERGE_ITEM, ...prev];
      });
    }
  };

  const loadMessages = async (otherId: string) => {
    if (!currentUser || !supabase) return;

    // VANTA_VIRTUAL_CHAT: Intercepta ID do Concierge para não consultar o banco
    if (otherId === CONCIERGE_ID) {
      setMessages([{ 
        id: 'c1', 
        sender_id: CONCIERGE_ID, 
        text: "Bem-vindo ao Vanta Concierge. Como posso elevar sua experiência hoje?", 
        created_at: new Date().toISOString() 
      }]);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
    setIsLoading(false);
  };

  const subscribeToRealtime = () => {
    if (!supabase || !currentUser) return null;
    
    return supabase
      .channel(`social_events_${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, (payload) => {
        const senderId = payload.new.sender_id;
        
        setConversations(prev => {
          // Não processa atualizações para o Concierge virtual via realtime do banco
          if (senderId === CONCIERGE_ID) return prev;

          const existing = prev.find(c => c.id === senderId);
          
          // Reordena a conversa atualizada para o topo (abaixo do Concierge se necessário, ou lógica de sort na UI)
          const otherConvs = prev.filter(c => c.id !== senderId && c.id !== CONCIERGE_ID);
          
          let updatedConv;
          if (existing) {
            updatedConv = { ...existing, lastMessage: payload.new.text, unreadCount: activeConversationId === senderId ? 0 : existing.unreadCount + 1, timestamp: Date.now() };
          } else {
             // Caso seja uma nova conversa não mapeada (edge case), ignora ou força reload.
             // Aqui mantemos simples para não quebrar a lógica de lista estática.
             return prev;
          }

          // Mantém Concierge sempre no índice 0, seguido pela conversa atualizada, seguido pelas outras
          return [CONCIERGE_ITEM, updatedConv, ...otherConvs];
        });

        if (senderId === activeConversationId) {
          setMessages(prev => [...prev, payload.new]);
          setIsTyping(false);
          notificationStore.markMessagesAsRead(senderId);
        }
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload.senderId === activeConversationId) {
          setIsTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();
  };

  const handleTyping = () => {
    if (!supabase || !activeConversationId || activeConversationId === CONCIERGE_ID) return;
    const now = Date.now();
    if (now - lastTypingSignalRef.current < 2000) return;
    
    lastTypingSignalRef.current = now;
    supabase.channel(`social_events_${activeConversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { senderId: currentUser?.id }
    });
  };

  const handleSendMessage = async () => {
    if (!draft.trim() || !activeConversationId || !currentUser || !supabase) return;

    const userText = draft.trim();
    setDraft("");

    if (activeConversationId === CONCIERGE_ID) {
      // Lógica Local do Concierge (Virtualizada)
      const userMsg = { id: Date.now().toString(), sender_id: currentUser.id, text: userText, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);
      
      setIsLoading(true);
      
      // Histórico local para contexto do Gemini
      const history = messages.map(m => ({
        role: (m.sender_id === CONCIERGE_ID ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.text }]
      }));
      
      const botResponse = await getVantaConciergeResponse(userText, history);
      setIsLoading(false);
      
      const botMsg = { id: (Date.now() + 1).toString(), sender_id: CONCIERGE_ID, text: botResponse, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, botMsg]);
    } else {
      // Lógica Real do Chat (Banco de Dados)
      const { data, error } = await supabase
        .from('messages')
        .insert([{ sender_id: currentUser.id, receiver_id: activeConversationId, text: userText }])
        .select()
        .single();

      if (!error && data) {
        setMessages(prev => [...prev, data]);
        setConversations(prev => {
          const conv = prev.find(c => c.id === activeConversationId);
          if (conv) {
            // Reposiciona conversa ativa abaixo do Concierge
            const others = prev.filter(c => c.id !== activeConversationId && c.id !== CONCIERGE_ID);
            return [CONCIERGE_ITEM, { ...conv, lastMessage: userText, timestamp: Date.now() }, ...others];
          }
          return prev;
        });

        await notificationStore.addNotification(
          'message', 
          activeConversationId, 
          currentUser.fullName, 
          { action_type: 'message_received' }
        );
      }
    }
  };

  const filteredConversations = useMemo(() => {
    // Garante que o Concierge esteja sempre presente e no topo, independente da ordenação por timestamp
    const realConvs = conversations.filter(c => c.id !== CONCIERGE_ID).sort((a, b) => b.timestamp - a.timestamp);
    
    // Injeção forçada do Concierge na lista filtrada
    let list = [CONCIERGE_ITEM, ...realConvs];

    if (!msgSearchQuery.trim()) return list;
    const q = msgSearchQuery.toLowerCase();
    
    // Filtra, mas mantém o Concierge se ele der match OU se a intenção for buscar qualquer coisa
    // Para simplificar e garantir a presença, vamos filtrar a lista mas sempre recolocar o Concierge no topo se ele der match
    const filtered = list.filter(c => c.participantName.toLowerCase().includes(q));
    
    // Se o usuário buscar por algo que não é o concierge, o concierge some (comportamento correto de busca)
    // Mas se limpar a busca, ele volta (garantido pela lista base acima).
    return filtered;
  }, [conversations, msgSearchQuery]);

  const filteredFriends = useMemo(() => {
    if (!friendSearchQuery.trim()) return friendsList;
    const q = friendSearchQuery.toLowerCase();
    return friendsList.filter(f => f.full_name.toLowerCase().includes(q));
  }, [friendsList, friendSearchQuery]);

  return {
    messages, friendsList, activeTab, draft, isLoading, isTyping,
    msgSearchQuery, friendSearchQuery, activePresence,
    setActiveTab, setDraft, setMsgSearchQuery, setFriendSearchQuery,
    handleSendMessage, handleTyping, filteredConversations, filteredFriends
  };
};
