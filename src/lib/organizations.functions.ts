import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type MemberStatus = Database["public"]["Enums"]["member_status"];

async function audit(
  supa: SupabaseClient<Database>,
  actorId: string,
  orgId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  diff: Record<string, unknown> = {},
) {
  await supa.from("audit_log").insert({
    actor_id: actorId,
    org_id: orgId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff: diff as never,
  });
}

/* --------------------------- Organizations ------------------------------ */

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { name: string; slug: string }) => {
    if (!d?.name?.trim() || !d?.slug?.trim()) throw new Error("name_and_slug_required");
    if (!/^[a-z0-9][a-z0-9-]{1,50}$/.test(d.slug)) throw new Error("invalid_slug");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: orgId, error } = await context.supabase.rpc("create_organization", {
      _name: data.name.trim(),
      _slug: data.slug.trim().toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return { id: orgId as string };
  });

export const listOrganizations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organizations")
      .select(
        "id,name,slug,status,region,timezone,locale,branding,onboarding_config,retention_days,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getOrganization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: org, error } = await context.supabase
      .from("organizations")
      .select("*")
      .eq("id", data.orgId)
      .maybeSingle();
    if (error) throw error;
    if (!org) throw new Error("not_found");
    return org;
  });

export const updateOrganizationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      orgId: string;
      name?: string;
      branding?: Record<string, unknown>;
      onboardingConfig?: Record<string, unknown>;
      timezone?: string;
      locale?: string;
      retentionDays?: number;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("update_organization_settings", {
      _org_id: data.orgId,
      _name: data.name ?? undefined,
      _branding: (data.branding as never) ?? undefined,
      _onboarding_config: (data.onboardingConfig as never) ?? undefined,
      _timezone: data.timezone ?? undefined,
      _locale: data.locale ?? undefined,
      _retention_days: data.retentionDays ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- Members ---------------------------------- */

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("organization_members")
      .select("user_id,status,invited_at,joined_at,profiles:user_id(full_name,phone,avatar_url)")
      .eq("org_id", data.orgId);
    if (error) throw error;

    const userIds = (rows ?? []).map((r) => r.user_id);
    const { data: roles } = userIds.length
      ? await context.supabase
          .from("user_roles")
          .select("user_id,role")
          .eq("org_id", data.orgId)
          .in("user_id", userIds)
      : { data: [] as { user_id: string; role: AppRole }[] };

    return (rows ?? []).map((r) => ({
      ...r,
      roles: (roles ?? []).filter((x) => x.user_id === r.user_id).map((x) => x.role),
    }));
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; userId: string; status: MemberStatus }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_member_status", {
      _user_id: data.userId,
      _org_id: data.orgId,
      _status: data.status,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; userId: string; role: AppRole }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("assign_org_role", {
      _user_id: data.userId,
      _org_id: data.orgId,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; userId: string; role: AppRole }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("revoke_org_role", {
      _user_id: data.userId,
      _org_id: data.orgId,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- Invitations -------------------------------- */

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("organization_invitations")
      .select("id,email,role,token,expires_at,accepted_at,revoked_at,created_at,invited_by")
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; email: string; role: AppRole }) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw new Error("invalid_email");
    if (d.role === "platform_admin") throw new Error("cannot_invite_platform_admin");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { randomBytes } = await import("node:crypto");
    const token = randomBytes(24).toString("hex");

    // RLS guards this: only org_admin/platform_admin can insert
    const { data: inv, error } = await context.supabase
      .from("organization_invitations")
      .insert({
        org_id: data.orgId,
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        invited_by: context.userId,
      })
      .select("id,token,email,role,expires_at")
      .single();
    if (error) throw new Error(error.message);
    await audit(
      context.supabase,
      context.userId,
      data.orgId,
      "invitation.created",
      "organization_invitations",
      inv.id,
      {
        email: inv.email,
        role: inv.role,
      },
    );
    return inv;
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; invitationId: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_invitations")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("id", data.invitationId)
      .eq("org_id", data.orgId);
    if (error) throw new Error(error.message);
    await audit(
      context.supabase,
      context.userId,
      data.orgId,
      "invitation.revoked",
      "organization_invitations",
      data.invitationId,
    );
    return { ok: true };
  });

export type PeekedInvitation = {
  found: boolean;
  email?: string;
  role?: AppRole;
  expires_at?: string;
  accepted?: boolean;
  revoked?: boolean;
  org?: { id: string; name: string; slug: string; branding: string };
};

export const peekInvitation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { token: string }) => d)
  .handler(async ({ data, context }): Promise<PeekedInvitation> => {
    const { data: res, error } = await context.supabase.rpc("peek_org_invitation", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const r = (res ?? {}) as Record<string, unknown>;
    const org = r.org as { id: string; name: string; slug: string; branding: unknown } | undefined;
    return {
      found: Boolean(r.found),
      email: r.email as string | undefined,
      role: r.role as AppRole | undefined,
      expires_at: r.expires_at as string | undefined,
      accepted: r.accepted as boolean | undefined,
      revoked: r.revoked as boolean | undefined,
      org: org
        ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
            branding: JSON.stringify(org.branding ?? {}),
          }
        : undefined,
    };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { token: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("accept_org_invitation", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; org_id: string; role: AppRole };
  });

/* ------------------------------ Audit ----------------------------------- */

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("audit_log")
      .select("id,at,actor_id,action,entity_type,entity_id,diff")
      .eq("org_id", data.orgId)
      .order("at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw error;
    return rows ?? [];
  });

export const listPlatformAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { limit?: number } = {}) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("audit_log")
      .select("id,at,org_id,actor_id,action,entity_type,entity_id,diff")
      .order("at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw error;
    return rows ?? [];
  });
