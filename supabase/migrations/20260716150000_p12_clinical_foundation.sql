-- ==========================================================================
-- Teraji P1.2: Clinical foundation
-- ==========================================================================

-- ---------- counselor profile support -------------------------------------
CREATE TYPE public.counselor_availability_status AS ENUM ('available', 'limited', 'unavailable');

ALTER TABLE public.counselors
  ADD COLUMN IF NOT EXISTS professional_title TEXT,
  ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS availability_status public.counselor_availability_status NOT NULL DEFAULT 'available';

ALTER TABLE public.counselors
  ADD CONSTRAINT counselors_years_experience_nonnegative
  CHECK (years_experience IS NULL OR years_experience >= 0);

CREATE INDEX IF NOT EXISTS ix_counselors_org_availability
  ON public.counselors(org_id, availability_status, active);

-- ---------- consent documents --------------------------------------------
ALTER TABLE public.consent_documents
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_consent_documents_org_active
  ON public.consent_documents(org_id, is_active, version DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_consent_documents_one_active_per_org
  ON public.consent_documents(org_id)
  WHERE is_active;

-- ---------- client administrative profile --------------------------------
CREATE TABLE IF NOT EXISTS public.client_administrative_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  registration_number    TEXT,
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  gender                TEXT,
  date_of_birth         DATE,
  department            TEXT,
  year_of_study         TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  active_status         BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_client_admin_profiles_org ON public.client_administrative_profiles(org_id);
CREATE INDEX IF NOT EXISTS ix_client_admin_profiles_client ON public.client_administrative_profiles(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_administrative_profiles TO authenticated;
GRANT ALL ON public.client_administrative_profiles TO service_role;
ALTER TABLE public.client_administrative_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_client_admin_profiles_upd
  BEFORE UPDATE ON public.client_administrative_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "client_admin_profiles_read" ON public.client_administrative_profiles
  FOR SELECT TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id) OR public.has_role(auth.uid(), 'org_staff', org_id));
CREATE POLICY "client_admin_profiles_insert" ON public.client_administrative_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "client_admin_profiles_update" ON public.client_administrative_profiles
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- ---------- client clinical profile --------------------------------------
CREATE TABLE IF NOT EXISTS public.client_clinical_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id            UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  presenting_issue     TEXT,
  background           TEXT,
  mental_health_history TEXT,
  medical_history      TEXT,
  medication           TEXT,
  risk_level           public.risk_level NOT NULL DEFAULT 'none',
  primary_counselor_id  UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
  case_status          public.case_status NOT NULL DEFAULT 'intake',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_client_clinical_profiles_org ON public.client_clinical_profiles(org_id);
CREATE INDEX IF NOT EXISTS ix_client_clinical_profiles_client ON public.client_clinical_profiles(client_id);
CREATE INDEX IF NOT EXISTS ix_client_clinical_profiles_counselor ON public.client_clinical_profiles(primary_counselor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_clinical_profiles TO authenticated;
GRANT ALL ON public.client_clinical_profiles TO service_role;
ALTER TABLE public.client_clinical_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_client_clinical_profiles_upd
  BEFORE UPDATE ON public.client_clinical_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "client_clinical_profiles_read" ON public.client_clinical_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_client_counselor(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'clinical_supervisor', org_id)
  );
CREATE POLICY "client_clinical_profiles_insert" ON public.client_clinical_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_client_counselor(auth.uid(), client_id));
CREATE POLICY "client_clinical_profiles_update" ON public.client_clinical_profiles
  FOR UPDATE TO authenticated
  USING (public.is_client_counselor(auth.uid(), client_id))
  WITH CHECK (public.is_client_counselor(auth.uid(), client_id));

-- ---------- client onboarding progress -----------------------------------
CREATE TABLE IF NOT EXISTS public.client_onboarding_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  invited_at            TIMESTAMPTZ,
  registered_at         TIMESTAMPTZ,
  email_verified_at     TIMESTAMPTZ,
  consent_completed_at  TIMESTAMPTZ,
  intake_completed_at   TIMESTAMPTZ,
  ready_for_assignment_at TIMESTAMPTZ,
  assigned_at           TIMESTAMPTZ,
  active_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_client_onboarding_org ON public.client_onboarding_progress(org_id);
CREATE INDEX IF NOT EXISTS ix_client_onboarding_client ON public.client_onboarding_progress(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_onboarding_progress TO authenticated;
GRANT ALL ON public.client_onboarding_progress TO service_role;
ALTER TABLE public.client_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_client_onboarding_progress_upd
  BEFORE UPDATE ON public.client_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "client_onboarding_progress_read" ON public.client_onboarding_progress
  FOR SELECT TO authenticated
  USING (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_org_admin(auth.uid(), org_id)
    OR public.has_role(auth.uid(), 'org_staff', org_id)
    OR public.is_client_counselor(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'clinical_supervisor', org_id)
  );
CREATE POLICY "client_onboarding_progress_insert" ON public.client_onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_org_admin(auth.uid(), org_id)
    OR public.has_role(auth.uid(), 'org_staff', org_id)
  );
CREATE POLICY "client_onboarding_progress_update" ON public.client_onboarding_progress
  FOR UPDATE TO authenticated
  USING (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_org_admin(auth.uid(), org_id)
  )
  WITH CHECK (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_org_admin(auth.uid(), org_id)
  );

