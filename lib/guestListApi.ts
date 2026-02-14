
import { supabase } from './supabaseClient';
import { GuestEntry } from '../types';

export async function addGuestToEventList(params: {
  eventId: string;
  ruleId: string;
  name: string;
  addedByEmail: string;
  userId?: string;
  notifyOnArrival?: boolean;
}): Promise<GuestEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('event_guests')
    .insert([{
      event_id: params.eventId,
      rule_id: params.ruleId,
      name: params.name.toUpperCase(),
      user_id: params.userId,
      added_by_email: params.addedByEmail,
      checked_in: false,
      notify_on_arrival: params.notifyOnArrival || false
    }])
    .select()
    .single();

  if (error) {
    console.error("[VANTA GUESTLIST] Erro ao adicionar convidado:", error);
    return null;
  }

  return {
    id: data.id,
    eventId: data.event_id,
    name: data.name,
    userId: data.user_id,
    ruleId: data.rule_id,
    addedByEmail: data.added_by_email,
    checkedIn: data.checked_in,
    notifyOnArrival: data.notify_on_arrival
  };
}

export async function toggleGuestPriority(guestId: string, currentStatus: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('event_guests')
    .update({ notify_on_arrival: !currentStatus })
    .eq('id', guestId);
  return !error;
}

export async function fetchEventGuests(eventId: string): Promise<GuestEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('event_guests')
    .select('*')
    .eq('event_id', eventId);

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    userId: row.user_id,
    ruleId: row.rule_id,
    addedByEmail: row.added_by_email,
    checkedIn: row.checked_in,
    checkInTime: row.checked_in_at ? new Date(row.checked_in_at).getTime() : undefined,
    notifyOnArrival: row.notify_on_arrival
  }));
}

export async function checkInGuest(guestId: string, eventId: string, staffEmail: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('event_guests')
    .update({ 
      checked_in: true, 
      checked_in_at: new Date().toISOString(),
      checked_in_by_email: staffEmail
    })
    .eq('id', guestId)
    .eq('event_id', eventId);

  return !error;
}
