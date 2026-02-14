
-- ============================================================
-- VANTA MIGRATION: FIX STAFF & ADMIN PERMISSIONS [CRITICAL]
-- Resolve erro 42501 (Permission Denied) em tabelas de gestão
-- ============================================================

BEGIN;

-- 1. VANTA STAFF TEMPLATES
-- O erro relatado "permission denied for table vanta_staff_templates" ocorre aqui.
ALTER TABLE public.vanta_staff_templates ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.vanta_staff_templates TO authenticated;

-- Policy: Leitura (Necessário para carregar listas de seleção)
DROP POLICY IF EXISTS "Read Staff Templates" ON public.vanta_staff_templates;
CREATE POLICY "Read Staff Templates" ON public.vanta_staff_templates 
FOR SELECT USING (true);

-- Policy: Escrita (Apenas Master ou Donos podem criar/editar templates)
DROP POLICY IF EXISTS "Manage Staff Templates" ON public.vanta_staff_templates;
CREATE POLICY "Manage Staff Templates" ON public.vanta_staff_templates 
FOR ALL 
USING (
  public.is_master_executor() 
  OR EXISTS (SELECT 1 FROM public.communities WHERE id = vanta_staff_templates.community_id AND owner_id = auth.uid())
)
WITH CHECK (
  public.is_master_executor() 
  OR EXISTS (SELECT 1 FROM public.communities WHERE id = vanta_staff_templates.community_id AND owner_id = auth.uid())
);


-- 2. COMMUNITY STAFF (Vínculos de Equipe)
ALTER TABLE public.community_staff ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.community_staff TO authenticated;

DROP POLICY IF EXISTS "Read Community Staff" ON public.community_staff;
CREATE POLICY "Read Community Staff" ON public.community_staff 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage Community Staff" ON public.community_staff;
CREATE POLICY "Manage Community Staff" ON public.community_staff 
FOR ALL 
USING (
  public.is_master_executor() 
  OR EXISTS (SELECT 1 FROM public.communities WHERE id = community_staff.community_id AND owner_id = auth.uid())
);


-- 3. VANTA GLOBAL TAGS
ALTER TABLE public.vanta_global_tags ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.vanta_global_tags TO authenticated;

DROP POLICY IF EXISTS "Read Global Tags" ON public.vanta_global_tags;
CREATE POLICY "Read Global Tags" ON public.vanta_global_tags 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage Global Tags" ON public.vanta_global_tags;
CREATE POLICY "Manage Global Tags" ON public.vanta_global_tags 
FOR ALL 
USING (public.is_master_executor());


-- 4. VANTA AUDIT LOGS
ALTER TABLE public.vanta_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.vanta_audit_logs TO authenticated;

-- Policy: Leitura (Apenas Masters e Donos podem ler logs)
DROP POLICY IF EXISTS "Read Audit Logs" ON public.vanta_audit_logs;
CREATE POLICY "Read Audit Logs" ON public.vanta_audit_logs 
FOR SELECT USING (
  public.is_master_executor() 
  OR (community_id IN (SELECT id FROM public.communities WHERE owner_id = auth.uid()))
);

-- Policy: Escrita (Qualquer usuário autenticado pode GERAR um log via sistema)
-- Isso é crucial para que o rastro de auditoria funcione.
DROP POLICY IF EXISTS "Insert Audit Logs" ON public.vanta_audit_logs;
CREATE POLICY "Insert Audit Logs" ON public.vanta_audit_logs 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;
