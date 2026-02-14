
import { supabase } from './supabaseClient';
import { MemberProfile } from '../types';

export type { MemberProfile };

/**
 * VANTA_SOVEREIGN: Busca de membros via RPC (Security Definer).
 * Ignora RLS da tabela base e retorna apenas campos higienizados.
 */
export async function searchMembers(query: string): Promise<MemberProfile[]> {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase.rpc('search_public_profiles', {
      search_query: query.trim()
    });

    if (error) throw error;
    return (data || []) as MemberProfile[];
  } catch (err) {
    console.error("[VANTA SOVEREIGN RPC] Falha na busca social:", err);
    return [];
  }
}

/**
 * Busca um membro específico por ID via RPC (Security Definer) hardened
 */
export async function getMemberById(id: string): Promise<MemberProfile | null> {
  if (!supabase || !id) return null;
  try {
    const { data, error } = await supabase.rpc('get_public_profile', {
      target_id: id
    });
    
    if (error) throw error;
    return (data?.[0] as MemberProfile) ?? null;
  } catch (err) {
    console.error("[VANTA SOVEREIGN RPC] Erro ao carregar perfil:", err);
    return null;
  }
}

/**
 * Promove ou rebaixa o nível de acesso global via RPC Admin.
 * NECESSÁRIO: O usuário logado deve ser MASTER para o RPC aceitar a mutação.
 */
export async function updateMemberRole(userId: string, newRole: string, permissions: Record<string, boolean> = {}): Promise<boolean> {
  if (!supabase) return false;
  
  const { data, error } = await supabase.rpc('admin_update_member_role', {
    target_id: userId,
    new_role: newRole,
    new_perms: permissions
  });
  
  if (error) {
    console.error("[VANTA SOVEREIGN RPC] Falha ao atualizar cargo:", error);
    return false;
  }
  
  return data === true;
}
