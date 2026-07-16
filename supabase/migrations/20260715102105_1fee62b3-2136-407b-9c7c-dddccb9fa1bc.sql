
-- ==========================================================================
-- Teraji — P0.1 Foundations: enums, tenancy, roles, audit, utilities
-- ==========================================================================

-- ---------- Enums --------------------------------------------------------
CREATE TYPE public.app_role AS ENUM (
  'platform_admin', 'org_admin', 'counselor', 'client', 'org_staff'
);

CREATE TYPE public.org_status         AS ENUM ('active', 'suspended', 'archived');
CREATE TYPE public.member_status      AS ENUM ('pending', 'active', 'suspended', 'removed');
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'
);
CREATE TYPE public.session_outcome    AS ENUM ('completed', 'no_show', 'cancelled', 'interrupted');
CREATE TYPE public.case_status        AS ENUM ('intake', 'active', 'on_hold', 'closed', 'archived');
CREATE TYPE public.task_status        AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.escalation_severity AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE public.escalation_status  AS ENUM ('open', 'in_progress', 'resolved', 'reviewed');
CREATE TYPE public.notif_channel      AS ENUM ('email', 'web_push', 'sms', 'whatsapp', 'in_app');
CREATE TYPE public.notif_status       AS ENUM ('queued', 'sent', 'delivered', 'failed', 'suppressed');
CREATE TYPE public.media_provider     AS ENUM ('none', 'daily', 'twilio', 'agora');
CREATE TYPE public.risk_level         AS ENUM ('none', 'low', 'moderate', 'high', 'severe');
CREATE TYPE public.attachment_scan    AS ENUM ('pending', 'clean', 'infected', 'skipped');

-- ---------- Utility: updated_at trigger ----------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------- profiles (must exist before member/role trigger) -------------
CREATE TABLE public.profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  locale      TEXT NOT NULL DEFAULT 'en-KE',
  timezone    TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read"   ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.tg_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.tg_handle_new_user();

-- ---------- organizations ------------------------------------------------
CREATE TABLE public.organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  status            public.org_status NOT NULL DEFAULT 'active',
  region            TEXT NOT NULL DEFAULT 'default',
  retention_days    INTEGER NOT NULL DEFAULT 2555, -- 7 years
  onboarding_config JSONB NOT NULL DEFAULT '{"methods":["invite"]}'::jsonb,
  branding          JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone          TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  locale            TEXT NOT NULL DEFAULT 'en-KE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- organization_members ----------------------------------------
CREATE TABLE public.organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      public.member_status NOT NULL DEFAULT 'pending',
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at  TIMESTAMPTZ,
  joined_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE INDEX ix_org_members_user ON public.organization_members(user_id);
CREATE INDEX ix_org_members_org  ON public.organization_members(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_om_updated BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------- user_roles ---------------------------------------------------
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL for platform_admin
  role       public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);
CREATE INDEX ix_user_roles_user ON public.user_roles(user_id);
CREATE INDEX ix_user_roles_org  ON public.user_roles(org_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------- has_role / has_permission ------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role, _org_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_org_id IS NULL OR org_id IS NOT DISTINCT FROM _org_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'org_admin' AND org_id = _org_id
  );
$$;

-- ---------- organizations policies (now that helpers exist) --------------
CREATE POLICY "orgs_member_read"     ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "orgs_platform_admin_all" ON public.organizations FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "orgs_org_admin_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), id)) WITH CHECK (public.is_org_admin(auth.uid(), id));

-- ---------- organization_members policies --------------------------------
CREATE POLICY "om_self_read"        ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "om_self_accept"      ON public.organization_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "om_admin_manage"     ON public.organization_members FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

-- ---------- user_roles policies (READ-ONLY to authenticated) -------------
-- Writes go through server functions (service_role); prevents privilege escalation.
CREATE POLICY "roles_self_read"     ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

-- ---------- audit_log (append-only) --------------------------------------
CREATE TABLE public.audit_log (
  id           BIGSERIAL PRIMARY KEY,
  org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  diff         JSONB,
  ip           INET,
  user_agent   TEXT,
  at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_org_at ON public.audit_log(org_id, at DESC);
CREATE INDEX ix_audit_actor  ON public.audit_log(actor_id, at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_any_authed" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
CREATE POLICY "audit_read_org_admin"    ON public.audit_log FOR SELECT TO authenticated
  USING (
    org_id IS NULL AND public.is_platform_admin(auth.uid())
    OR (org_id IS NOT NULL AND (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid())))
  );
-- No UPDATE/DELETE policies -> append-only.
