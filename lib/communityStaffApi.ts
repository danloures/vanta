import { supabase } from './supabaseClient';
import { CommunityStaff, StaffTemplate } from '../types';
import { createAuditLog } from './auditApi';

/**
 * VANTA_SOVEREIGN: Retorna os IDs das comunidades onde o usuário tem vínculo em community_staff.
 * (Usado para "Minhas Comunidades" no painel admin)
 */
export async function fetchMyCommunityIds(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('community_staff')
      .select('community_id')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || [])
      .map((r: any) => r.community_id)
      .filter(Boolean);
  } catch (err) {
    console.error("[VANTA STAFF API] Erro ao buscar community_ids do usuário:", err);
    return [];
  }
}

/**
 * VANTA_SOVEREIGN: Busca permissões específicas de um usuário em uma unidade.
 */
export async function fetchMyPermissionsInUnit(communityId: string, userId: string): Promise<Record<string, boolean>> {
  if (!supabase || !communityId || !userId) return {};

  try {
    const { data, error } = await supabase
      .from('community_staff')
      .select('permissions')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.permissions || {};
  } catch (err) {
    console.error("[VANTA STAFF API] Erro ao buscar permissões contextuais:", err);
    return {};
  }
}

/**
 * VANTA_SOVEREIGN: Vincula um membro a uma unidade específica com um template de cargo.
 * AGORA COM NOTIFICAÇÃO AUTOMÁTICA VIA RPC SOBERANA.
 */
export async function grantCommunityAccess(
  communityId: string, 
  userId: string, 
  template: StaffTemplate
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Cria o registro de vínculo
    const { error: staffError } = await supabase
      .from('community_staff')
      .upsert({
        community_id: communityId,
        user_id: userId,
        template_id: template.id,
        role_name: template.name,
        permissions: template.permissions
      }, { onConflict: 'community_id,user_id' });

    if (staffError) throw staffError;

    // 2. Atualiza a role global
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'vanta_staff' })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. Auditoria Blindada
    await createAuditLog({
      communityId,
      action: 'GRANT_STAFF_ACCESS',
      category: 'STAFF',
      targetId: userId,
      details: { role_name: template.name }
    });

    // 4. NOTIFICAÇÃO SOBERANA: Avisa o membro que ele ganhou um cargo via RPC
    const { data: comm } = await supabase.from('communities').select('name').eq('id', communityId).single();
    const { data: { user: executor } } = await supabase.auth.getUser();
    
    await supabase.rpc('vanta_notify', {
      p_user_id: userId,
      p_type: 'staff_assignment',
      p_text: `Você recebeu acesso administrativo como ${template.name} em ${comm?.name || 'Unidade'}.`,
      p_member_id: executor?.id,
      p_event_id: null,
      p_metadata: {
        roleName: template.name,
        communityName: comm?.name,
        action_type: 'staff_assignment'
      }
    });

    return true;
  } catch (err) {
    console.error("[VANTA STAFF API] Erro ao conceder acesso:", err);
    return false;
  }
}

/**
 * Revoga o acesso de um membro a uma unidade específica.
 */
export async function revokeCommunityAccess(communityId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('community_staff')
      .delete()
      .match({ community_id: communityId, user_id: userId });

    if (error) throw error;

    const { data: otherAccess } = await supabase
      .from('community_staff')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!otherAccess || otherAccess.length === 0) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile && !['admin', 'master', 'vanta_master'].includes(profile.role.toLowerCase())) {
        await supabase.from('profiles').update({ role: 'user', permissions: {} }).eq('id', userId);
      }
    }

    await createAuditLog({
      communityId,
      action: 'REVOKE_STAFF_ACCESS',
      category: 'STAFF',
      targetId: userId
    });

    return true;
  } catch (err) {
    console.error("[VANTA STAFF API] Erro ao revogar acesso:", err);
    return false;
  }
}

export async function fetchUnitStaff(communityId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('community_staff')
    .select(`
      *,
      profile:profiles!user_id(id, full_name, avatar_url, instagram_handle, gender)
    `)
    .eq('community_id', communityId);

  if (error) {
    console.error("[VANTA STAFF API] Erro ao listar equipe:", error);
    return [];
  }

  return (data || []).map(row => ({
    ...row.profile,
    id: row.user_id,
    staff_id: row.id,
    role: row.role_name,
    permissions: row.permissions,
    joined_at: row.created_at
  }));
}
