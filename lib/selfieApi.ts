
import { supabase } from './supabaseClient';

export const uploadSelfie = async (userId: string, blob: Blob): Promise<string> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  
  const { data: { session } } = await (supabase.auth as any).getSession();
  if (!session || session.user.id !== userId) throw new Error("Não autorizado.");
  
  // ESTRUTURA: {userId}/{timestamp}.jpg -> Essencial para passar na política de RLS
  const filePath = `${userId}/${Date.now()}.jpg`;
  
  const { error } = await supabase.storage.from('selfies').upload(filePath, blob, { 
    contentType: 'image/jpeg', 
    upsert: false 
  });
  
  if (error) throw error;
  
  return supabase.storage.from('selfies').getPublicUrl(filePath).data.publicUrl;
};

/**
 * VANTA_SOVEREIGN: Sincronização de perfil com whitelist rigorosa.
 * Impede a injeção de campos administrativos pelo cliente.
 */
export const syncUserProfile = async (userId: string, profileData: any): Promise<void> => {
  const { data: { session } } = await (supabase.auth as any).getSession();
  const sessionUserId = session?.user?.id;
  
  if (!sessionUserId) throw new Error('Sessão não autenticada no Supabase (auth.uid() nulo).');
  if (sessionUserId !== userId) {
    throw new Error(`Sessão mismatch (RLS Security): session=${sessionUserId} userId=${userId}`);
  }

  if (!supabase) throw new Error("Supabase não configurado.");

  // WHITELIST RIGOROSA V10.0
  const ALLOWED_KEYS = [
    'full_name', 'instagram_handle', 'avatar_url', 'selfie_url', 
    'bio', 'gallery', 'privacy', 'gender', 'city', 'state', 
    'birth_date', 'phone_e164'
  ];

  const filteredData: Record<string, any> = {};
  ALLOWED_KEYS.forEach(key => {
    if (profileData[key] !== undefined) {
      filteredData[key] = profileData[key];
    }
  });
  
  const { error } = await supabase.from('profiles').upsert({ 
    id: userId, 
    ...filteredData, 
    updated_at: new Date().toISOString() 
  }, { 
    onConflict: 'id' 
  });
  
  if (error) {
    console.error("[VANTA SYNC ERROR]", error);
    throw error;
  }
};

export const submitApplication = async (userId: string, selfieUrl: string): Promise<void> => {
  const { data: { session } } = await (supabase.auth as any).getSession();
  const sessionUserId = session?.user?.id;
  
  if (!sessionUserId) throw new Error('Sessão não autenticada.');
  if (sessionUserId !== userId) {
    throw new Error('Sessão mismatch durante aplicação.');
  }

  if (!supabase) throw new Error("Supabase não configurado.");
  
  const { error } = await supabase
    .from('member_applications')
    .insert([
      { 
        user_id: userId, 
        selfie_url: selfieUrl, 
        status: 'pending', 
        applied_at: new Date().toISOString() 
      }
    ]);

  if (error) {
    console.error("[VANTA SUBMIT ERROR]", error);
    throw error;
  }
};
