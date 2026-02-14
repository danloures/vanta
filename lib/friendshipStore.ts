
import { supabase } from './supabaseClient';
import { notificationStore } from './notificationStore';

export type FriendshipStatus = 'none' | 'incoming' | 'outgoing' | 'friends';

class FriendshipStore {
  private listeners: (() => void)[] = [];
  private friendships: Record<string, FriendshipStatus> = {};
  private currentUserId: string | null = null;
  private channel: any = null;

  constructor() {
    this.init();
  }

  /**
   * VANTA_SYNC: Inicialização do contexto do usuário e escuta de sessão
   */
  private async init() {
    if (!supabase) return;
    
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (session?.user) {
      this.currentUserId = session.user.id;
      await this.loadFromSupabase();
      this.subscribeToRealtime();
    }

    // Monitora trocas de usuário (Login/Logout)
    (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        this.currentUserId = session.user.id;
        await this.loadFromSupabase();
        this.subscribeToRealtime();
      } else {
        this.currentUserId = null;
        this.friendships = {};
        if (this.channel) {
          supabase.removeChannel(this.channel);
          this.channel = null;
        }
        this.notify();
      }
    });
  }

  /**
   * Sincronização em tempo real para atualizações instantâneas de solicitações e aceites
   */
  private subscribeToRealtime() {
    if (!supabase || !this.currentUserId) return;
    if (this.channel) supabase.removeChannel(this.channel);

    this.channel = supabase
      .channel('vanta_social_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships',
        filter: `user_id=eq.${this.currentUserId}`
      }, () => this.loadFromSupabase())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships',
        filter: `friend_id=eq.${this.currentUserId}`
      }, () => this.loadFromSupabase())
      .subscribe();
  }

  /**
   * Carga inicial das relações de amizade do usuário
   */
  public async loadFromSupabase() {
    if (!supabase || !this.currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${this.currentUserId},friend_id.eq.${this.currentUserId}`);

      if (error) throw error;

      const newFriendships: Record<string, FriendshipStatus> = {};
      data.forEach((f: any) => {
        const otherId = f.user_id === this.currentUserId ? f.friend_id : f.user_id;
        if (f.status === 'friends') {
          newFriendships[otherId] = 'friends';
        } else {
          newFriendships[otherId] = f.user_id === this.currentUserId ? 'outgoing' : 'incoming';
        }
      });

      this.friendships = newFriendships;
      this.notify();
    } catch (err) {
      console.error("[VANTA SOCIAL] Erro ao carregar amizades:", err);
    }
  }

  public getStatus(memberId: string): FriendshipStatus {
    return this.friendships[memberId] || 'none';
  }

  public getAll(): Record<string, FriendshipStatus> {
    return { ...this.friendships };
  }

  /**
   * Mutação de estado na rede (Adicionar, Aceitar, Remover)
   */
  public async setStatus(memberId: string, status: FriendshipStatus): Promise<void> {
    if (!supabase || !this.currentUserId) return;

    try {
      if (status === 'none') {
        // Remover registro (Unfriend ou Cancelar Solicitação)
        await supabase
          .from('friendships')
          .delete()
          .or(`and(user_id.eq.${this.currentUserId},friend_id.eq.${memberId}),and(user_id.eq.${memberId},friend_id.eq.${this.currentUserId})`);
        
        delete this.friendships[memberId];
      } else if (status === 'outgoing') {
        // Enviar nova solicitação
        const { error } = await supabase
          .from('friendships')
          .insert([{ user_id: this.currentUserId, friend_id: memberId, status: 'pending' }]);
        
        if (!error) {
          this.friendships[memberId] = 'outgoing';
          // Notificar via Store de Notificações
          await notificationStore.addNotification('friend_request', memberId, 'Um membro');
        }
      } else if (status === 'friends') {
        // Aceitar solicitação recebida
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'friends' })
          .match({ user_id: memberId, friend_id: this.currentUserId });
        
        if (!error) {
          this.friendships[memberId] = 'friends';
          // Notificar o remetente original sobre a aceitação
          await notificationStore.addNotification('friend_accepted', memberId, 'Um membro');
        }
      }
    } catch (err) {
      console.error("[VANTA SOCIAL] Erro na operação de rede:", err);
    }

    this.notify();
  }

  /**
   * Padrão Observer para reatividade da UI
   */
  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const friendshipStore = new FriendshipStore();
