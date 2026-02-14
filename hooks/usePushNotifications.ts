
import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

// VANTA_CONFIG: Chave pública VAPID.
// Em produção, isso deve vir de variáveis de ambiente.
const PUBLIC_VAPID_KEY = "BK_PLACEHOLDER_KEY_REPLACE_WITH_REAL_VAPID_PUBLIC_KEY"; 

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (currentUser: User | null) => {
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!currentUser) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[VANTA PUSH] Push messaging is not supported');
      return;
    }

    const checkPermission = async () => {
      const permission = Notification.permission;
      setPermissionState(permission);
      
      const hasDeniedLocally = localStorage.getItem('vanta_push_denied');

      // Se já permitido, garante que o token está atualizado no banco
      if (permission === 'granted') {
        syncToken();
      } else if (permission === 'default' && !hasDeniedLocally) {
        // Se ainda não decidiu e não negou explicitamente, mostra o overlay do VANTA
        setTimeout(() => setShowPushPrompt(true), 60000);
      }
    };

    checkPermission();
  }, [currentUser]);

  const syncToken = async () => {
    if (!currentUser || !supabase) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Atualiza 'last_active_at' ou insere se não existir
        await supabase.from('user_devices').upsert({
          user_id: currentUser.id,
          subscription: subscription as any,
          user_agent: navigator.userAgent,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'user_id, subscription' });
      }
    } catch (e) {
      console.error("[VANTA PUSH] Erro ao sincronizar token existente:", e);
    }
  };

  const subscribeUser = async () => {
    setShowPushPrompt(false); 

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        if (PUBLIC_VAPID_KEY.includes("PLACEHOLDER")) {
            console.warn("[VANTA PUSH] Chave VAPID não configurada. Token real não gerado.");
            return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        // VANTA_PUSH: Persistência do Token no Banco de Dados
        if (supabase && currentUser) {
            const { error } = await supabase.from('user_devices').upsert({
                user_id: currentUser.id,
                subscription: subscription as any,
                user_agent: navigator.userAgent,
                platform: 'web',
                last_active_at: new Date().toISOString()
            }, { onConflict: 'user_id, subscription' });

            if (error) throw error;
            console.log("[VANTA PUSH] Dispositivo registrado com sucesso na rede.");
        }
      }
    } catch (err) {
      console.error('[VANTA PUSH] Failed to subscribe the user: ', err);
    }
  };

  const declinePush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('vanta_push_denied', 'true');
  };

  return {
    showPushPrompt,
    permissionState,
    subscribeUser,
    declinePush
  };
};
