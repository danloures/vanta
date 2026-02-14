
import { GuestListRule } from '../types';

export interface LegoRule {
  benefit: 'VIP' | 'DESCONTO' | 'CONSUMAÇÃO' | string;
  gender: 'M' | 'F' | 'U';
  timingType: 'ALL_NIGHT' | 'DEADLINE';
  deadline?: string;
  area: string;
  value: number;
}

/**
 * Gera o rótulo automático baseado nos atributos selecionados
 */
export const generateRuleLabel = (rule: LegoRule): string => {
  const benefitStr = rule.benefit.toUpperCase();
  const genderStr = rule.gender === 'M' ? 'MASCULINO' : rule.gender === 'F' ? 'FEMININO' : 'UNISEX';
  const areaStr = rule.area.toUpperCase();
  const timeStr = rule.timingType === 'ALL_NIGHT' ? 'NOITE TODA' : `ATÉ ${rule.deadline}`;
  const valueStr = rule.value > 0 ? `R$ ${rule.value}` : '';

  return `${benefitStr} ${genderStr} (${areaStr}) ${timeStr} ${valueStr}`.trim();
};

/**
 * Converte o estado do "Lego" para o formato GuestListRule do banco de dados
 */
export const transformToGuestListRule = (lego: LegoRule): Omit<GuestListRule, 'id'> => {
  return {
    area: lego.area,
    gender: lego.gender as any,
    type: (lego.benefit === 'VIP' ? 'VIP' : lego.benefit === 'CONSUMAÇÃO' ? 'CONSUMPTION' : 'DISCOUNT') as any,
    value: lego.value,
    deadline: lego.timingType === 'DEADLINE' ? lego.deadline : null
  };
};