-- ---------- immutable consent history ------------------------------------
CREATE TABLE IF NOT EXISTS public.client_consent_history (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id          UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  consent_document_id UUID NOT NULL REFERENCES public.consent_documents(id) ON DELETE RESTRICT,
  consent_version    INTEGER NOT NULL,
  consent_text       TEXT NOT NULL,
  accepted_ip        INET,
  accepted_user_agent TEXT,
  accepted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, consent_version)
);
CREATE INDEX IF NOT EXISTS ix_client_consent_history_org ON public.client_consent_history(org_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS ix_client_consent_history_client ON public.client_consent_history(client_id, consent_version DESC);
GRANT SELECT, INSERT ON public.client_consent_history TO authenticated;
GRANT ALL ON public.client_consent_history TO service_role;
ALTER TABLE public.client_consent_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_consent_history_read" ON public.client_consent_history
  FOR SELECT TO authenticated
  USING (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_client_counselor(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'clinical_supervisor', org_id)
  );
CREATE POLICY "client_consent_history_insert" ON public.client_consent_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_client_owner(auth.uid(), client_id));

-- ---------- intake submissions -------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_intake_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id          UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  version            INTEGER NOT NULL DEFAULT 1,
  responses          JSONB NOT NULL DEFAULT '{}'::jsonb,
  phq9_score         INTEGER NOT NULL DEFAULT 0,
  gad7_score         INTEGER NOT NULL DEFAULT 0,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (phq9_score >= 0),
  CHECK (gad7_score >= 0)
);
CREATE INDEX IF NOT EXISTS ix_client_intake_submissions_org ON public.client_intake_submissions(org_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS ix_client_intake_submissions_client ON public.client_intake_submissions(client_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_intake_submissions TO authenticated;
GRANT ALL ON public.client_intake_submissions TO service_role;
ALTER TABLE public.client_intake_submissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_client_intake_submissions_upd
  BEFORE UPDATE ON public.client_intake_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "client_intake_submissions_read" ON public.client_intake_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_client_owner(auth.uid(), client_id)
    OR public.is_client_counselor(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'clinical_supervisor', org_id)
  );
CREATE POLICY "client_intake_submissions_insert" ON public.client_intake_submissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "client_intake_submissions_update" ON public.client_intake_submissions
  FOR UPDATE TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id))
  WITH CHECK (public.is_client_owner(auth.uid(), client_id));

-- ---------- seed invite acceptance with clinical rows --------------------
CREATE OR REPLACE FUNCTION public.accept_org_invitation(_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_inv public.organization_invitations%ROWTYPE;
  v_client_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT full_name, phone INTO v_full_name, v_phone FROM public.profiles WHERE user_id = v_uid;

  SELECT * INTO v_inv FROM public.organization_invitations WHERE token = _token;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invitation_not_found'; END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_revoked'; END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_already_accepted'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'invitation_expired'; END IF;
  IF lower(v_email) <> lower(v_inv.email) THEN RAISE EXCEPTION 'email_mismatch'; END IF;

  INSERT INTO public.organization_members(org_id, user_id, status, joined_at, invited_by, invited_at)
    VALUES (v_inv.org_id, v_uid, 'active', now(), v_inv.invited_by, v_inv.created_at)
    ON CONFLICT (org_id, user_id) DO UPDATE
      SET status = 'active',
          joined_at = COALESCE(public.organization_members.joined_at, now());

  INSERT INTO public.user_roles(user_id, org_id, role, granted_by)
    VALUES (v_uid, v_inv.org_id, v_inv.role, v_inv.invited_by)
    ON CONFLICT DO NOTHING;

  IF v_inv.role = 'counselor' THEN
    INSERT INTO public.counselors(org_id, user_id)
      VALUES (v_inv.org_id, v_uid)
      ON CONFLICT (org_id, user_id) DO NOTHING;
  ELSIF v_inv.role = 'client' THEN
    INSERT INTO public.clients(org_id, user_id)
      VALUES (v_inv.org_id, v_uid)
      ON CONFLICT (org_id, user_id) DO NOTHING;

    SELECT id INTO v_client_id
    FROM public.clients
    WHERE org_id = v_inv.org_id AND user_id = v_uid
    LIMIT 1;

    INSERT INTO public.client_onboarding_progress(
      org_id,
      client_id,
      invited_at,
      registered_at,
      email_verified_at
    )
    VALUES (
      v_inv.org_id,
      v_client_id,
      v_inv.created_at,
      now(),
      CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid AND email_confirmed_at IS NOT NULL) THEN now() ELSE NULL END
    )
    ON CONFLICT (client_id) DO UPDATE
      SET invited_at = COALESCE(public.client_onboarding_progress.invited_at, EXCLUDED.invited_at),
          registered_at = COALESCE(public.client_onboarding_progress.registered_at, EXCLUDED.registered_at),
          email_verified_at = COALESCE(public.client_onboarding_progress.email_verified_at, EXCLUDED.email_verified_at);

    INSERT INTO public.client_administrative_profiles(
      org_id,
      client_id,
      registration_number,
      full_name,
      email,
      phone,
      active_status
    )
    VALUES (
      v_inv.org_id,
      v_client_id,
      NULL,
      COALESCE(v_full_name, v_email),
      v_email,
      v_phone,
      true
    )
    ON CONFLICT (client_id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone;

    INSERT INTO public.client_clinical_profiles(org_id, client_id)
      VALUES (v_inv.org_id, v_client_id)
      ON CONFLICT (client_id) DO NOTHING;
  END IF;

  UPDATE public.organization_invitations
    SET accepted_at = now(), accepted_by = v_uid
    WHERE id = v_inv.id;

  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (
      v_inv.org_id,
      v_uid,
      'invitation.accepted',
      'organization_invitations',
      v_inv.id::text,
      jsonb_build_object('role', v_inv.role, 'email', v_email)
    );

  RETURN jsonb_build_object('ok', true, 'org_id', v_inv.org_id, 'role', v_inv.role);
END;
$$;
