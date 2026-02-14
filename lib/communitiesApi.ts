import { supabase } from './supabaseClient';
import { Community } from '../types';
import { getAvatarFallback } from './userMapper';
import { fetchMyCommunityIds } from './communityStaffApi';

export async function fetchCommunities(): Promise<Community[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*, owner:profiles!owner_id(full_name, avatar_url, gender)')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      image_url: row.image_url || '',
      logo_url: row.logo_url || '',
      type: row.type,
      address: row.address,
      city: row.city || '',
      state: row.state || '',
      latitude: row.latitude,
      longitude: row.longitude,
      owner_id: row.owner_id,
      owner_name: row.owner?.full_name || 'Membro VANTA',
      owner_avatar: row.owner?.avatar_url || getAvatarFallback(row.owner?.gender),
      is_active: row.is_active,
      // @ts-ignore (compat sem quebrar tipos antigos)
      is_archived: row.is_archived === true,
      eventIds: [],
      createdAt: new Date(row.created_at).getTime()
    }));
  } catch (err) {
    console.error('[VANTA COMMUNITIES API] Erro ao carregar:', err);
    return [];
  }
}

export async function fetchMyCommunities(userId: string): Promise<Community[]> {
  if (!supabase || !userId) return [];

  try {
    const staffCommunityIds = await fetchMyCommunityIds(userId);

    let query = supabase
      .from('communities')
      .select('*, owner:profiles!owner_id(full_name, avatar_url, gender)')
      .eq('is_archived', false)
      .eq('owner_id', userId);

    if (staffCommunityIds.length > 0) {
      query = query.or(`id.in.(${staffCommunityIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const uniq = new Map<string, any>();
    (data || []).forEach((row: any) => {
      if (row?.id) uniq.set(row.id, row);
    });

    return Array.from(uniq.values()).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      image_url: row.image_url || '',
      logo_url: row.logo_url || '',
      type: row.type,
      address: row.address,
      city: row.city || '',
      state: row.state || '',
      latitude: row.latitude,
      longitude: row.longitude,
      owner_id: row.owner_id,
      owner_name: row.owner?.full_name || 'Membro VANTA',
      owner_avatar: row.owner?.avatar_url || getAvatarFallback(row.owner?.gender),
      is_active: row.is_active,
      // @ts-ignore (compat sem quebrar tipos antigos)
      is_archived: row.is_archived === true,
      eventIds: [],
      createdAt: new Date(row.created_at).getTime()
    }));
  } catch (err) {
    console.error('[VANTA COMMUNITIES API] Erro ao carregar comunidades do usuário:', err);
    return [];
  }
}

export async function createCommunity(
  community: Omit<Community, 'id' | 'createdAt' | 'stats' | 'eventIds'>
): Promise<Community | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('communities')
      .insert([
        {
          name: community.name,
          description: community.description,
          image_url: community.image_url,
          logo_url: community.logo_url,
          type: community.type,
          address: community.address,
          city: community.city,
          state: community.state,
          latitude: community.latitude,
          longitude: community.longitude,
          owner_id: community.owner_id,
          is_active: community.is_active,
          is_archived: false
        }
      ])
      .select('*, owner:profiles!owner_id(full_name, avatar_url, gender)')
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      image_url: data.image_url || '',
      logo_url: data.logo_url || '',
      type: data.type,
      address: data.address,
      city: data.city || '',
      state: data.state || '',
      latitude: data.latitude,
      longitude: data.longitude,
      owner_id: data.owner_id,
      owner_name: data.owner?.full_name || 'Membro VANTA',
      owner_avatar: data.owner?.avatar_url || getAvatarFallback(data.owner?.gender),
      is_active: data.is_active,
      // @ts-ignore
      is_archived: data.is_archived === true,
      eventIds: [],
      createdAt: new Date(data.created_at).getTime()
    };
  } catch (err) {
    console.error('[VANTA COMMUNITIES API] Erro ao criar unidade:', err);
    return null;
  }
}

/**
 * VANTA_SOVEREIGN: Payload de atualização blindado.
 * Impede a mudança de dono (owner_id) via cliente.
 */
export type CommunityUpdatePayload = Omit<Partial<Community>, 'id' | 'owner_id' | 'createdAt' | 'stats' | 'eventIds'>;

export async function updateCommunity(id: string, updates: CommunityUpdatePayload): Promise<boolean> {
  if (!supabase) return false;

  try {
    const safeUpdates: any = {};
    const allowedKeys = ['name', 'description', 'image_url', 'logo_url', 'type', 'address', 'city', 'state', 'latitude', 'longitude', 'is_active'];

    allowedKeys.forEach(key => {
      if ((updates as any)[key] !== undefined) {
        safeUpdates[key] = (updates as any)[key];
      }
    });

    const { error } = await supabase
      .from('communities')
      .update(safeUpdates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[VANTA COMMUNITIES API] Erro ao atualizar unidade:', err);
    return false;
  }
}
