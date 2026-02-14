import { supabase } from './supabaseClient';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'event' | 'info' | 'vip_invite' | 'staff_assignment' | 'quota_received' | 'guest_arrival' | 'message' | 'event_share';

export interface VantaNotification { 
  id: string; 
  type: NotificationType; 
  memberId: string; 
  text: string; 
  timestamp: number; 
  read: boolean; 
  eventId?: string;
  metadata?: {
    action_type?: 'notification' | 'invite' | 'staff_assignment' | 'quota_received' | 'guest_arrival' | 'message_received' | 'gift_transfer' | 'event_share';
    eventId?: string;
    communityName?: string;
    roleName?: string;
    date?: string;
    guestName?: string;
    quotaAmount?: number;
    sharerName?: string;
  };
}

class NotificationStore {
  private listeners: (() => void)[] = [];
  private notifications: VantaNotification[] = [];
  private currentUserId: string | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (!supabase) return;
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (session?.user) {
      this.currentUserId = session.user.id;
      this.loadFromSupabase();
      this.subscribeToRealtime();
    }
  }

  private async loadFromSupabase() {
    if (!supabase || !this.currentUserId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', this.currentUserId)
      .order('created_at', { ascending: false });

    if (error || !data) return;

    this.notifications = data.map((n: any) => ({
      id: n.id,
      type: n.type as NotificationType,
      memberId: n.member_id || '',
      eventId: n.event_id || n.metadata?.eventId || '',
      text: n.text,
      timestamp: new Date(n.created_at).getTime(),
      read: n.read,
      metadata: n.metadata
    }));

    this.notify();
  }

  private subscribeToRealtime() {
    if (!supabase || !this.currentUserId) return;

    supabase
      .channel(`notifications:${this.currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${this.currentUserId}` }, () => {
        this.loadFromSupabase();
      })
      .subscribe();
  }

  public getAll(): VantaNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public getUnreadMessageCount(): number {
    return this.notifications.filter(n => n.type === 'message' && !n.read).length;
  }

  public async addNotification(type: NotificationType, targetUserId: string, memberIdentifier: string, metadata?: any) {
    if (!supabase) return;

    let text = '';
    // VANTA_NOTIFICATIONS: Lógica Centralizada de Formatação de Texto
    if (type === 'friend_request') text = `${memberIdentifier} enviou uma solicitação de conexão.`;
    else if (type === 'friend_accepted') text = `Conexão confirmada com ${memberIdentifier}.`;
    else if (type === 'staff_assignment') text = `Você foi escalado para ${metadata?.roleName || 'Staff'} em ${metadata?.communityName || 'unidade'}.`;
    else if (type === 'quota_received') text = `Você recebeu uma cota de ${metadata?.quotaAmount || 0} convites cortesia.`;
    else if (type === 'guest_arrival') text = `Protocolo: ${metadata?.guestName} acessou o evento.`;
    else if (type === 'message') text = `Nova mensagem de ${memberIdentifier}`;
    else if (type === 'event_share') text = `${memberIdentifier} compartilhou um evento com você.`;
    else text = `Nova atualização de ${memberIdentifier}`;

    // VANTA_RPC_SYNC: Mapeamento rigoroso para a whitelist soberana
    let mappedType = 'message';
    if (type === 'friend_request') mappedType = 'friend_request';
    else if (type === 'friend_accepted') mappedType = 'friend_accept';
    else if (type === 'message') mappedType = 'message';
    else if (type === 'event_share') mappedType = 'event_share';
    else if (type === 'staff_assignment') mappedType = 'staff_assignment';
    else if (type === 'vip_invite') mappedType = 'event_invite';

    // Executa a notificação via RPC soberana
    await supabase.rpc('vanta_notify', {
      p_user_id: targetUserId,
      p_type: mappedType,
      p_text: text,
      p_member_id: this.currentUserId,
      p_event_id: metadata?.eventId || null,
      p_metadata: metadata || {}
    });
  }

  public async markAsRead(id: string) {
    if (!supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.notify();
  }

  public async markMessagesAsRead(memberId: string) {
    if (!supabase || !this.currentUserId) return;
    
    // Identifica notificações de mensagem não lidas deste remetente
    const toUpdate = this.notifications.filter(n => n.type === 'message' && n.memberId === memberId && !n.read);
    const ids = toUpdate.map(n => n.id);
    
    if (ids.length === 0) return;

    // Atualiza no banco
    await supabase.from('notifications').update({ read: true }).in('id', ids);
    
    // Atualiza local
    this.notifications = this.notifications.map(n => ids.includes(n.id) ? { ...n, read: true } : n);
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const notificationStore = new NotificationStore();