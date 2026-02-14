import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AppLayout } from './features/Main/AppLayout';
import { HomeFeature } from './features/home/HomeFeature';
import { EventDetail } from './components/EventDetail';
import { ProfileFeature } from './features/profile/ProfileFeature';
import { SearchFeature } from './features/search/SearchFeature';
import { MapFeature } from './features/map/MapFeature';
import { WalletFeature } from './features/wallet/WalletFeature';
import { TicketActivationView } from './components/TicketActivationView';
import Messages from './components/Messages';
import { useAppLogic } from './hooks/useAppLogic';
import { GlobalOverlays } from './components/overlays/GlobalOverlays';
import { usePushNotifications } from './hooks/usePushNotifications';
import { PushPermissionOverlay } from './components/overlays/PushPermissionOverlay';
import { SystemErrorOverlay } from './components/overlays/SystemErrorOverlay';
import { VantaFeedbackSystem } from './components/overlays/VantaFeedbackSystem';

const App: React.FC = () => {
  const logic = useAppLogic();
  const [activationParams, setActivationParams] = useState<{ eventId: string; staffId: string } | null>(null);

  // VANTA_PUSH: Hook de Gerenciamento de Notificações
  const { showPushPrompt, subscribeUser, declinePush } = usePushNotifications(logic.currentUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const event = params.get('event');
    const staff = params.get('staff');
    if (event && staff) {
      setActivationParams({ eventId: event, staffId: staff });
    }
  }, []);

  if (logic.isCheckingSession) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-3xl font-serif italic animate-pulse tracking-widest">VANTA</div>
      </div>
    );
  }

  // VANTA_GIFT: Renderização da Tela de Ativação (Landing Convidado)
  if (activationParams) {
    return (
      <TicketActivationView
        eventId={activationParams.eventId}
        promoterId={activationParams.staffId}
        onSuccess={() => {
          setActivationParams(null);
          // Limpa URL
          window.history.replaceState({}, '', '/');
          logic.handleTabChange('wallet');
        }}
      />
    );
  }

  if (logic.isAdminMode && logic.currentUser) {
    return (
      <AdminDashboard
        currentUser={logic.currentUser}
        events={logic.events}
        setEvents={logic.setEvents}
        onExit={() => logic.setIsAdminMode(false)}
      />
    );
  }

  const currentSelectedEvent = logic.selectedEventId ? logic.events.find((e) => e.id === logic.selectedEventId) : null;

  return (
    <div className="h-full w-full bg-black">
      <AppLayout
        currentUser={logic.currentUser}
        activeTab={logic.activeTab}
        setActiveTab={(tab) => logic.handleTabChange(tab)}
        selectedCity={logic.selectedCity}
        setShowCitySelector={logic.setShowCitySelector}
        setShowNotifications={logic.setShowNotifications}
        events={logic.events}
        onEventClick={(eventId) => logic.setSelectedEventId(eventId ?? null)}
        isDetailView={!!logic.selectedEventId}
      >
        {currentSelectedEvent ? (
          <EventDetail
            event={currentSelectedEvent}
            onBack={() => logic.setSelectedEventId(null)}
            currentUser={logic.currentUser}
            onRequireAuth={(f) => logic.setBlockedFeature((f ?? null) as any)}
          />
        ) : (
          <>
            {logic.activeTab === 'home' && (
              <HomeFeature
                selectedCity={logic.selectedCity}
                onOpenConcierge={() => logic.handleTabChange('messages')}
                onEventClick={(eventId) => logic.setSelectedEventId(eventId)}
                onNavigate={logic.handleTabChange}
                events={logic.events}
              />
            )}

            {logic.activeTab === 'map' && (
              <MapFeature
                events={logic.events}
                currentUser={logic.currentUser}
                onRequireAuth={(featureName) => logic.setBlockedFeature((featureName ?? null) as any)}
                onEventClick={(eventId) => logic.setSelectedEventId(eventId)}
              />
            )}

            {logic.activeTab === 'search' && (
              <SearchFeature
                events={logic.events}
                currentUser={logic.currentUser}
                setActiveTab={(tab) => logic.handleTabChange(tab)}
                onEventClick={(eventId) => logic.setSelectedEventId(eventId)}
                onBlockSocial={() => logic.setBlockedFeature('Membros')}
              />
            )}

            {logic.activeTab === 'messages' && logic.currentUser && (
              <Messages
                currentUser={logic.currentUser}
                conversations={logic.conversations}
                setConversations={logic.setConversations}
                activeConversationId={logic.activeConversationId}
                setActiveConversationId={logic.setActiveConversationId}
              />
            )}

            {logic.activeTab === 'wallet' && logic.currentUser && <WalletFeature currentUser={logic.currentUser} />}

            {logic.activeTab === 'profile' && logic.currentUser && (
              <ProfileFeature currentUser={logic.currentUser} onLogout={logic.handleLogout} onOpenAdmin={() => logic.setIsAdminMode(true)} />
            )}
          </>
        )}
      </AppLayout>

      <GlobalOverlays
        showNotifications={logic.showNotifications}
        setShowNotifications={logic.setShowNotifications}
        setSelectedEventId={logic.setSelectedEventId}
        handleTabChange={logic.handleTabChange}
        blockedFeature={logic.blockedFeature}
        setBlockedFeature={logic.setBlockedFeature}
        setShowAuth={logic.setShowAuth}
        showAuth={logic.showAuth}
        setCurrentUser={logic.setCurrentUser}
        showCitySelector={logic.showCitySelector}
        setShowCitySelector={logic.setShowCitySelector}
        selectedCity={logic.selectedCity}
        setSelectedCity={logic.setSelectedCity}
        availableCities={logic.availableCities}
      />

      {/* VANTA_ERROR: Overlay de Falha Crítica - Captura erros de inicialização */}
      <SystemErrorOverlay error={logic.systemError} onDismiss={() => logic.setSystemError(null)} />

      {/* VANTA_FEEDBACK: Sistema Universal de Toasts e Confirmações */}
      <VantaFeedbackSystem />

      {/* VANTA_PUSH: Overlay de Permissão */}
      {showPushPrompt && <PushPermissionOverlay onAccept={subscribeUser} onDecline={declinePush} />}
    </div>
  );
};

export default App;
