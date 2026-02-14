
-- ============================================================
-- VANTA MIGRATION: NOTIFICATION ENGINE & PUSH DEVICES
-- Estrutura para suportar Push Notifications e Inbox Realtime
-- ============================================================

BEGIN;

-- 1. Tabela de Dispositivos (Para Push Notifications)
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL, -- O objeto de subscrição do Browser/PWA
    user_agent TEXT,
    platform TEXT DEFAULT 'web',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, subscription) -- Evita duplicidade de tokens para o mesmo user
);

-- 2. Segurança RLS para Devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users Manage Own Devices" ON public.user_devices;
CREATE POLICY "Users Manage Own Devices" ON public.user_devices
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.user_devices TO authenticated;

-- 3. Trigger para Limpeza (Opcional - Mantém a tabela limpa)
-- Se desejar, podemos criar uma function para remover devices inativos há > 1 ano, 
-- mas por enquanto deixaremos o histórico.

-- 4. Preparação para Edge Function (Comentário de Infraestrutura)
-- O gatilho real de envio de Push deve ser configurado via Supabase Dashboard > Database > Webhooks.
-- Configuração:
--   Name: send-push-notification
--   Table: public.notifications
--   Events: INSERT
--   Type: HTTP Request (Edge Function URL)

COMMIT;
