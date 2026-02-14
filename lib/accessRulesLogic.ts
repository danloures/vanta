
import { GuestListRule } from '../types';

export type RuleStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED';

/**
 * Converte string "HH:mm" para minutos totais do dia para comparação fácil
 */
const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 1440; // Se não tem deadline, dura até o fim do dia (23:59 + 1)
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Determina o status de uma regra baseado no horário atual do sistema
 */
export const getRuleStatus = (rule: GuestListRule, currentTime: Date = new Date()): RuleStatus => {
  if (!rule.deadline) return 'ACTIVE';

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const deadlineMinutes = timeToMinutes(rule.deadline);

  if (currentMinutes >= deadlineMinutes) return 'EXPIRED';
  
  // Opcional: Implementar 'UPCOMING' se a regra tiver um horário de início
  return 'ACTIVE';
};

/**
 * Ordena e filtra as regras para a visão de Timeline da Portaria
 */
export const sortRulesByTimeline = (rules: GuestListRule[]) => {
  const now = new Date();
  
  return [...rules].sort((a, b) => {
    const statusA = getRuleStatus(a, now);
    const statusB = getRuleStatus(b, now);

    // Prioridade: Ativas primeiro, depois expiradas
    if (statusA === 'ACTIVE' && statusB === 'EXPIRED') return -1;
    if (statusA === 'EXPIRED' && statusB === 'ACTIVE') return 1;

    // Sub-ordenação por horário
    return timeToMinutes(a.deadline) - timeToMinutes(b.deadline);
  });
};

/**
 * Formata o valor monetário para exibição na portaria
 */
export const formatRuleValue = (rule: GuestListRule) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(rule.value || 0);
};
