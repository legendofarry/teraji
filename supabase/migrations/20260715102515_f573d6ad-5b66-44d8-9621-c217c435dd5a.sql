
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role, UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(UUID)               FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID, UUID)             FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID)              FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_client_counselor(UUID, UUID)       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_client_owner(UUID, UUID)           FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_platform_admin()                FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at()                   FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID, UUID)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_counselor(UUID, UUID)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client_owner(UUID, UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_platform_admin()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, UUID) TO authenticated;
