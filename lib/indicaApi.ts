
import { supabase } from './supabaseClient';

export interface IndicaAdminItem {
  id?: string;
  type: 'EVENT' | 'LINK';
  event_id?: string | null;
  url?: string;
  title: string;
  image_url: string;
  tag: string;
  city?: string | null; // Null = Global
  is_active: boolean;
  created_at?: string;
}

/**
 * Busca todos os itens para o painel administrativo (Ativos e Inativos)
 */
export async function fetchAdminIndica(): Promise<IndicaAdminItem[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('vanta_indica')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[INDICA ADMIN] Erro ao buscar itens:", error);
    return [];
  }
  return data as IndicaAdminItem[];
}

/**
 * Salva (Cria ou Atualiza) um item do Vanta Indica
 */
export async function saveIndicaItem(item: IndicaAdminItem): Promise<{ success: boolean; message?: string }> {
  if (!supabase) return { success: false, message: "Erro de conexão" };

  // Validação de Limite de Ativos (Máximo 5)
  if (item.is_active) {
    const { count, error: countError } = await supabase
      .from('vanta_indica')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .neq('id', item.id || '00000000-0000-0000-0000-000000000000'); // Exclui o próprio item da contagem se for edição

    if (!countError && (count || 0) >= 5) {
      return { success: false, message: "Limite atingido: Máximo de 5 destaques ativos simultaneamente." };
    }
  }

  const payload = {
    type: item.type,
    title: item.title,
    image_url: item.image_url,
    tag: item.tag,
    city: item.city || null,
    event_id: item.type === 'EVENT' ? item.event_id : null,
    url: item.type === 'LINK' ? item.url : null,
    is_active: item.is_active
  };

  let error;
  
  if (item.id) {
    // Update
    const { error: upError } = await supabase
      .from('vanta_indica')
      .update(payload)
      .eq('id', item.id);
    error = upError;
  } else {
    // Insert
    const { error: inError } = await supabase
      .from('vanta_indica')
      .insert([payload]);
    error = inError;
  }

  if (error) {
    console.error("[INDICA ADMIN] Erro ao salvar:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * Remove um item do Vanta Indica
 */
export async function deleteIndicaItem(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('vanta_indica').delete().eq('id', id);
  return !error;
}
