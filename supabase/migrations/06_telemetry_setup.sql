
-- ============================================================
-- VANTA MIGRATION: NAVIGATION TELEMETRY (CÂMERA DE LOG)
-- Tabela dedicada para rastreio de navegação em áreas privadas
-- ============================================================

BEGIN;

-- 1. Criação da Tabela de Telemetria
CREATE TABLE IF NOT EXISTS public.vanta_navigation_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se o user for deletado, mantemos o log como anônimo ou nulo, ou cascade se preferir
    screen_name TEXT NOT NULL,
    resource_id TEXT, -- ID do evento, comunidade ou membro sendo visualizado
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT, -- Opcional, para segurança futura
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Índices para Performance (Alta velocidade de leitura)
CREATE INDEX IF NOT EXISTS idx_telemetry_user ON public.vanta_navigation_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.vanta_navigation_telemetry(created_at DESC);

-- 3. Segurança (RLS)
ALTER TABLE public.vanta_navigation_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Escrita (Qualquer usuário logado pode registrar sua própria navegação)
DROP POLICY IF EXISTS "Log Navigation" ON public.vanta_navigation_telemetry;
CREATE POLICY "Log Navigation" ON public.vanta_navigation_telemetry
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Leitura (Apenas Masters e Donos de Comunidade relevantes podem ver)
-- Por enquanto, restrito a Masters para garantir privacidade máxima, ou expansível conforme regra de negócio.
DROP POLICY IF EXISTS "View Telemetry" ON public.vanta_navigation_telemetry;
CREATE POLICY "View Telemetry" ON public.vanta_navigation_telemetry
FOR SELECT USING (
  public.is_master_executor()
);

-- 4. Grants
GRANT INSERT, SELECT ON public.vanta_navigation_telemetry TO authenticated;

COMMIT;
