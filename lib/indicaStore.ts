
import { supabase } from './supabaseClient';

export interface IndicaItem {
  id: string;
  type: 'EVENT' | 'LINK';
  eventId?: string;
  url?: string;
  title: string;
  image: string;
  tag: string;
  city?: string; // Se undefined/null, é Global
}

class IndicaStore {
  private items: IndicaItem[] = [];
  private listeners: (() => void)[] = [];
  private isLoaded: boolean = false;

  constructor() {
    this.loadFromSupabase();
    this.subscribeToRealtime();
  }

  private async loadFromSupabase() {
    if (!supabase) return;
    // Carrega APENAS os ativos para o consumidor final
    const { data, error } = await supabase
      .from('vanta_indica')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      this.isLoaded = true;
      this.notify();
      return;
    }

    this.items = data.map((row: any) => ({
      id: row.id,
      type: row.type as 'EVENT' | 'LINK',
      eventId: row.event_id,
      url: row.url,
      title: row.title,
      image: row.image_url,
      tag: row.tag || 'VANTA INDICA',
      city: row.city
    }));

    this.isLoaded = true;
    this.notify();
  }

  private subscribeToRealtime() {
    if (!supabase) return;
    supabase
      .channel('vanta_indica_consumer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vanta_indica' }, () => {
        this.loadFromSupabase();
      })
      .subscribe();
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public subscribe(l: () => void) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(i => i !== l); };
  }

  public getItems() {
    return [...this.items];
  }

  public getIsLoaded() {
    return this.isLoaded;
  }
}

export const indicaStore = new IndicaStore();
