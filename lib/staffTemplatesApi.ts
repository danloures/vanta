
import { supabase } from './supabaseClient';
import { StaffTemplate } from '../types';

export async function fetchStaffTemplates(communityId?: string | null): Promise<StaffTemplate[]> {
  if (!supabase) return [];
  
  try {
    // Busca templates globais + templates da comunidade atual
    let query = supabase
      .from('vanta_staff_templates')
      .select('*');

    if (communityId) {
      query = query.or(`is_global.eq.true,community_id.eq.${communityId}`);
    } else {
      query = query.eq('is_global', true);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      communityId: row.community_id,
      name: row.name,
      description: row.description,
      dos: Array.isArray(row.dos) ? row.dos : [],
      donts: Array.isArray(row.donts) ? row.donts : [],
      permissions: row.permissions || {},
      isGlobal: row.is_global,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error("[VANTA STAFF API] Erro ao carregar templates:", err);
    return [];
  }
}

export async function createStaffTemplate(template: Omit<StaffTemplate, 'id' | 'createdAt'>): Promise<StaffTemplate | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('vanta_staff_templates')
    .insert([{
      community_id: template.communityId,
      name: template.name,
      description: template.description,
      dos: template.dos,
      donts: template.donts,
      permissions: template.permissions,
      is_global: template.isGlobal
    }])
    .select()
    .single();

  if (error) {
    console.error("[VANTA STAFF API] Erro ao criar template:", error);
    return null;
  }

  return {
    id: data.id,
    communityId: data.community_id,
    name: data.name,
    description: data.description,
    dos: data.dos,
    donts: data.donts,
    permissions: data.permissions || {},
    isGlobal: data.is_global,
    createdAt: data.created_at
  };
}

export async function deleteStaffTemplate(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('vanta_staff_templates').delete().eq('id', id);
  return !error;
}
