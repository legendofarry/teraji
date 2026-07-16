
-- ==========================================================================
-- Teraji — P0.2 Clinical schema
-- ==========================================================================

-- ---------- counselors ---------------------------------------------------
CREATE TABLE public.counselors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credentials   TEXT,
  specialties   TEXT[] NOT NULL DEFAULT '{}',
  bio           TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX ix_counselors_org  ON public.counselors(org_id);
CREATE INDEX ix_counselors_user ON public.counselors(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counselors TO authenticated;
GRANT ALL ON public.counselors TO service_role;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_counselors_upd BEFORE UPDATE ON public.counselors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "counselors_org_read"   ON public.counselors FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "counselors_self_upd"   ON public.counselors FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "counselors_admin_mgmt" ON public.counselors FOR ALL    TO authenticated USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- ---------- clients ------------------------------------------------------
CREATE TABLE public.clients (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id            TEXT,
  demographics           JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_counselor_id  UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
  case_status            public.case_status NOT NULL DEFAULT 'intake',
  intake_completed_at    TIMESTAMPTZ,
  last_activity_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX ix_clients_org    ON public.clients(org_id);
CREATE INDEX ix_clients_user   ON public.clients(user_id);
CREATE INDEX ix_clients_couns  ON public.clients(assigned_counselor_id);
CREATE INDEX ix_clients_status ON public.clients(org_id, case_status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_upd BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Helpers used by clinical RLS (created AFTER clients/counselors exist).
CREATE OR REPLACE FUNCTION public.is_client_counselor(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.counselors co ON co.id = c.assigned_counselor_id
    WHERE c.id = _client_id AND co.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client_owner(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clients WHERE id = _client_id AND user_id = _user_id);
$$;

CREATE POLICY "clients_self_read"   ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "clients_self_update" ON public.clients FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "clients_assigned_counselor_read" ON public.clients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors co WHERE co.id = assigned_counselor_id AND co.user_id = auth.uid()));
CREATE POLICY "clients_org_admin_all" ON public.clients FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "clients_org_counselor_read" ON public.clients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'counselor', org_id));

-- ---------- client_emergency_contacts (FR-16) ----------------------------
CREATE TABLE public.client_emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  relationship TEXT,
  phone        TEXT,
  email        TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_cec_client ON public.client_emergency_contacts(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_emergency_contacts TO authenticated;
GRANT ALL ON public.client_emergency_contacts TO service_role;
ALTER TABLE public.client_emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_cec_upd BEFORE UPDATE ON public.client_emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "cec_client_self" ON public.client_emergency_contacts FOR ALL TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id)) WITH CHECK (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "cec_counselor_read" ON public.client_emergency_contacts FOR SELECT TO authenticated
  USING (public.is_client_counselor(auth.uid(), client_id));
CREATE POLICY "cec_admin_all" ON public.client_emergency_contacts FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- ---------- availability_slots -------------------------------------------
CREATE TABLE public.availability_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id  UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rrule         TEXT,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX ix_avail_counselor ON public.availability_slots(counselor_id, start_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;
GRANT ALL ON public.availability_slots TO service_role;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_org_read"  ON public.availability_slots FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "avail_self_mgmt" ON public.availability_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));
CREATE POLICY "avail_admin_mgmt" ON public.availability_slots FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- ---------- appointments -------------------------------------------------
CREATE TABLE public.appointments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  counselor_id   UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
  type           TEXT NOT NULL DEFAULT 'in_person',
  start_at       TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ NOT NULL,
  status         public.appointment_status NOT NULL DEFAULT 'scheduled',
  location       TEXT,
  modality       TEXT NOT NULL DEFAULT 'in_person',
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX ix_appt_org_start  ON public.appointments(org_id, start_at);
CREATE INDEX ix_appt_client     ON public.appointments(client_id, start_at);
CREATE INDEX ix_appt_counselor  ON public.appointments(counselor_id, start_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_appt_upd BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "appt_client_self" ON public.appointments FOR SELECT TO authenticated USING (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "appt_counselor"   ON public.appointments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));
CREATE POLICY "appt_admin"       ON public.appointments FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "appt_org_staff_read" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'org_staff', org_id));

-- ---------- sessions -----------------------------------------------------
CREATE TABLE public.sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  counselor_id    UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  outcome         public.session_outcome,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_sessions_client ON public.sessions(client_id);
CREATE INDEX ix_sessions_couns  ON public.sessions(counselor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_client_self" ON public.sessions FOR SELECT TO authenticated USING (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "sessions_counselor"   ON public.sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));
CREATE POLICY "sessions_admin_read"  ON public.sessions FOR SELECT TO authenticated USING (public.is_org_admin(auth.uid(), org_id));

-- ---------- session_notes_private (author-only) --------------------------
CREATE TABLE public.session_notes_private (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  counselor_id  UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
  body          TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notes_session ON public.session_notes_private(session_id);
GRANT SELECT, INSERT, UPDATE ON public.session_notes_private TO authenticated;
GRANT ALL ON public.session_notes_private TO service_role;
ALTER TABLE public.session_notes_private ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_notes_upd BEFORE UPDATE ON public.session_notes_private FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "notes_author_only" ON public.session_notes_private FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));

