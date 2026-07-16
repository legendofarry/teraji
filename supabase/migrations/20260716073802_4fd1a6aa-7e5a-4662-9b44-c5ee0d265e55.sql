-- ==========================================================================
-- Teraji — P0.1 Foundations
-- ==========================================================================
CREATE TYPE public.app_role AS ENUM ('platform_admin','org_admin','counselor','client','org_staff');
CREATE TYPE public.org_status AS ENUM ('active','suspended','archived');
CREATE TYPE public.member_status AS ENUM ('pending','active','suspended','removed');
CREATE TYPE public.appointment_status AS ENUM ('scheduled','checked_in','in_progress','completed','no_show','cancelled');
CREATE TYPE public.session_outcome AS ENUM ('completed','no_show','cancelled','interrupted');
CREATE TYPE public.case_status AS ENUM ('intake','active','on_hold','closed','archived');
CREATE TYPE public.task_status AS ENUM ('open','in_progress','completed','cancelled');
CREATE TYPE public.escalation_severity AS ENUM ('low','moderate','high','critical');
CREATE TYPE public.escalation_status AS ENUM ('open','in_progress','resolved','reviewed');
CREATE TYPE public.notif_channel AS ENUM ('email','web_push','sms','whatsapp','in_app');
CREATE TYPE public.notif_status AS ENUM ('queued','sent','delivered','failed','suppressed');
CREATE TYPE public.media_provider AS ENUM ('none','daily','twilio','agora');
CREATE TYPE public.risk_level AS ENUM ('none','low','moderate','high','severe');
CREATE TYPE public.attachment_scan AS ENUM ('pending','clean','infected','skipped');

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT,
  locale TEXT NOT NULL DEFAULT 'en-KE',
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.tg_handle_new_user();

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  status public.org_status NOT NULL DEFAULT 'active',
  region TEXT NOT NULL DEFAULT 'default',
  retention_days INTEGER NOT NULL DEFAULT 2555,
  onboarding_config JSONB NOT NULL DEFAULT '{"methods":["invite"]}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  locale TEXT NOT NULL DEFAULT 'en-KE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.member_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ, joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX ix_org_members_user ON public.organization_members(user_id);
CREATE INDEX ix_org_members_org ON public.organization_members(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_om_updated BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id, role)
);
CREATE INDEX ix_user_roles_user ON public.user_roles(user_id);
CREATE INDEX ix_user_roles_org ON public.user_roles(org_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role, _org_id UUID DEFAULT NULL) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role AND (_org_id IS NULL OR org_id IS NOT DISTINCT FROM _org_id));
$$;
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='platform_admin');
$$;
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id=_user_id AND org_id=_org_id AND status='active');
$$;
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='org_admin' AND org_id=_org_id);
$$;

CREATE POLICY "orgs_member_read" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "orgs_platform_admin_all" ON public.organizations FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "orgs_org_admin_update" ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_admin(auth.uid(), id)) WITH CHECK (public.is_org_admin(auth.uid(), id));

CREATE POLICY "om_self_read" ON public.organization_members FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "om_self_accept" ON public.organization_members FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "om_admin_manage" ON public.organization_members FOR ALL TO authenticated USING (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid())) WITH CHECK (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT,
  diff JSONB, ip INET, user_agent TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_org_at ON public.audit_log(org_id, at DESC);
CREATE INDEX ix_audit_actor ON public.audit_log(actor_id, at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_any_authed" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (actor_id=auth.uid());
CREATE POLICY "audit_read_org_admin" ON public.audit_log FOR SELECT TO authenticated USING (
  org_id IS NULL AND public.is_platform_admin(auth.uid())
  OR (org_id IS NOT NULL AND (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid())))
);

-- Clinical + rest of P0.2/P0.3/P1.1 tables & RPCs
CREATE TABLE public.counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credentials TEXT, specialties TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT, active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX ix_counselors_org ON public.counselors(org_id);
CREATE INDEX ix_counselors_user ON public.counselors(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counselors TO authenticated;
GRANT ALL ON public.counselors TO service_role;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_counselors_upd BEFORE UPDATE ON public.counselors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "counselors_org_read" ON public.counselors FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "counselors_self_upd" ON public.counselors FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "counselors_admin_mgmt" ON public.counselors FOR ALL TO authenticated USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT, demographics JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_counselor_id UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
  case_status public.case_status NOT NULL DEFAULT 'intake',
  intake_completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX ix_clients_org ON public.clients(org_id);
CREATE INDEX ix_clients_user ON public.clients(user_id);
CREATE INDEX ix_clients_couns ON public.clients(assigned_counselor_id);
CREATE INDEX ix_clients_status ON public.clients(org_id, case_status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clients_upd BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.is_client_counselor(_user_id UUID, _client_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.clients c JOIN public.counselors co ON co.id=c.assigned_counselor_id WHERE c.id=_client_id AND co.user_id=_user_id);
$$;
CREATE OR REPLACE FUNCTION public.is_client_owner(_user_id UUID, _client_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.clients WHERE id=_client_id AND user_id=_user_id);
$$;

CREATE POLICY "clients_self_read" ON public.clients FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "clients_self_update" ON public.clients FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "clients_assigned_counselor_read" ON public.clients FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.counselors co WHERE co.id=assigned_counselor_id AND co.user_id=auth.uid()));
CREATE POLICY "clients_org_admin_all" ON public.clients FOR ALL TO authenticated USING (public.is_org_admin(auth.uid(), org_id)) WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "clients_org_counselor_read" ON public.clients FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'counselor', org_id));

