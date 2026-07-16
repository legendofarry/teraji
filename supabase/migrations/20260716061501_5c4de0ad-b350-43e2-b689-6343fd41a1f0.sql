
-- Add clinical_supervisor role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinical_supervisor';

-- Organization invitations (token-based, works before user has an account)
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
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

-- Admins can see & manage invites for their orgs
CREATE POLICY inv_admin_manage ON public.organization_invitations
  FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_org_invitations_updated_at
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RPC: accept an invitation by token (SECURITY DEFINER so caller can atomically
-- add themselves to org + get role even before admin RLS lets them see the invite)
CREATE OR REPLACE FUNCTION public.accept_org_invitation(_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_email TEXT;
  v_inv   public.organization_invitations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT * INTO v_inv FROM public.organization_invitations WHERE token = _token;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invitation_not_found'; END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_revoked'; END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation_already_accepted'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'invitation_expired'; END IF;
  IF lower(v_email) <> lower(v_inv.email) THEN RAISE EXCEPTION 'email_mismatch'; END IF;

  INSERT INTO public.organization_members(org_id, user_id, status, joined_at, invited_by, invited_at)
    VALUES (v_inv.org_id, v_uid, 'active', now(), v_inv.invited_by, v_inv.created_at)
    ON CONFLICT (org_id, user_id) DO UPDATE
      SET status='active', joined_at=COALESCE(public.organization_members.joined_at, now());

  INSERT INTO public.user_roles(user_id, org_id, role, granted_by)
    VALUES (v_uid, v_inv.org_id, v_inv.role, v_inv.invited_by)
    ON CONFLICT DO NOTHING;

  UPDATE public.organization_invitations
    SET accepted_at = now(), accepted_by = v_uid
    WHERE id = v_inv.id;

  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (v_inv.org_id, v_uid, 'invitation.accepted', 'organization_invitations', v_inv.id::text,
            jsonb_build_object('role', v_inv.role, 'email', v_email));

  RETURN jsonb_build_object('ok', true, 'org_id', v_inv.org_id, 'role', v_inv.role);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_org_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_org_invitation(TEXT) TO authenticated;

-- RPC: peek at an invitation by token (for the accept UI, before the user commits)
CREATE OR REPLACE FUNCTION public.peek_org_invitation(_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_inv public.organization_invitations%ROWTYPE;
  v_org public.organizations%ROWTYPE;
BEGIN
  SELECT * INTO v_inv FROM public.organization_invitations WHERE token = _token;
  IF v_inv.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT * INTO v_org FROM public.organizations WHERE id = v_inv.org_id;
  RETURN jsonb_build_object(
    'found', true,
    'email', v_inv.email,
    'role', v_inv.role,
    'expires_at', v_inv.expires_at,
    'accepted', v_inv.accepted_at IS NOT NULL,
    'revoked', v_inv.revoked_at IS NOT NULL,
    'org', jsonb_build_object('id', v_org.id, 'name', v_org.name, 'slug', v_org.slug, 'branding', v_org.branding)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.peek_org_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peek_org_invitation(TEXT) TO authenticated, anon;

-- RPC: assign a role within an org (org admins only, and platform_admin can't be assigned this way)
CREATE OR REPLACE FUNCTION public.assign_org_role(_user_id UUID, _org_id UUID, _role public.app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid, _org_id) OR public.is_platform_admin(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _role = 'platform_admin' THEN RAISE EXCEPTION 'cannot_assign_platform_admin'; END IF;
  IF NOT public.is_org_member(_user_id, _org_id) THEN RAISE EXCEPTION 'not_a_member'; END IF;

  INSERT INTO public.user_roles(user_id, org_id, role, granted_by)
    VALUES (_user_id, _org_id, _role, v_uid)
    ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (_org_id, v_uid, 'role.assigned', 'user_roles', _user_id::text,
            jsonb_build_object('role', _role));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_org_role(UUID, UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_org_role(UUID, UUID, public.app_role) TO authenticated;

-- RPC: revoke a role within an org
CREATE OR REPLACE FUNCTION public.revoke_org_role(_user_id UUID, _org_id UUID, _role public.app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid, _org_id) OR public.is_platform_admin(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.user_roles WHERE user_id=_user_id AND org_id=_org_id AND role=_role;

  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (_org_id, v_uid, 'role.revoked', 'user_roles', _user_id::text,
            jsonb_build_object('role', _role));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_org_role(UUID, UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_org_role(UUID, UUID, public.app_role) TO authenticated;

-- RPC: update org member status (suspend/remove/reactivate)
CREATE OR REPLACE FUNCTION public.set_member_status(_user_id UUID, _org_id UUID, _status public.member_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid, _org_id) OR public.is_platform_admin(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.organization_members SET status = _status WHERE user_id=_user_id AND org_id=_org_id;
  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (_org_id, v_uid, 'member.status_changed', 'organization_members', _user_id::text,
            jsonb_build_object('status', _status));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_member_status(UUID, UUID, public.member_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_member_status(UUID, UUID, public.member_status) TO authenticated;

-- RPC: update organization settings (branding, terminology, timezone, locale, name)
CREATE OR REPLACE FUNCTION public.update_organization_settings(
  _org_id UUID,
  _name TEXT DEFAULT NULL,
  _branding JSONB DEFAULT NULL,
  _onboarding_config JSONB DEFAULT NULL,
  _timezone TEXT DEFAULT NULL,
  _locale TEXT DEFAULT NULL,
  _retention_days INTEGER DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid(); v_before JSONB;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_org_admin(v_uid, _org_id) OR public.is_platform_admin(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT to_jsonb(o) INTO v_before FROM public.organizations o WHERE id = _org_id;

  UPDATE public.organizations SET
    name = COALESCE(_name, name),
    branding = COALESCE(_branding, branding),
    onboarding_config = COALESCE(_onboarding_config, onboarding_config),
    timezone = COALESCE(_timezone, timezone),
    locale = COALESCE(_locale, locale),
    retention_days = COALESCE(_retention_days, retention_days)
  WHERE id = _org_id;

  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id, diff)
    VALUES (_org_id, v_uid, 'organization.updated', 'organizations', _org_id::text,
            jsonb_build_object('before', v_before));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_organization_settings(UUID,TEXT,JSONB,JSONB,TEXT,TEXT,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_organization_settings(UUID,TEXT,JSONB,JSONB,TEXT,TEXT,INTEGER) TO authenticated;
