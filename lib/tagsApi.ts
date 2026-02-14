import { supabase } from './supabaseClient';
import { GlobalTag } from '../types';

export async function fetchGlobalTags(): Promise<GlobalTag[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('vanta_global_tags').select('*').order('priority', { ascending: false });
  if (error) return [];
  return data.map(t => ({ id: t.id, name: t.name, color: t.color, priority: t.priority }));
}

export async function createGlobalTag(tag: Omit<GlobalTag, 'id'>): Promise<GlobalTag | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('vanta_global_tags').insert([tag]).select().single();
  if (error) return null;
  return { id: data.id, name: data.name, color: data.color, priority: data.priority };
}

export async function deleteGlobalTag(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('vanta_global_tags').delete().eq('id', id);
  return !error;
}