-- Add clinical_supervisor role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinical_supervisor';

-- Organization invitations
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL, role public.app_role NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_invitations_org ON public.organization_invitations(org_id);
CREATE INDEX idx_org_invitations_email ON public.organization_invitations(lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_admin_manage ON public.organization_invitations FOR ALL TO authenticated USING (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid())) WITH CHECK (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));
CREATE TRIGGER trg_org_invitations_updated_at BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RPCs
CREATE OR REPLACE FUNCTION public.claim_platform_admin() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid(); v_email TEXT; v_target TEXT; v_existing INT; v_confirmed TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT email, email_confirmed_at INTO v_email, v_confirmed FROM auth.users WHERE id=v_uid;
  IF v_email IS NULL THEN RAISE EXCEPTION 'no_email'; END IF;
  IF v_confirmed IS NULL THEN RAISE EXCEPTION 'email_unverified'; END IF;
  BEGIN v_target := current_setting('app.platform_admin_email', true); EXCEPTION WHEN OTHERS THEN v_target := NULL; END;
  IF v_target IS NULL OR v_target='' THEN
    INSERT INTO public.audit_log(actor_id,action,entity_type,diff) VALUES (v_uid,'platform_admin_bootstrap.refused','user_roles',jsonb_build_object('reason','env_not_set'));
    RAISE EXCEPTION 'bootstrap_disabled';
  END IF;
  SELECT count(*) INTO v_existing FROM public.user_roles WHERE role='platform_admin';
  IF v_existing>0 THEN
    INSERT INTO public.audit_log(actor_id,action,entity_type,diff) VALUES (v_uid,'platform_admin_bootstrap.refused','user_roles',jsonb_build_object('reason','already_bootstrapped'));
    RAISE EXCEPTION 'already_bootstrapped';
  END IF;
  IF lower(v_email) <> lower(v_target) THEN
    INSERT INTO public.audit_log(actor_id,action,entity_type,diff) VALUES (v_uid,'platform_admin_bootstrap.refused','user_roles',jsonb_build_object('reason','email_mismatch','email',v_email));
    RAISE EXCEPTION 'email_mismatch';
  END IF;
  INSERT INTO public.user_roles(user_id,org_id,role,granted_by) VALUES (v_uid,NULL,'platform_admin',v_uid);
  INSERT INTO public.audit_log(actor_id,action,entity_type,entity_id,diff) VALUES (v_uid,'platform_admin_bootstrap.granted','user_roles',v_uid::text,jsonb_build_object('email',v_email));
  RETURN jsonb_build_object('ok',true,'user_id',v_uid);
END; $$;
REVOKE ALL ON FUNCTION public.claim_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_platform_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_organization(_name TEXT,_slug TEXT,_admin_user_id UUID DEFAULT NULL) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid(); v_org UUID; v_admin UUID;
BEGIN
  IF NOT public.is_platform_admin(v_uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.organizations(name,slug) VALUES (_name,_slug) RETURNING id INTO v_org;
  v_admin := COALESCE(_admin_user_id,v_uid);
  INSERT INTO public.organization_members(org_id,user_id,status,joined_at) VALUES (v_org,v_admin,'active',now()) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id,org_id,role,granted_by) VALUES (v_admin,v_org,'org_admin',v_uid);
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id) VALUES (v_org,v_uid,'organization.created','organizations',v_org::text);
  RETURN v_org;
END; $$;
REVOKE ALL ON FUNCTION public.create_organization(TEXT,TEXT,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT,TEXT,UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_org_invitation(_token TEXT) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid(); v_email TEXT; v_inv public.organization_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id=v_uid;
  SELECT * INTO v_inv FROM public.organization_invitations WHERE token=_token;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invitation_not_found'; END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_revoked'; END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_already_accepted'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'invitation_expired'; END IF;
  IF lower(v_email) <> lower(v_inv.email) THEN RAISE EXCEPTION 'email_mismatch'; END IF;
  INSERT INTO public.organization_members(org_id,user_id,status,joined_at,invited_by,invited_at)
    VALUES (v_inv.org_id,v_uid,'active',now(),v_inv.invited_by,v_inv.created_at)
    ON CONFLICT (org_id,user_id) DO UPDATE SET status='active', joined_at=COALESCE(public.organization_members.joined_at,now());
  INSERT INTO public.user_roles(user_id,org_id,role,granted_by) VALUES (v_uid,v_inv.org_id,v_inv.role,v_inv.invited_by) ON CONFLICT DO NOTHING;
  UPDATE public.organization_invitations SET accepted_at=now(), accepted_by=v_uid WHERE id=v_inv.id;
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id,diff) VALUES (v_inv.org_id,v_uid,'invitation.accepted','organization_invitations',v_inv.id::text,jsonb_build_object('role',v_inv.role,'email',v_email));
  RETURN jsonb_build_object('ok',true,'org_id',v_inv.org_id,'role',v_inv.role);
