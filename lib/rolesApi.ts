import { supabase } from './supabaseClient';
import { CustomRole } from '../types';

export async function fetchCustomRoles(communityId: string): Promise<CustomRole[]> {
  if (!supabase || !communityId) return [];
  
  const { data, error } = await supabase
    .from('community_custom_roles')
    .select('*')
    .eq('community_id', communityId);

  if (error) {
    console.error("[VANTA ROLES API] Erro ao carregar cargos:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    communityId: row.community_id,
    name: row.name,
    scope: row.scope,
    permissions: row.permissions
  }));
}

export async function createCustomRole(params: Omit<CustomRole, 'id'>): Promise<CustomRole | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('community_custom_roles')
    .insert([{
      community_id: params.communityId,
      name: params.name,
      scope: params.scope,
      permissions: params.permissions
    }])
    .select()
    .single();

  if (error) {
    console.error("[VANTA ROLES API] Erro ao criar cargo:", error);
    return null;
  }

  return {
    id: data.id,
    communityId: data.community_id,
    name: data.name,
    scope: data.scope,
    permissions: data.permissions
  };
}