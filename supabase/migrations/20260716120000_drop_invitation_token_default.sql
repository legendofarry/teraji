-- Remove pgcrypto-backed token generation from invitations.
-- Tokens are now generated in application code and stored explicitly.

ALTER TABLE public.organization_invitations
  ALTER COLUMN token DROP DEFAULT;

ALTER TABLE public.organization_invitations
  ALTER COLUMN token SET NOT NULL;