END; $$;
REVOKE ALL ON FUNCTION public.accept_org_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_org_invitation(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.peek_org_invitation(_token TEXT) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE v_inv public.organization_invitations%ROWTYPE; v_org public.organizations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM public.organization_invitations WHERE token=_token;
  IF v_inv.id IS NULL THEN RETURN jsonb_build_object('found',false); END IF;
  SELECT * INTO v_org FROM public.organizations WHERE id=v_inv.org_id;
  RETURN jsonb_build_object('found',true,'email',v_inv.email,'role',v_inv.role,'expires_at',v_inv.expires_at,'accepted',v_inv.accepted_at IS NOT NULL,'revoked',v_inv.revoked_at IS NOT NULL,'org',jsonb_build_object('id',v_org.id,'name',v_org.name,'slug',v_org.slug,'branding',v_org.branding));
END; $$;
REVOKE ALL ON FUNCTION public.peek_org_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peek_org_invitation(TEXT) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.assign_org_role(_user_id UUID,_org_id UUID,_role public.app_role) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid,_org_id) OR public.is_platform_admin(v_uid)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _role='platform_admin' THEN RAISE EXCEPTION 'cannot_assign_platform_admin'; END IF;
  IF NOT public.is_org_member(_user_id,_org_id) THEN RAISE EXCEPTION 'not_a_member'; END IF;
  INSERT INTO public.user_roles(user_id,org_id,role,granted_by) VALUES (_user_id,_org_id,_role,v_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id,diff) VALUES (_org_id,v_uid,'role.assigned','user_roles',_user_id::text,jsonb_build_object('role',_role));
  RETURN jsonb_build_object('ok',true);
END; $$;
REVOKE ALL ON FUNCTION public.assign_org_role(UUID,UUID,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_org_role(UUID,UUID,public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_org_role(_user_id UUID,_org_id UUID,_role public.app_role) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid,_org_id) OR public.is_platform_admin(v_uid)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id AND org_id=_org_id AND role=_role;
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id,diff) VALUES (_org_id,v_uid,'role.revoked','user_roles',_user_id::text,jsonb_build_object('role',_role));
  RETURN jsonb_build_object('ok',true);
END; $$;
REVOKE ALL ON FUNCTION public.revoke_org_role(UUID,UUID,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_org_role(UUID,UUID,public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_member_status(_user_id UUID,_org_id UUID,_status public.member_status) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid,_org_id) OR public.is_platform_admin(v_uid)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.organization_members SET status=_status WHERE user_id=_user_id AND org_id=_org_id;
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id,diff) VALUES (_org_id,v_uid,'member.status_changed','organization_members',_user_id::text,jsonb_build_object('status',_status));
  RETURN jsonb_build_object('ok',true);
END; $$;
REVOKE ALL ON FUNCTION public.set_member_status(UUID,UUID,public.member_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_status(UUID,UUID,public.member_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_organization_settings(_org_id UUID,_name TEXT DEFAULT NULL,_branding JSONB DEFAULT NULL,_onboarding_config JSONB DEFAULT NULL,_timezone TEXT DEFAULT NULL,_locale TEXT DEFAULT NULL,_retention_days INTEGER DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID:=auth.uid(); v_before JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid,_org_id) OR public.is_platform_admin(v_uid)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT to_jsonb(o) INTO v_before FROM public.organizations o WHERE id=_org_id;
  UPDATE public.organizations SET name=COALESCE(_name,name), branding=COALESCE(_branding,branding), onboarding_config=COALESCE(_onboarding_config,onboarding_config), timezone=COALESCE(_timezone,timezone), locale=COALESCE(_locale,locale), retention_days=COALESCE(_retention_days,retention_days) WHERE id=_org_id;
  INSERT INTO public.audit_log(org_id,actor_id,action,entity_type,entity_id,diff) VALUES (_org_id,v_uid,'organization.updated','organizations',_org_id::text,jsonb_build_object('before',v_before));
  RETURN jsonb_build_object('ok',true);
END; $$;
REVOKE ALL ON FUNCTION public.update_organization_settings(UUID,TEXT,JSONB,JSONB,TEXT,TEXT,INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_organization_settings(UUID,TEXT,JSONB,JSONB,TEXT,TEXT,INTEGER) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID,public.app_role,UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID,UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID,UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_client_counselor(UUID,UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_client_owner(UUID,UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID,public.app_role,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_counselor(UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_owner(UUID,UUID) TO authenticated;