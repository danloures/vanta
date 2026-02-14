import { supabase } from './supabaseClient';
import { RsvpStatus } from '../types';

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function getMyRsvp(eventId: string, userId: string): Promise<RsvpStatus | null> {
  if (!supabase || !isUUID(userId)) return null;
  try {
    const { data, error } = await supabase.from('event_rsvps').select('status').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
    if (error) throw error; return data ? (data.status as RsvpStatus) : null;
  } catch { return null; }
}

export async function setGoing(eventId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase não configurado.");
  
  // VANTA_SYNC: Validação de integridade de UUID para evitar erros de constraint no banco
  if (!isUUID(userId)) {
    console.error("[VANTA_SYNC] Tentativa de RSVP com ID inválido detectada e bloqueada:", userId);
    return;
  }

  const { error } = await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: userId, status: 'going', updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
  if (error) throw error;
}