
-- ============================================================
-- VANTA MIGRATION: CREATE MISSING INFRASTRUCTURE
-- Corrige erro 42P01 (Table not found) para Audit e Ethics
-- ============================================================

BEGIN;

-- 1. AUDIT LOGS (Tabela Central de Auditoria)
CREATE TABLE IF NOT EXISTS public.vanta_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    performed_by_id UUID DEFAULT auth.uid(), 
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger para garantir identidade no Log (Anti-Spoofing)
CREATE OR REPLACE FUNCTION public.set_audit_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.performed_by_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_audit_user ON public.vanta_audit_logs;
CREATE TRIGGER trg_set_audit_user
BEFORE INSERT ON public.vanta_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.set_audit_user();


-- 2. TRIBUNAL DE ÉTICA (Incidence Reports & Voting)
CREATE TABLE IF NOT EXISTS public.incidence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    subject_id UUID NOT NULL REFERENCES public.profiles(id),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    final_verdict TEXT,
    voting_deadline TIMESTAMP WITH TIME ZONE,
    voter_roles TEXT[],
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.incidence_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.incidence_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.council_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.incidence_reports(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id),
    choice TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(report_id, voter_id)
);


-- 3. PERMISSÕES & SEGURANÇA (RLS)
ALTER TABLE public.vanta_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidence_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_votes ENABLE ROW LEVEL SECURITY;

-- Grants (Portão da API)
GRANT ALL ON public.vanta_audit_logs TO authenticated;
GRANT ALL ON public.incidence_reports TO authenticated;
GRANT ALL ON public.incidence_proofs TO authenticated;
GRANT ALL ON public.council_votes TO authenticated;

-- Policies (Regras de Negócio)

-- Audit Logs: Apenas Master e Donos podem ler. Todos podem escrever (logar ações).
DROP POLICY IF EXISTS "Read Audit Logs" ON public.vanta_audit_logs;
CREATE POLICY "Read Audit Logs" ON public.vanta_audit_logs 
FOR SELECT USING (
  public.is_master_executor() 
  OR (community_id IN (SELECT id FROM public.communities WHERE owner_id = auth.uid()))
);

DROP POLICY IF EXISTS "Insert Audit Logs" ON public.vanta_audit_logs;
CREATE POLICY "Insert Audit Logs" ON public.vanta_audit_logs 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Incidence Reports: Visível para Envolvidos, Staff da Unidade e Masters.
DROP POLICY IF EXISTS "Read Incidences" ON public.incidence_reports;
CREATE POLICY "Read Incidences" ON public.incidence_reports
FOR SELECT USING (
  public.is_master_executor()
  OR auth.uid() = reporter_id
  OR auth.uid() = subject_id
  OR EXISTS (SELECT 1 FROM public.community_staff WHERE community_id = incidence_reports.community_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.communities WHERE id = incidence_reports.community_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Create Incidences" ON public.incidence_reports;
CREATE POLICY "Create Incidences" ON public.incidence_reports
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Update Incidences" ON public.incidence_reports;
CREATE POLICY "Update Incidences" ON public.incidence_reports
FOR UPDATE USING (
  public.is_master_executor()
  OR EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND owner_id = auth.uid())
);

-- Incidence Proofs
DROP POLICY IF EXISTS "Read Proofs" ON public.incidence_proofs;
CREATE POLICY "Read Proofs" ON public.incidence_proofs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.incidence_reports r
    WHERE r.id = report_id
    AND (
      public.is_master_executor()
      OR r.reporter_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.community_staff cs WHERE cs.community_id = r.community_id AND cs.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = r.community_id AND c.owner_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Insert Proofs" ON public.incidence_proofs;
CREATE POLICY "Insert Proofs" ON public.incidence_proofs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Council Votes
DROP POLICY IF EXISTS "Read Votes" ON public.council_votes;
CREATE POLICY "Read Votes" ON public.council_votes
FOR SELECT USING (
  public.is_master_executor()
  OR EXISTS (
    SELECT 1 FROM public.incidence_reports r 
    JOIN public.communities c ON r.community_id = c.id
    WHERE r.id = council_votes.report_id AND c.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Cast Vote" ON public.council_votes;
CREATE POLICY "Cast Vote" ON public.council_votes
FOR INSERT WITH CHECK (auth.uid() = voter_id);

COMMIT;
