import { useState, useEffect, useMemo } from 'react';
import { User, UserStatus, Event } from '../types';
import { supabase } from '../lib/supabaseClient';
import { mapSupabaseUserToVantaUser } from '../lib/userMapper';
import { fetchEventsFromSupabase, isEventExpired } from '../lib/eventsApi';
import { profileStore } from '../features/profile/profileState';

export const useAppLogic = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'search' | 'messages' | 'profile' | 'wallet'>('home');
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Rio de Janeiro');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [blockedFeature, setBlockedFeature] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // VANTA_ERROR_HANDLING: Estado global de erro para feedback visual
  const [systemError, setSystemError] = useState<string | null>(null);

  const availableCities = useMemo(
    () => ([...new Set(events.map(e => e.city))].filter(Boolean).sort() as string[]),
    [events]
  );

  const refreshUserContext = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const { data: { user } } = await (supabase.auth as any).getUser();
      if (!user) return;

      const mergedUser = {
        ...user,
        user_metadata: { ...user.user_metadata, ...profile }
      };

      const base = mapSupabaseUserToVantaUser(mergedUser);

      const staffStatuses = new Set<UserStatus>([
        UserStatus.ADMIN,
        UserStatus.VANTA_PROD,
        UserStatus.VANTA_SOCIO,
        UserStatus.VANTA_PROMOTER,
        UserStatus.VANTA_PORTARIA,
        UserStatus.VANTA_STAFF,
      ]);

      let gatedStatus = base.status;
      const isDynamicStaff = !!(profile.role && String(profile.role).startsWith('vanta_'));

      // VANTA_AUTO_APPROVE: Remove o status PENDING do fluxo obrigatório
      if (!staffStatuses.has(base.status) && !isDynamicStaff) {
        if (!!profile.is_globally_restricted) {
          gatedStatus = UserStatus.RESTRICTED;
        } else {
          gatedStatus = UserStatus.APPROVED;
        }
      }

      setCurrentUser({
        ...base,
        status: gatedStatus,
        permissions: profile.permissions || {},
        isGloballyRestricted: !!profile.is_globally_restricted,
        restriction_notes: profile.restriction_notes || '',
        approvedAt: profile.approved_at || undefined,
        approvedByName: profile.approved_by_name || undefined,
      });
    } catch (err: any) {
      console.error('[VANTA CONTEXT] Erro ao sincronizar perfil:', err);
    }
  };

  const loadAndSyncEvents = async () => {
    try {
      const remoteEvents = await fetchEventsFromSupabase();
      if (remoteEvents) {
        const filtered = remoteEvents.filter(e => !isEventExpired(e));
        setEvents(filtered);
      }
    } catch (err) {
      console.error('[VANTA EVENTS] Erro ao carregar eventos:', err);
    }
  };

  const handleLogoutLocal = () => {
    setCurrentUser(null);
    setActiveTab('home');
    setIsAdminMode(false);
    setSelectedEventId(null);
    setShowAuth(null);
  };

  useEffect(() => {
    let unsubAuth: (() => void) | null = null;
    let mounted = true;

    const initApp = async () => {
      // VANTA_BLINDAGE: Inicialização silenciosa e robusta
      try {
        if (supabase) {
          const { data } = await (supabase.auth as any).getSession();
          if (data?.session?.user) {
            await refreshUserContext(data.session.user.id);
          }
        }
      } catch (err: any) {
        console.error('[VANTA BOOT ERROR]', err);
        // opcional: setSystemError(String(err?.message || err || 'Falha no boot'));
      } finally {
        // GARANTIA: Remove a tela de carregamento (Logo Pulsante)
        if (mounted) setIsCheckingSession(false);
      }
    };

    initApp();

    // ✅ Blindagem: se supabase não estiver configurado, não cria listener
    if (!supabase) {
      return () => { mounted = false; };
    }

    try {
      const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(
        async (event: any, session: any) => {
          try {
            if (session?.user) {
              await refreshUserContext(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              handleLogoutLocal();
            }
          } catch (e) {
            console.error('[VANTA AUTH] Erro no onAuthStateChange:', e);
          }
        }
      );

      unsubAuth = () => subscription?.unsubscribe?.();
    } catch (err: any) {
      console.error('[VANTA AUTH] Falha ao iniciar onAuthStateChange:', err);
    }

    return () => {
      mounted = false;
      try { unsubAuth?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = profileStore.subscribe(() => {
      refreshUserContext(currentUser.id);
    });
    return unsub;
  }, [currentUser?.id]);

  useEffect(() => {
    loadAndSyncEvents();

    // ✅ Se supabase não estiver configurado, não tenta realtime
    if (!supabase) return;

    // ✅ trava referência não-nula pro TS (e pro cleanup)
    const sb = supabase;

    const channel = sb
      .channel('vanta_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadAndSyncEvents();
      })
      .subscribe();

    const handleRefreshEvent = () => {
      loadAndSyncEvents();
      if (currentUser?.id) refreshUserContext(currentUser.id);
    };

    window.addEventListener('vanta:refresh', handleRefreshEvent);

    const cleanupTimer = setInterval(() => {
      setEvents(prev => {
        const active = prev.filter(e => !isEventExpired(e));
        return active.length !== prev.length ? active : prev;
      });
    }, 30000);

    return () => {
      sb.removeChannel(channel);
      window.removeEventListener('vanta:refresh', handleRefreshEvent);
      clearInterval(cleanupTimer);
    };
  }, [currentUser?.id]);

  const handleTabChange = (tab: any) => {
    const memberOnlyTabs: Record<string, string> = { messages: 'Social', profile: 'Perfil', wallet: 'Acesso' };
    if (!currentUser && memberOnlyTabs[tab]) {
      setBlockedFeature(memberOnlyTabs[tab]);
      return;
    }
    setActiveTab(tab);
    setSelectedEventId(null);
    if (tab !== 'messages') setActiveConversationId(null);
  };

  // ✅ VANTA_LOGOUT_SAFE: nunca travar UX por timeout de signOut remoto
  const handleLogout = async () => {
    // 1) Sempre faz logout local imediatamente (vira visitante + Home)
    handleLogoutLocal();

    // 2) Tenta logout remoto sem travar UI
    try {
      if (supabase) {
        const logoutTask = (supabase.auth as any).signOut();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );
        await Promise.race([logoutTask, timeout]);
      }
    } catch (err: any) {
      console.warn('[VANTA AUTH] Logout remoto falhou:', err);
      // local já saiu; não faz mais nada
    }
};

  return {
    currentUser, setCurrentUser,
    isCheckingSession,
    activeTab, setActiveTab,
    events, setEvents,
    isAdminMode, setIsAdminMode,
    selectedCity, setSelectedCity,
    showCitySelector, setShowCitySelector,
    showNotifications, setShowNotifications,
    selectedEventId, setSelectedEventId,
    blockedFeature, setBlockedFeature,
    showAuth, setShowAuth,
    activeConversationId, setActiveConversationId,
    conversations, setConversations,
    availableCities,
    handleTabChange,
    handleLogout,
    // Error Handling Exports
    systemError, setSystemError
  };
};
