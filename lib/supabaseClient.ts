import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type AnyObj = Record<string, any>;

function readRuntimeEnv(): AnyObj {
  try {
    const w = window as any;
    return (
      w?.__VANTA_ENV__ ||
      w?.__VANTA_ENV_FROM_FILE__ ||
      w?.__ENV__ ||
      {}
    );
  } catch {
    return {};
  }
}

function readViteEnv(): AnyObj {
  try {
    return (import.meta as any)?.env || {};
  } catch {
    return {};
  }
}

const viteEnv = readViteEnv();
const runtimeEnv = typeof window !== 'undefined' ? readRuntimeEnv() : {};

const supabaseUrl =
  (viteEnv.VITE_SUPABASE_URL as string | undefined) ||
  (runtimeEnv.VITE_SUPABASE_URL as string | undefined);

const supabaseAnonKey =
  (viteEnv.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (runtimeEnv.VITE_SUPABASE_ANON_KEY as string | undefined);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// ✅ Nunca crasha o app
export const supabase: SupabaseClient | null =
  isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

if (!isSupabaseConfigured) {
  console.warn(
    '[VANTA][SUPABASE] Desativado: faltou VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no env (.env.local ou runtime env.js/index.html).'
  );
}
