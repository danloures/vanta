interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  // Fix: Removed optional modifier to match standard ImportMeta definitions (e.g. from vite/client)
  readonly env: ImportMetaEnv;
}
