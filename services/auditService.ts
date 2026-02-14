
import { createAuditLog } from '../lib/auditApi';
import { AuditCategory } from '../types';

export interface VantaAuditLog {
  action: string;
  target_id: string;
  performed_by: string; // Legado: agora usado apenas para o nome descritivo no log
  details: any;
  category?: AuditCategory;
}

/**
 * VANTA_AUDIT_SERVICE: Wrapper de compatibilidade para funções que usam o serviço de log.
 * Integra-se ao novo protocolo de blindagem.
 */
export const logAdminAction = async (log: VantaAuditLog) => {
  try {
    await createAuditLog({
      action: log.action,
      category: log.category || 'GENERAL',
      targetId: log.target_id,
      details: {
        ...log.details,
        legacy_performer_label: log.performed_by
      }
    });
    
    // Log de console apenas para debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[VANTA AUDIT SYNC] Action: ${log.action} protocolada com sucesso.`);
    }
  } catch (err) {
    console.warn("[VANTA AUDIT] Falha ao processar log via serviço.", err);
  }
};
