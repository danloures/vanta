
import React, { useState, useEffect, useRef } from 'react';
import { User, UserStatus, Event } from '../../types';
import { ICONS } from '../../constants';
import { notificationStore, VantaNotification } from '../../lib/notificationStore';
import { MemberProfileView } from '../../components/MemberProfileView';
import { deepLinkStore } from '../../lib/deepLinkStore';
import { getMemberById, MemberProfile } from '../../lib/membersApi';
import { VantaAvatar } from '../../components/VantaAvatar';

// VANTA_ATOMIC_COMPONENTS
import { HeaderProfile } from '../home/components/HeaderProfile';
import { CitySelectorTrigger } from '../home/components/CitySelector/CitySelector';
import { NotificationBell } from '../home/components/NotificationBell';

interface AppLayoutProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  selectedCity: string;
  setShowCitySelector: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void; 
  isCityInteractive?: boolean;
  events: Event[]; 
  children: React.ReactNode;
  onTitleClick?: () => void;
  onEventClick?: (eventId: string) => void;
  isDetailView?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  currentUser, activeTab, setActiveTab, selectedCity, 
  setShowCitySelector, setShowNotifications, isCityInteractive = true, 
  events, children, onTitleClick, onEventClick, isDetailView = false
}) => {
  const [unreadCount, setUnreadCount] = useState(notificationStore.getUnreadCount());
  // VANTA_BADGE: Novo estado para contar mensagens não lidas especificamente
  const [unreadMessageCount, setUnreadMessageCount] = useState(notificationStore.getUnreadMessageCount());
  
  const [notifications, setNotifications] = useState<VantaNotification[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab, isDetailView]);

  useEffect(() => {
    const sync = () => {
      setUnreadCount(notificationStore.getUnreadCount());
      setUnreadMessageCount(notificationStore.getUnreadMessageCount());
      setNotifications(notificationStore.getAll());
    };
    sync();
    return notificationStore.subscribe(sync);
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      setIsLoadingMember(true);
      getMemberById(selectedMemberId).then(profile => {
        setSelectedMember(profile);
        setIsLoadingMember(false);
      });
    } else {
      setSelectedMember(null);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    const checkDeepLinks = () => {
      const pendingProfileId = (deepLinkStore as any).pendingMemberId;
      if (pendingProfileId) {
        setSelectedMemberId(pendingProfileId);
        deepLinkStore.consumeOpenMemberProfile();
      }
    };
    const unsub = deepLinkStore.subscribe(checkDeepLinks);
    return unsub;
  }, []);

  const isRestricted = !!currentUser?.isGloballyRestricted;

  return (
    <div className={`h-full flex flex-col relative selection:bg-purple-500 selection:text-white bg-black transition-all duration-1000 ${isRestricted ? 'grayscale brightness-75' : ''}`}>
      {activeTab === 'home' && !isDetailView && (
        <header className="px-6 pt-16 pb-8 flex justify-between items-center z-[100] bg-black/50 backdrop-blur-md safe-top shrink-0 animate-in fade-in slide-in-from-top duration-500">
          {/* 1. Header Profile (Atômico) */}
          <HeaderProfile currentUser={currentUser} onNavigate={setActiveTab} />
          
          {/* 2. City Selector Trigger (Atômico) */}
          <CitySelectorTrigger 
            selectedCity={selectedCity} 
            onClick={() => setShowCitySelector(true)} 
          />

          {/* 3. Notification Bell (Atômico) */}
          <div className="flex items-center gap-3">
            <NotificationBell 
              unreadCount={unreadCount} 
              currentUser={currentUser} 
              onClick={() => setShowNotifications(true)} 
            />
          </div>
        </header>
      )}

      {isRestricted && !isDetailView && (
        <div className="fixed top-0 left-0 right-0 z-[500] px-6 py-2 bg-red-600 text-white flex items-center justify-center gap-3 shrink-0 animate-pulse safe-top border-b border-black/20">
           <span className="text-xl">⚖️</span>
           <span className="text-[8px] font-black uppercase tracking-widest italic text-center leading-tight">PROTOCOLO DE SEGURANÇA ATIVADO: ACESSO EM ANÁLISE PELO CONSELHO</span>
        </div>
      )}

      <main ref={mainRef} className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

      {!isDetailView && (
        <nav className="h-20 glass border-t border-white/5 flex justify-around items-center px-4 safe-bottom shrink-0 relative z-[150] bg-zinc-950">
          {[
            { id: 'home', label: 'Início', icon: ICONS.Home },
            { id: 'map', label: 'Radar', icon: ICONS.MapPin },
            { id: 'search', label: 'Buscar', icon: ICONS.Search },
            { id: 'messages', label: 'Social', icon: ICONS.Message, restricted: true, badge: unreadMessageCount > 0 },
            { id: 'profile', label: 'Perfil', icon: ICONS.User, restricted: true }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 relative ${activeTab === item.id ? 'text-white' : 'text-zinc-700'} ${isRestricted && item.restricted ? 'opacity-20' : ''}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#d4af37]' : ''}`} />
              <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${activeTab === item.id ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
              
              {/* VANTA_BADGE: Indicador de Mensagens */}
              {item.badge && !isRestricted && (
                <div className="absolute top-3 right-6 w-2 h-2 bg-[#d4af37] rounded-full border border-black shadow-[0_0_10px_rgba(212,175,55,0.8)] animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>
      )}

      {selectedMember && currentUser && (
        <MemberProfileView 
          member={selectedMember} 
          onBack={() => { setSelectedMemberId(null); setSelectedMember(null); }} 
          onMessage={() => { setActiveTab('messages'); setSelectedMemberId(null); setSelectedMember(null); }} 
        />
      )}

      {isLoadingMember && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
