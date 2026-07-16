
-- ==========================================================================
-- Teraji — P0.3 Messaging, notifications, media, billing, feature flags, bootstrap
-- ==========================================================================

-- ---------- conversations + messages -------------------------------------
CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  counselor_id    UUID NOT NULL REFERENCES public.counselors(id) ON DELETE RESTRICT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, client_id, counselor_id)
);
CREATE INDEX ix_conv_client ON public.conversations(client_id);
CREATE INDEX ix_conv_couns  ON public.conversations(counselor_id);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_client"    ON public.conversations FOR ALL TO authenticated
  USING (public.is_client_owner(auth.uid(), client_id)) WITH CHECK (public.is_client_owner(auth.uid(), client_id));
CREATE POLICY "conv_counselor" ON public.conversations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = counselor_id AND c.user_id = auth.uid()));

CREATE TABLE public.attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_bucket    TEXT NOT NULL DEFAULT 'attachments',
  storage_path      TEXT NOT NULL,
  mime              TEXT NOT NULL,
  size_bytes        BIGINT NOT NULL,
  virus_scan_status public.attachment_scan NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_uploader" ON public.attachments FOR ALL TO authenticated
  USING (uploaded_by = auth.uid()) WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "att_admin_read" ON public.attachments FOR SELECT TO authenticated USING (public.is_org_admin(auth.uid(), org_id));

CREATE TABLE public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body             TEXT NOT NULL,
  attachment_id    UUID REFERENCES public.attachments(id) ON DELETE SET NULL,
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_msg_conv ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_participants" ON public.messages FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations conv
    WHERE conv.id = conversation_id
      AND (public.is_client_owner(auth.uid(), conv.client_id)
           OR EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = conv.counselor_id AND c.user_id = auth.uid()))
  ))
  WITH CHECK (sender_id = auth.uid());

-- ---------- notifications & preferences ----------------------------------
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel      public.notif_channel NOT NULL,
  template_key TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  status       public.notif_status NOT NULL DEFAULT 'queued',
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notif_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_self" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_self_mark_read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notification_preferences (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel      public.notif_channel NOT NULL,
  template_key TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel, template_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_self" ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- session_media (v1 architected, not implemented) --------------
CREATE TABLE public.session_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider      public.media_provider NOT NULL DEFAULT 'none',
  room_id       TEXT,
  recording_uri TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.session_media TO authenticated;
GRANT ALL ON public.session_media TO service_role;
ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_session_party" ON public.session_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
      AND (public.is_client_owner(auth.uid(), s.client_id)
           OR EXISTS (SELECT 1 FROM public.counselors c WHERE c.id = s.counselor_id AND c.user_id = auth.uid()))
  ));

-- ---------- feature_flags -------------------------------------------------
CREATE TABLE public.feature_flags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL = platform-wide
  key        TEXT NOT NULL,
  value      JSONB NOT NULL DEFAULT 'true'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, key)
);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ff_read" ON public.feature_flags FOR SELECT TO authenticated
  USING (org_id IS NULL OR public.is_org_member(auth.uid(), org_id));
CREATE POLICY "ff_admin_write" ON public.feature_flags FOR ALL TO authenticated
  USING (
    (org_id IS NULL AND public.is_platform_admin(auth.uid()))
    OR (org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id))
  )
  WITH CHECK (
    (org_id IS NULL AND public.is_platform_admin(auth.uid()))
    OR (org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id))
  );

-- ---------- billing_accounts (shell only) --------------------------------
CREATE TABLE public.billing_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider     TEXT,          -- 'airtel', 'mpesa', 'stripe', ...
  external_id  TEXT,
  status       TEXT NOT NULL DEFAULT 'inactive',
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_accounts TO authenticated;
GRANT ALL ON public.billing_accounts TO service_role;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_billing_upd BEFORE UPDATE ON public.billing_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "billing_admin_read" ON public.billing_accounts FOR SELECT TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));

-- ---------- Platform Admin bootstrap RPC ---------------------------------
-- Reads the target email from Postgres app setting `app.platform_admin_email`
-- (set by the edge/server side, kept out of migrations & source code).
CREATE OR REPLACE FUNCTION public.claim_platform_admin()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid           UUID := auth.uid();
  v_email         TEXT;
  v_target_email  TEXT;
  v_existing      INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN RAISE EXCEPTION 'no_email'; END IF;

  BEGIN
    v_target_email := current_setting('app.platform_admin_email', true);
  EXCEPTION WHEN OTHERS THEN v_target_email := NULL; END;

  IF v_target_email IS NULL OR v_target_email = '' THEN
    INSERT INTO public.audit_log(actor_id, action, entity_type, diff)
    VALUES (v_uid, 'platform_admin_bootstrap.refused', 'user_roles',
            jsonb_build_object('reason','app.platform_admin_email_not_set'));
    RAISE EXCEPTION 'bootstrap_disabled';
  END IF;

  -- Auto-disable once ANY platform_admin exists.
  SELECT count(*) INTO v_existing FROM public.user_roles WHERE role = 'platform_admin';
  IF v_existing > 0 THEN
    INSERT INTO public.audit_log(actor_id, action, entity_type, diff)
    VALUES (v_uid, 'platform_admin_bootstrap.refused', 'user_roles',
            jsonb_build_object('reason','already_bootstrapped'));
    RAISE EXCEPTION 'already_bootstrapped';
  END IF;

  IF lower(v_email) <> lower(v_target_email) THEN
    INSERT INTO public.audit_log(actor_id, action, entity_type, diff)
    VALUES (v_uid, 'platform_admin_bootstrap.refused', 'user_roles',
            jsonb_build_object('reason','email_mismatch','email',v_email));
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  INSERT INTO public.user_roles(user_id, org_id, role, granted_by)
  VALUES (v_uid, NULL, 'platform_admin', v_uid);

  INSERT INTO public.audit_log(actor_id, action, entity_type, entity_id, diff)
  VALUES (v_uid, 'platform_admin_bootstrap.granted', 'user_roles', v_uid::text,
          jsonb_build_object('email', v_email));

  RETURN jsonb_build_object('ok', true, 'user_id', v_uid);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_platform_admin() TO authenticated;

-- ---------- Create-organization RPC (Platform Admin only) ----------------
CREATE OR REPLACE FUNCTION public.create_organization(_name TEXT, _slug TEXT, _admin_user_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_org UUID; v_admin UUID;
BEGIN
  IF NOT public.is_platform_admin(v_uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.organizations(name, slug) VALUES (_name, _slug) RETURNING id INTO v_org;
  v_admin := COALESCE(_admin_user_id, v_uid);
  INSERT INTO public.organization_members(org_id, user_id, status, joined_at)
    VALUES (v_org, v_admin, 'active', now())
    ON CONFLICT (org_id, user_id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, org_id, role, granted_by)
    VALUES (v_admin, v_org, 'org_admin', v_uid);
  INSERT INTO public.audit_log(org_id, actor_id, action, entity_type, entity_id)
    VALUES (v_org, v_uid, 'organization.created', 'organizations', v_org::text);
  RETURN v_org;
END;
$$;
REVOKE ALL ON FUNCTION public.create_organization(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, UUID) TO authenticated;
