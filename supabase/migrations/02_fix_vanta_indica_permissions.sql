
-- ============================================================
-- VANTA MIGRATION: FIX VANTA INDICA PERMISSIONS
-- Liberar escrita segura para gestão de destaques
-- ============================================================

BEGIN;

-- 1. Ativar RLS explicitamente para garantir que as policies funcionem
ALTER TABLE public.vanta_indica ENABLE ROW LEVEL SECURITY;

-- 2. Conceder permissões de escrita para usuários autenticados
-- (O RLS vai filtrar QUEM pode fazer isso, mas o GRANT é o portão inicial)
GRANT ALL ON public.vanta_indica TO authenticated;

-- 3. Policy: Leitura Pública (Mantém o comportamento atual de visualização)
DROP POLICY IF EXISTS "Public Read Vanta Indica" ON public.vanta_indica;
CREATE POLICY "Public Read Vanta Indica" ON public.vanta_indica
FOR SELECT USING (true);

-- 4. Policy: Gestão Soberana (Apenas Masters podem criar/editar/excluir)
-- Utiliza a função 'is_master_executor()' definida na estrutura principal
DROP POLICY IF EXISTS "Master Manage Vanta Indica" ON public.vanta_indica;
CREATE POLICY "Master Manage Vanta Indica" ON public.vanta_indica
FOR ALL
USING (public.is_master_executor())
WITH CHECK (public.is_master_executor());

COMMIT;
