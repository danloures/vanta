import React, { useEffect, useState } from 'react';
import { notificationStore, VantaNotification } from '../lib/notificationStore';
import { ICONS } from '../constants';
import { deepLinkStore } from '../lib/deepLinkStore';

interface NotificationOverlayProps {
  show: boolean;
  onClose: () => void;
  onEventClick: (eventId: string) => void;
  setActiveTab: (tab: any) => void;
}

export const NotificationOverlay: React.FC<NotificationOverlayProps> = ({
  show, onClose, onEventClick, setActiveTab
}) => {
  const [notifications, setNotifications] = useState<VantaNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      setNotifications(notificationStore.getAll());
      setUnreadCount(notificationStore.getUnreadCount());
    };
    sync();
    return notificationStore.subscribe(sync);
  }, []);

  if (!show) return null;

  const safeMarkRead = (id: string) => {
    try {
      notificationStore.markAsRead(id);
    } catch (e) {
      console.error('[VANTA NOTIFICATIONS] markAsRead failed:', e);
    }
  };

  const handleAction = (n: VantaNotification) => {
    const md: any = n.metadata || {};

    // IDs (com fallback)
    const eventId =
      n.eventId ||
      md.eventId ||
      md.event_id;

    const memberId =
      n.memberId ||
      md.memberId ||
      md.member_id ||
      md.fromUserId ||
      md.from_user_id;

    const communityId =
      md.communityId ||
      md.community_id;

    const actionType =
      md.action_type ||
      md.actionType ||
      null;

    // 1) ROTAS PRIORITÁRIAS: Comunidade / Admin
    // Se existir ID de comunidade, direciona para o painel Admin.
    // Isso evita abrir o chat do remetente (memberId) em notificações institucionais.
    if (communityId) {
      setActiveTab('admin');
      onClose();
      safeMarkRead(n.id);
      return;
    }

    // 2) EVENTOS / VIP / SHARE
    if (n.type === 'vip_invite' || n.type === 'event' || n.type === 'event_share' || !!eventId) {
      if (eventId) {
        if (n.type === 'vip_invite') {
          deepLinkStore.setTriggerVipInvite(eventId);
        }
        onEventClick(eventId);
        onClose();
        safeMarkRead(n.id);
        return;
      }
    }

    // 3) MENSAGENS
    if (n.type === 'message') {
      if (memberId) {
        deepLinkStore.setOpenChat(memberId);
        setActiveTab('messages');
        onClose();
        safeMarkRead(n.id);
        return;
      }
    }

    // 4) SOCIAL (friend_request / accepted)
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      if (memberId) {
        deepLinkStore.setOpenMemberProfile(memberId);
        setActiveTab('search');
        onClose();
        safeMarkRead(n.id);
        return;
      }
    }

    // 5) STAFF / QUOTA / GUEST (Fallback para Admin ou Home se não tiver communityId)
    if (n.type === 'staff_assignment' || n.type === 'quota_received' || n.type === 'guest_arrival') {
      setActiveTab('admin');
      onClose();
      safeMarkRead(n.id);
      return;
    }

    // 6) Fallback Geral
    safeMarkRead(n.id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'vip_invite': return <ICONS.Star className="w-4 h-4 text-[#d4af37]" />;
      case 'friend_request': return <ICONS.User className="w-4 h-4 text-purple-400" />;
      case 'event': return <ICONS.Calendar className="w-4 h-4 text-emerald-400" />;
      case 'event_share': return <ICONS.Calendar className="w-4 h-4 text-emerald-400" />;
      case 'message': return <ICONS.Message className="w-4 h-4 text-blue-400" />;
      case 'staff_assignment': return <ICONS.User className="w-4 h-4 text-[#d4af37]" />;
      case 'quota_received': return <ICONS.Star className="w-4 h-4 text-[#d4af37]" />;
      case 'guest_arrival': return <ICONS.User className="w-4 h-4 text-emerald-400" />;
      case 'info': return <ICONS.Bell className="w-4 h-4 text-zinc-500" />;
      default: return <ICONS.Bell className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300 flex flex-col">
      <header className="px-10 pt-20 pb-10 flex justify-between items-end shrink-0 safe-top">
        <div className="space-y-2">
          <h2 className="text-5xl font-serif italic text-white tracking-tighter">Inbox</h2>
          <p className="text-[#d4af37] text-[8px] font-black uppercase tracking-[0.5em] italic">
            {unreadCount > 0 ? `${unreadCount} NOVOS PROTOCOLOS` : 'VOCÊ ESTÁ ATUALIZADO'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 active:scale-90 transition-all mb-2"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-32">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleAction(n)}
                className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group active:scale-[0.98] ${
                  !n.read
                    ? 'bg-zinc-900 border-[#d4af37]/30 shadow-[0_10px_30px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/40 border-white/5 opacity-60'
                }`}
              >
                <div className="flex gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    !n.read ? 'bg-[#d4af37]/10 border border-[#d4af37]/20' : 'bg-zinc-900 border border-white/5'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">
                        {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></div>}
                    </div>
                    <p className={`text-[11px] uppercase tracking-wide leading-relaxed ${!n.read ? 'text-white font-bold' : 'text-zinc-500'}`}>
                      {n.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center px-10 space-y-6">
            <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center opacity-20">
              <ICONS.Bell className="w-10 h-10 text-zinc-700" />
            </div>
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em] leading-relaxed italic">
              NENHUMA NOTIFICAÇÃO<br />DE ELITE NO MOMENTO.
            </p>
          </div>
        )}
      </div>

      <div className="p-8 bg-gradient-to-t from-black via-black to-transparent shrink-0">
        <p className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.4em] text-center">
          VANTA PRIVACY PROTOCOL V1.6
        </p>
      </div>
    </div>
  );
};