-- ---------- session_summaries_shared -------------------------------------
CREATE TABLE public.session_summaries_shared (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  counselor_id  UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
  body          TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_summ_session ON public.session_summaries_shared(session_id);
GRANT SELECT, INSERT, UPDATE ON public.session_summaries_shared TO authenticated;
GRANT ALL ON public.session_summaries_shared TO service_role;
ALTER TABLE public.session_summaries_shared ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_summ_upd BEFORE UPDATE ON public.session_summaries_shared FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "summ_client_read" ON public.session_summaries_shared FOR SELECT TO authenticated
  USING (published_at IS NOT NULL AND public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "summ_counselor"   ON public.session_summaries_shared FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));

-- ---------- assessments + responses --------------------------------------
CREATE TABLE public.assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  title       TEXT NOT NULL,
  definition  JSONB NOT NULL,
  scoring     JSONB NOT NULL DEFAULT '{}'::jsonb,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, key, version)
);
GRANT SELECT, INSERT, UPDATE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assess_read" ON public.assessments FOR SELECT TO authenticated
  USING (org_id IS NULL OR public.is_org_member(auth.uid(), org_id));
CREATE POLICY "assess_admin_write" ON public.assessments FOR ALL TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id));

CREATE TABLE public.assessment_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  answers        JSONB NOT NULL,
  score          NUMERIC,
  risk_level     public.risk_level,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ar_client ON public.assessment_responses(client_id, submitted_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.assessment_responses TO authenticated;
GRANT ALL ON public.assessment_responses TO service_role;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_client_self" ON public.assessment_responses FOR ALL TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id)) WITH CHECK (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "ar_counselor"   ON public.assessment_responses FOR SELECT TO authenticated
  USING (public.is_client_counselor(auth.uid(), client_id));
CREATE POLICY "ar_admin_read"  ON public.assessment_responses FOR SELECT TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id));

-- ---------- safety_plans + escalations -----------------------------------
CREATE TABLE public.safety_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content       JSONB NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  published_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.safety_plans TO authenticated;
GRANT ALL ON public.safety_plans TO service_role;
ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_client_read"   ON public.safety_plans FOR SELECT TO authenticated USING (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "sp_counselor_all" ON public.safety_plans FOR ALL TO authenticated
  USING (public.is_client_counselor(auth.uid(), client_id))
  WITH CHECK (public.is_client_counselor(auth.uid(), client_id));

CREATE TABLE public.escalations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  opened_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity       public.escalation_severity NOT NULL DEFAULT 'moderate',
  status         public.escalation_status   NOT NULL DEFAULT 'open',
  safety_plan_id UUID REFERENCES public.safety_plans(id) ON DELETE SET NULL,
  summary        TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_esc_org_status ON public.escalations(org_id, status);
GRANT SELECT, INSERT, UPDATE ON public.escalations TO authenticated;
GRANT ALL ON public.escalations TO service_role;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_esc_upd BEFORE UPDATE ON public.escalations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "esc_counselor_all"    ON public.escalations FOR ALL TO authenticated
  USING (public.is_client_counselor(auth.uid(), client_id))
  WITH CHECK (public.is_client_counselor(auth.uid(), client_id));
CREATE POLICY "esc_admin_all"        ON public.escalations FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "esc_client_self_read" ON public.escalations FOR SELECT TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id));

-- ---------- consents ------------------------------------------------------
CREATE TABLE public.consent_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, version)
);
GRANT SELECT, INSERT, UPDATE ON public.consent_documents TO authenticated;
GRANT ALL ON public.consent_documents TO service_role;
ALTER TABLE public.consent_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cd_org_read"   ON public.consent_documents FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "cd_admin_mgmt" ON public.consent_documents FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE TABLE public.consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES public.consent_documents(id) ON DELETE RESTRICT,
  accepted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consents_client_self"    ON public.consents FOR ALL TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id)) WITH CHECK (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "consents_admin_read"     ON public.consents FOR SELECT TO authenticated USING (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "consents_counselor_read" ON public.consents FOR SELECT TO authenticated USING (public.is_client_counselor(auth.uid(), client_id));

-- ---------- tasks (FR-18) ------------------------------------------------
CREATE TABLE public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assignee_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          public.task_status NOT NULL DEFAULT 'open',
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  reminder_policy JSONB NOT NULL DEFAULT '{"schedule":"default"}'::jsonb,
  overdue_streak  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_tasks_assignee_due ON public.tasks(assignee_id, due_at);
CREATE INDEX ix_tasks_org_status   ON public.tasks(org_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tasks_upd BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "tasks_assignee"      ON public.tasks FOR ALL    TO authenticated USING (assignee_id = auth.uid()) WITH CHECK (assignee_id = auth.uid());
CREATE POLICY "tasks_assigner_read" ON public.tasks FOR SELECT TO authenticated USING (assigned_by = auth.uid());
CREATE POLICY "tasks_admin_all"     ON public.tasks FOR ALL    TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));
