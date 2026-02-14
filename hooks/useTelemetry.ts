
import { useEffect } from 'react';
import { recordTelemetry } from '../lib/auditApi';

/**
 * VANTA_SENSOR: Hook de vigilância de navegação.
 * Deve ser instanciado em componentes de alto nível ou páginas críticas.
 * 
 * @param screenName Nome identificador da tela (ex: 'Financeiro', 'Detalhe Evento')
 * @param resourceId ID opcional do recurso sendo visualizado (ex: ID do Evento)
 * @param trigger Dependência opcional para forçar re-registro (ex: mudou de aba interna)
 */
export const useTelemetry = (screenName: string, resourceId?: string | null, trigger?: any) => {
  useEffect(() => {
    if (!screenName) return;

    // Disparo Assíncrono Seguro
    const logAccess = async () => {
      await recordTelemetry(screenName, resourceId || undefined, {
        timestamp: Date.now(),
        trigger_value: trigger ? String(trigger) : 'mount'
      });
    };

    logAccess();
    
    // Opcional: Logar saída (unmount) se necessário no futuro
    // return () => { recordTelemetry(screenName + '_EXIT', ...); };

  }, [screenName, resourceId, trigger]);
};
