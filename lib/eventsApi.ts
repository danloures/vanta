
import { supabase } from './supabaseClient';
import { Event } from '../types';
import { notificationStore } from './notificationStore';

const APP_TIMEZONE = 'America/Sao_Paulo';

function formatDateInTZ(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value ?? '1970';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${day}`;
}

function formatTimeInTZ(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hh = parts.find(p => p.type === 'hour')?.value ?? '00';
  const mm = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${hh}:${mm}`;
}

function toNumberOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toLocalISOWithOvernight(dateStr: string, startTime: string, endTime: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = new Date(y, m - 1, d, sh, sm, 0);
  const end = new Date(y, m - 1, d, eh, em, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export function isEventExpired(event: Event): boolean {
  if (!event.startDate || !event.endTime) return false;
  const [year, month, day] = event.startDate.split('-').map(Number);
  const [startH, startM] = (event.startTime || '00:00').split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);
  const startAt = new Date(year, month - 1, day, startH, startM, 0);
  let endAt = new Date(year, month - 1, day, endH, endM, 0);
  if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
  return new Date() > endAt;
}

export async function fetchEventsFromSupabase(): Promise<Event[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('events')
    .select('id, community_id, creator_id, title, description, image_url, city, state, venue, address, start_at, end_at, is_vip_only, is_active, is_featured, is_transfer_enabled, latitude, longitude, capacity, staff, batches, guest_list_rules, vibe_tags, lineup, dress_code, entry_tips')
    .eq('is_active', true)
    .order('start_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => {
    const startAtDate = new Date(row.start_at);
    const endAtDate = row.end_at ? new Date(row.end_at) : null;
    const startDate = formatDateInTZ(startAtDate, APP_TIMEZONE);
    const startTime = formatTimeInTZ(startAtDate, APP_TIMEZONE);
    const endTime = endAtDate ? formatTimeInTZ(endAtDate, APP_TIMEZONE) : '06:00';
    
    return {
      id: String(row.id),
      title: row.title || '',
      description: row.description || '',
      startDate, startTime, endTime,
      location: row.venue || row.address || '',
      city: row.city || '',
      state: row.state || '',
      image: row.image_url || '',
      isVipOnly: !!row.is_vip_only,
      isFeatured: !!row.is_featured,
      isTransferEnabled: row.is_transfer_enabled !== false,
      latitude: toNumberOrNull(row.latitude),
      longitude: toNumberOrNull(row.longitude),
      capacity: row.capacity || 0,
      rsvps: 0,
      communityId: row.community_id,
      creatorId: row.creator_id,
      staff: row.staff || [],
      batches: row.batches || [],
      vibeTags: row.vibe_tags || [],
      lineup: row.lineup || '',
      dressCode: row.dress_code || '',
      entryTips: row.entry_tips || '',
      guestListRules: row.guest_list_rules || [],
      isListEnabled: !!(row.guest_list_rules && row.guest_list_rules.length > 0),
      guests: [],
    } as Event;
  });
}

export async function createEvent(event: any): Promise<Event | null> {
  if (!supabase) return null;
  try {
    const { startISO: startTimestamp, endISO: endTimestamp } = toLocalISOWithOvernight(event.startDate, event.startTime, event.endTime);
    const { data, error } = await supabase
      .from('events')
      .insert([{
        community_id: event.communityId,
        creator_id: event.creatorId,
        title: event.title,
        description: event.description,
        image_url: event.image,
        start_at: startTimestamp,
        end_at: endTimestamp,
        venue: event.location,
        city: event.city,
        state: event.state,
        latitude: event.latitude,
        longitude: event.longitude,
        is_vip_only: event.isVipOnly,
        is_transfer_enabled: event.isTransferEnabled,
        capacity: event.capacity,
        staff: event.staff,
        batches: event.batches,
        guest_list_rules: event.guestListRules,
        vibe_tags: event.vibeTags || [],
        lineup: event.lineup || null,
        dress_code: event.dressCode || null,
        entry_tips: event.entryTips || null,
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;
    const startAtDate = new Date(data.start_at);
    return { ...event, id: data.id, startTime: formatTimeInTZ(startAtDate, APP_TIMEZONE) } as any;
  } catch (err) {
    console.error('[VANTA EVENTS API] Erro ao criar evento:', err);
    return null;
  }
}

export async function updateEvent(eventId: string, updates: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.image !== undefined) dbUpdates.image_url = updates.image;
    if (updates.location !== undefined) dbUpdates.venue = updates.location;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
    if (updates.isVipOnly !== undefined) dbUpdates.is_vip_only = updates.isVipOnly;
    if (updates.isTransferEnabled !== undefined) dbUpdates.is_transfer_enabled = updates.isTransferEnabled;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.vibeTags !== undefined) dbUpdates.vibe_tags = updates.vibeTags;
    if (updates.staff !== undefined) dbUpdates.staff = updates.staff;
    if (updates.batches !== undefined) dbUpdates.batches = updates.batches;
    if (updates.guestListRules !== undefined) dbUpdates.guest_list_rules = updates.guestListRules;
    if (updates.lineup !== undefined) dbUpdates.lineup = updates.lineup || null;
    if (updates.dressCode !== undefined) dbUpdates.dress_code = updates.dressCode || null;
    if (updates.entryTips !== undefined) dbUpdates.entry_tips = updates.entryTips || null;
    if (updates.startDate && updates.startTime && updates.endTime) {
      const { startISO, endISO } = toLocalISOWithOvernight(updates.startDate, updates.startTime, updates.endTime);
      dbUpdates.start_at = startISO;
      dbUpdates.end_at = endISO;
    }
    const { error } = await supabase.from('events').update(dbUpdates).eq('id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating event:', err);
    return false;
  }
}

/**
 * VANTA_SOCIAL: Compartilha um evento diretamente com um amigo (via Notificação).
 */
export async function shareEventWithFriend(eventId: string, friendId: string, senderName: string): Promise<boolean> {
  try {
    await notificationStore.addNotification(
      'event_share',
      friendId,
      senderName,
      { 
        eventId, 
        action_type: 'event_share',
        sharerName: senderName 
      }
    );
    return true;
  } catch (err) {
    console.error("[VANTA SHARE] Erro ao compartilhar:", err);
    return false;
  }
}
