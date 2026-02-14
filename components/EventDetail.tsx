import React, { useState, useEffect, useRef } from 'react';
import { Event, User, TicketBatch, TicketVariation } from '../types';
import { profileStore } from '../features/profile/profileState';
import { supabase } from '../lib/supabaseClient';
import { getMyRsvp, setGoing } from '../lib/rsvpApi';
import { VipInviteOverlay } from './VipInviteOverlay';
import { deepLinkStore } from '../lib/deepLinkStore';
import { friendshipStore } from '../lib/friendshipStore';
import { getSalesCounts, issueTicket } from '../lib/ticketsApi';
import { vantaFeedback } from '../lib/feedbackStore';

// Sub-componentes
import { EventHeader } from './event/EventHeader';
import { EventSocialProof } from './event/EventSocialProof';
import { EventActionPanel } from './event/EventActionPanel';
import { TicketPurchaseOverlay } from './event/TicketPurchaseOverlay';
import { CommunityPublicProfile } from './CommunityPublicProfile'; // Novo Componente

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  currentUser?: User | null;
  requestAuth?: () => void;
  onRequireAuth?: (featureName: string) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ event, onBack, currentUser, onRequireAuth }) => {
  const [isConfirmed, setIsConfirmed] = useState(profileStore.userData.confirmedEventIds.includes(event.id));
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [salesCounts, setSalesCounts] = useState<Record<string, number>>({});
  const [confirmedFriends, setConfirmedFriends] = useState<any[]>([]);
  const [presenceMap, setPresenceMap] = useState<Set<string>>(new Set());
  const [showTicketsOverlay, setShowTicketsOverlay] = useState(false);
  
  // VANTA_COMMUNITY: Controle de exibição do perfil público
  const [showCommunityProfile, setShowCommunityProfile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const isRestricted = !!currentUser?.isGloballyRestricted;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [event.id]);

  useEffect(() => {
    const fetchRsvpStatus = async () => {
      if (!supabase || !currentUser) return;
      const { data: { user } } = await (supabase.auth as any).getUser();
      if (user) {
        setUserId(user.id);
        const status = await getMyRsvp(event.id, user.id);
        if (status === 'going') setIsConfirmed(true);
      }
    };
    const loadInventory = async () => {
      const counts = await getSalesCounts(event.id);
      setSalesCounts(counts);
    };
    fetchRsvpStatus();
    loadInventory();

    const triggerId = deepLinkStore.consumeTriggerVipInvite();
    if (triggerId === event.id && currentUser && !isRestricted) setShowVipModal(true);
  }, [event.id, currentUser, isRestricted]);

  useEffect(() => {
    const loadFriendsPresence = async () => {
      if (!supabase || !currentUser) return;
      const friendsIds = Object.entries(friendshipStore.getAll()).filter(([_, status]) => status === 'friends').map(([id]) => id);
      if (friendsIds.length === 0) return;

      const { data } = await supabase.from('event_rsvps').select('user_id, profiles(id, full_name, avatar_url, gender)').eq('event_id', event.id).in('user_id', friendsIds);
      if (data) {
        setConfirmedFriends(data.map((d: any) => d.profiles));
        const { data: activePresence } = await supabase.from('event_rsvps').select('user_id, events(start_at, end_at)').eq('status', 'going').in('user_id', friendsIds);
        if (activePresence) {
          const now = new Date();
          const presentIds = activePresence.filter((p: any) => {
            const start = new Date(p.events.start_at);
            const end = p.events.end_at ? new Date(p.events.end_at) : new Date(start.getTime() + 8 * 60 * 60 * 1000);
            return now >= start && now <= end;
          }).map((p: any) => p.user_id);
          setPresenceMap(new Set(presentIds));
        }
      }
    };
    loadFriendsPresence();
  }, [event.id, currentUser]);

  const handleConfirm = async (variation: TicketVariation) => {
    if (isRestricted) return;
    if (!currentUser) return onRequireAuth?.('Ingressos');
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      const result = await issueTicket({ userId: targetUserId, eventId: event.id, variationId: variation.id, source: 'purchase', limit: variation.limit });
      if (!result.success) { 
        vantaFeedback.toast('error', 'Indisponível', result.message || 'Lote esgotado.'); 
        return; 
      }
      await setGoing(event.id, targetUserId);
      profileStore.confirmEvent(event.id);
      setIsConfirmed(true); 
      setShowTicketsOverlay(false);
      vantaFeedback.toast('success', 'Acesso Garantido', 'Seu ticket está na carteira.');
    } catch { 
      vantaFeedback.toast('error', 'Erro', 'Falha ao processar reserva.'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // VANTA_COMMUNITY: Handler com Gate de Visitante
  const handleOpenCommunity = () => {
    if (!currentUser) {
      // Dispara gate padrão do App
      onRequireAuth?.('Comunidade');
      return;
    }
    setShowCommunityProfile(true);
  };

  // VANTA_CLARITY: Verificação se há info operacional para exibir
  const hasClarityInfo = event.dressCode || event.lineup || event.entryTips;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] bg-black overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-500 pb-32">
      
      <EventHeader 
        title={event.title}
        city={event.city}
        state={event.state}
        image={event.image}
        isRestricted={isRestricted}
        onBack={onBack}
      />

      <div className="px-8 mt-8 relative z-10 space-y-8">
        
        {/* VANTA_COMMUNITY: Botão de Acesso ao Perfil da Comunidade */}
        <div className="flex justify-center">
          <button 
            onClick={handleOpenCommunity}
            className="px-6 py-2 rounded-full border border-white/10 bg-zinc-900/50 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all flex items-center gap-2"
          >
            <span>Ver perfil comunidade</span>
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
          </button>
        </div>

        <EventSocialProof 
          confirmedFriends={confirmedFriends}
          presenceMap={presenceMap}
          onMemberClick={(id) => deepLinkStore.setOpenMemberProfile(id)}
        />

        <div className="space-y-4">
           <p className="text-zinc-400 text-[11px] leading-relaxed uppercase tracking-wide">{event.description}</p>
        </div>

        {/* VANTA_CLARITY: Protocolo Operacional */}
        {hasClarityInfo && (
          <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-5 shadow-lg">
             <h4 className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.3em] px-2 italic">Protocolo Operacional</h4>
             <div className="grid gap-4">
                {event.dressCode && (
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                     <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5">
                        <span className="text-lg">👔</span>
                     </div>
                     <div>
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block mb-0.5">Dress Code</span>
                        <p className="text-[10px] text-white font-medium uppercase">{event.dressCode}</p>
                     </div>
                  </div>
                )}
                {event.lineup && (
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                     <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5">
                        <span className="text-lg">🎵</span>
                     </div>
                     <div>
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block mb-0.5">Line-Up</span>
                        <p className="text-[10px] text-white font-medium uppercase">{event.lineup}</p>
                     </div>
                  </div>
                )}
                {event.entryTips && (
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                     <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5">
                        <span className="text-lg">💡</span>
                     </div>
                     <div>
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block mb-0.5">Dicas de Acesso</span>
                        <p className="text-[10px] text-white font-medium uppercase">{event.entryTips}</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        <EventActionPanel 
          isRestricted={isRestricted}
          isConfirmed={isConfirmed}
          onShowTickets={() => setShowTicketsOverlay(true)}
          onViewTicket={() => profileStore.updateProfile({})} 
        />
      </div>

      {showTicketsOverlay && (
        <TicketPurchaseOverlay 
          batches={event.batches}
          salesCounts={salesCounts}
          isLoading={isLoading}
          onClose={() => setShowTicketsOverlay(false)}
          onConfirm={handleConfirm}
        />
      )}

      {showVipModal && !isRestricted && (
        <VipInviteOverlay 
          event={event} 
          currentUser={currentUser!} 
          onClose={() => setShowVipModal(false)}
          onSuccess={() => { setShowVipModal(false); setIsConfirmed(true); }}
        />
      )}

      {/* VANTA_COMMUNITY: Overlay do Perfil Público */}
      {showCommunityProfile && currentUser && (
        <CommunityPublicProfile 
          event={event}
          currentUser={currentUser}
          onClose={() => setShowCommunityProfile(false)}
        />
      )}
    </div>
  );
};