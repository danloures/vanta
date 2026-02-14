import { supabase } from './supabaseClient';
import { MemberCuratedLevel } from '../types';

interface BroadcastParams {
  levels: MemberCuratedLevel[];
  city: string;
  eventId: string;
  actionType: 'notification' | 'invite';
  message: string;
  senderId: string;
}

export async function sendMassBroadcast(params: BroadcastParams): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase) return { success: false, count: 0, error: 'Supabase não configurado' };

  try {
    // VANTA_SYNC: Como curated_level agora é TEXT[], usamos o operador .overlaps() 
    // para encontrar membros que possuam QUALQUER uma das tags selecionadas.
    const { data: targets, error: filterError } = await supabase
      .from('profiles')
      .select('id')
      .overlaps('curated_level', params.levels)
      .eq('city', params.city);

    if (filterError) throw filterError;
    if (!targets || targets.length === 0) return { success: true, count: 0 };

    // 2. Disparo massivo via RPC Sovereign (individual por destinatário)
    await Promise.all(targets.map(target => 
      supabase.rpc('vanta_notify', {
        p_user_id: target.id,
        p_type: params.actionType === 'invite' ? 'event_invite' : 'message',
        p_text: params.message,
        p_member_id: params.senderId,
        p_event_id: params.eventId,
        p_metadata: {
          action_type: params.actionType,
          eventId: params.eventId
        }
      })
    ));

    return { success: true, count: targets.length };
  } catch (err: any) {
    console.error("[VANTA BROADCASTER] Falha no disparo massivo:", err);
    return { success: false, count: 0, error: err.message };
  }
}