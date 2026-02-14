
import { supabase } from './supabaseClient';
import { VantaAuditLog, AuditCategory } from '../types';

/**
 * VANTA_AUDIT: Registra uma ação soberana no banco de dados.
 * Blindagem: performed_by_id é SOBRESCRITO pelo servidor de Auth via TRIGGER no Postgres.
 * O front apenas envia os detalhes contextuais.
 */
export async function createAuditLog(params: {
  communityId?: string;
  eventId?: string;
  action: string;
  category: AuditCategory;
  targetId?: string;
  details?: any;
}) {
  if (!supabase) return null;

  try {
    // 1. Inserção atômica no banco
    // performed_by_id é omitido pois o Trigger 'enforce_vanta_audit_identity' o injetará automaticamente.
    const { error } = await supabase
      .from('vanta_audit_logs')
      .insert([{
        community_id: params.communityId ?? null,
        event_id: params.eventId ?? null,
        action: params.action,
        category: params.category,
        target_id: params.targetId ?? null,
        details: {
          ...params.details,
          _vanta_audit_v: '3.1_hardened',
          _timestamp: Date.now()
        }
      }]);

    if (error) {
      console.error("[VANTA AUDIT CRITICAL] Falha na persistência:", error);
    }
  } catch (err) {
    console.error("[VANTA AUDIT CRITICAL] Erro de protocolo:", err);
  }
}

/**
 * VANTA_TELEMETRY: "Câmera de Segurança" Lógica.
 * Registra acesso a telas sensíveis. Falha silenciosamente para não impactar UX.
 */
export async function recordTelemetry(screenName: string, resourceId?: string, extraDetails?: any) {
  if (!supabase) return;

  // Executa em "fire-and-forget" sem await para não bloquear a thread principal da UI
  supabase
    .from('vanta_navigation_telemetry')
    .insert([{
      screen_name: screenName,
      resource_id: resourceId || null,
      details: extraDetails || {}
    }])
    .then(({ error }) => {
      if (error) console.warn("[VANTA TELEMETRY] Falha no sinal:", error.message);
    })
    .catch(() => {}); // Catch-all absoluto
}

/**
 * VANTA_AUDIT: Busca logs segmentados por unidade ou evento.
 */
export async function fetchAuditLogs(filters: {
  communityId?: string;
  eventId?: string;
  category?: AuditCategory;
  limit?: number;
}): Promise<VantaAuditLog[]> {
  if (!supabase) return [];

  let query = supabase
    .from('vanta_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.communityId) query = query.eq('community_id', filters.communityId);
  if (filters.eventId) query = query.eq('event_id', filters.eventId);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) {
    console.error("[VANTA AUDIT] Falha ao buscar logs:", error);
    return [];
  }
  return (data || []) as VantaAuditLog[];
}

/**
 * VANTA_SOVEREIGN: Busca IDs de co-proprietários de uma unidade.
 */
export async function fetchCommunityCoOwners(communityId: string): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('community_co_owners')
      .select('user_id')
      .eq('community_id', communityId);
    
    if (error) throw error;
    return (data || []).map(row => row.user_id);
  } catch (err) {
    console.error("[VANTA COMMUNITIES] Erro ao carregar co-owners:", err);
    return [];
  }
}
