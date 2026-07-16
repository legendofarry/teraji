import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Platform Admin bootstrap.
 *
 * Rules (per SRPS + user directive):
 *  - The first authenticated user whose verified email matches
 *    process.env.PLATFORM_ADMIN_EMAIL is granted the platform_admin role.
 *  - Auto-disables once ANY platform_admin exists.
 *  - Every attempt (granted OR refused) is written to public.audit_log.
 *  - No email is hardcoded in code or migrations; the target is env-only.
 */
export const claimPlatformAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const target = process.env.PLATFORM_ADMIN_EMAIL;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorId = context.userId;

    const audit = async (action: string, diff: Record<string, unknown>) => {
      await supabaseAdmin.from("audit_log").insert({
        actor_id: actorId,
        action,
        entity_type: "user_roles",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diff: diff as any,
      });
    };

    if (!target) {
      await audit("platform_admin_bootstrap.refused", { reason: "env_not_set" });
      throw new Error("bootstrap_disabled");
    }

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "platform_admin")
      .limit(1);
    if (existingErr) throw existingErr;
    if (existing && existing.length > 0) {
      await audit("platform_admin_bootstrap.refused", { reason: "already_bootstrapped" });
      throw new Error("already_bootstrapped");
    }

    // Fetch the LIVE user record from Supabase Auth so we see the current
    // email_confirmed_at rather than a stale JWT claim from before the user
    // clicked the verification link.
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(actorId);
    if (userErr || !userRes?.user) throw new Error("user_lookup_failed");
    const email = userRes.user.email ?? null;
    const emailVerified = !!userRes.user.email_confirmed_at;

    if (!email || email.toLowerCase() !== target.toLowerCase()) {
      await audit("platform_admin_bootstrap.refused", { reason: "email_mismatch", email });
      throw new Error("email_mismatch");
    }
    if (!emailVerified) {
      await audit("platform_admin_bootstrap.refused", { reason: "email_unverified", email });
      throw new Error("email_unverified");
    }

    const { error: insErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: actorId,
      org_id: null,
      role: "platform_admin",
      granted_by: actorId,
    });
    if (insErr) throw insErr;

    await audit("platform_admin_bootstrap.granted", { email });

    return { ok: true, role: "platform_admin" as const };
  });

/**
 * Returns the current signed-in user's profile, roles, and org memberships.
 * Used by the app shell to render role-aware navigation.
 */
export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, rolesRes, membersRes] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role, org_id").eq("user_id", context.userId),
      context.supabase
        .from("organization_members")
        .select("org_id, status, organizations(id,name,slug,status)")
        .eq("user_id", context.userId),
    ]);

    return {
      userId: context.userId,
      email: (context.claims.email as string | undefined) ?? null,
      profile: profileRes.data,
      roles: rolesRes.data ?? [],
      memberships: membersRes.data ?? [],
      isPlatformAdmin: (rolesRes.data ?? []).some((r) => r.role === "platform_admin"),
    };
  });
