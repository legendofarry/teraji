import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getOrganization,
  updateOrganizationSettings,
  listMembers,
  setMemberStatus,
  assignRole,
  revokeRole,
  listInvitations,
  createInvitation,
  revokeInvitation,
  listAuditLog,
} from "@/lib/organizations.functions";
import type { Database } from "@/integrations/supabase/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ArrowLeft, Copy, Trash2, UserPlus, ShieldOff } from "lucide-react";

type AppRole = Database["public"]["Enums"]["app_role"];
type MemberStatus = Database["public"]["Enums"]["member_status"];

export const Route = createFileRoute("/_authenticated/org/$orgId/settings")({
  head: () => ({
    meta: [{ title: "Organization settings - Teraji" }, { name: "robots", content: "noindex" }],
  }),
  component: OrgSettingsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
});

function OrgSettingsPage() {
  const { orgId } = Route.useParams();
  const getOrg = useServerFn(getOrganization);
  const org = useQuery({ queryKey: ["org", orgId], queryFn: () => getOrg({ data: { orgId } }) });

  if (org.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;
  if (!org.data) return <div className="p-8 text-sm">Not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight">{org.data.name}</h1>
              <p className="text-xs text-muted-foreground">
                /{org.data.slug} - {org.data.status}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="terminology">Terminology</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab orgId={orgId} org={org.data} onSaved={() => org.refetch()} />
          </TabsContent>
          <TabsContent value="branding">
            <BrandingTab orgId={orgId} org={org.data} onSaved={() => org.refetch()} />
          </TabsContent>
          <TabsContent value="terminology">
            <TerminologyTab orgId={orgId} org={org.data} onSaved={() => org.refetch()} />
          </TabsContent>
          <TabsContent value="members">
            <MembersTab orgId={orgId} />
          </TabsContent>
          <TabsContent value="invitations">
            <InvitationsTab orgId={orgId} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab orgId={orgId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ------------------------------- General -------------------------------- */

type OrgRow = Awaited<ReturnType<typeof getOrganization>>;

function GeneralTab({ orgId, org, onSaved }: { orgId: string; org: OrgRow; onSaved: () => void }) {
  const update = useServerFn(updateOrganizationSettings);
  const [name, setName] = useState(org.name);
  const [timezone, setTz] = useState(org.timezone);
  const [locale, setLocale] = useState(org.locale);
  const [retention, setRetention] = useState(org.retention_days);

  const mut = useMutation({
    mutationFn: () => update({ data: { orgId, name, timezone, locale, retentionDays: retention } }),
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label>Organization name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Timezone</Label>
            <Input
              value={timezone}
              onChange={(e) => setTz(e.target.value)}
              placeholder="Africa/Nairobi"
            />
          </div>
          <div className="grid gap-2">
            <Label>Locale</Label>
            <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en-KE" />
          </div>
          <div className="grid gap-2">
            <Label>Data retention (days)</Label>
            <Input
              type="number"
              min={30}
              value={retention}
              onChange={(e) => setRetention(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Default 2555 (7 years). Applies to case data per your compliance policy.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Branding ------------------------------ */

function BrandingTab({ orgId, org, onSaved }: { orgId: string; org: OrgRow; onSaved: () => void }) {
  const update = useServerFn(updateOrganizationSettings);
  const b = (org.branding ?? {}) as Record<string, string>;
  const [primary, setPrimary] = useState(b.primary_color ?? "#0d9488");
  const [logo, setLogo] = useState(b.logo_url ?? "");
  const [tagline, setTagline] = useState(b.tagline ?? "");

  const mut = useMutation({
    mutationFn: () =>
      update({ data: { orgId, branding: { primary_color: primary, logo_url: logo, tagline } } }),
    onSuccess: () => {
      toast.success("Branding updated");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Branding</CardTitle>
        <CardDescription>Displayed to your clients and counselors.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label>Primary color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border"
              />
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Logo URL</Label>
            <Input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Care, when it matters"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-4 rounded-md border border-border bg-card p-4">
            <div
              className="grid h-12 w-12 place-items-center rounded-lg text-white font-display text-lg font-bold"
              style={{ backgroundColor: primary }}
            >
              {(org.name?.[0] ?? "T").toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{org.name}</div>
              {tagline && <div className="text-xs text-muted-foreground">{tagline}</div>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : "Save branding"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Terminology ----------------------------- */

const DEFAULT_TERMS = {
  client: "Client",
  clients: "Clients",
  counselor: "Counselor",
  counselors: "Counselors",
  session: "Session",
  sessions: "Sessions",
  case: "Case",
  cases: "Cases",
};

function TerminologyTab({
  orgId,
  org,
  onSaved,
}: {
  orgId: string;
  org: OrgRow;
  onSaved: () => void;
}) {
  const update = useServerFn(updateOrganizationSettings);
  const cfg = (org.onboarding_config ?? {}) as Record<string, unknown>;
  const initial = { ...DEFAULT_TERMS, ...((cfg.terminology as Record<string, string>) ?? {}) };
  const [terms, setTerms] = useState(initial);

  const mut = useMutation({
    mutationFn: () => update({ data: { orgId, onboardingConfig: { ...cfg, terminology: terms } } }),
    onSuccess: () => {
      toast.success("Terminology updated");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Terminology</CardTitle>
        <CardDescription>
          Rename core concepts to match your institution (e.g. "Students" instead of "Clients").
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          {Object.entries(DEFAULT_TERMS).map(([key, defaultVal]) => (
            <div key={key} className="grid gap-2">
              <Label className="capitalize">{defaultVal}</Label>
              <Input
                value={terms[key as keyof typeof DEFAULT_TERMS]}
                onChange={(e) => setTerms({ ...terms, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : "Save terminology"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setTerms(DEFAULT_TERMS)}>
              Reset to defaults
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Members -------------------------------- */

const ROLE_OPTIONS: AppRole[] = [
  "org_admin",
  "counselor",
  "clinical_supervisor",
  "org_staff",
  "client",
];

function MembersTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listMembers);
  const assign = useServerFn(assignRole);
  const revoke = useServerFn(revokeRole);
  const setStatus = useServerFn(setMemberStatus);

  const q = useQuery({ queryKey: ["members", orgId], queryFn: () => list({ data: { orgId } }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["members", orgId] });

  const mAssign = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => assign({ data: { orgId, ...v } }),
    onSuccess: () => {
      toast.success("Role assigned");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mRevoke = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => revoke({ data: { orgId, ...v } }),
    onSuccess: () => {
      toast.success("Role revoked");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mStatus = useMutation({
    mutationFn: (v: { userId: string; status: MemberStatus }) =>
      setStatus({ data: { orgId, ...v } }),
    onSuccess: () => {
      toast.success("Member updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Confirm dialog state for destructive actions
  const [statusConfirm, setStatusConfirm] = useState<{
    userId: string;
    status: MemberStatus;
    name: string;
  } | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{
    userId: string;
    role: AppRole;
    name: string;
  } | null>(null);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Members</CardTitle>
        <CardDescription>Manage roles and access for people in your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No team members have been invited yet. Invite counselors, staff, or clients from the
            Invitations tab.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((m) => {
                const profile = m.profiles as { full_name?: string | null } | null;
                return (
                  <TableRow key={m.user_id}>
                    <TableCell>
                      <div className="font-medium">{profile?.full_name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.user_id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                        {m.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="gap-1">
                            {r}
                            <button
                              className="ml-1 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setRoleConfirm({
                                  userId: m.user_id,
                                  role: r,
                                  name: profile?.full_name ?? m.user_id.slice(0, 8),
                                })
                              }
                              aria-label={`Revoke ${r}`}
                              type="button"
                            >
                              x
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          onValueChange={(v) =>
                            mAssign.mutate({ userId: m.user_id, role: v as AppRole })
                          }
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue placeholder="Add role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {m.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setStatusConfirm({
                                userId: m.user_id,
                                status: "suspended",
                                name: profile?.full_name ?? m.user_id.slice(0, 8),
                              })
                            }
                          >
                            <ShieldOff className="mr-1 h-3.5 w-3.5" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setStatusConfirm({
                                userId: m.user_id,
                                status: "active",
                                name: profile?.full_name ?? m.user_id.slice(0, 8),
                              })
                            }
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!statusConfirm}
        onOpenChange={(o) => !o && setStatusConfirm(null)}
        title={statusConfirm?.status === "suspended" ? "Suspend member?" : "Reactivate member?"}
        description={
          statusConfirm?.status === "suspended"
            ? `${statusConfirm?.name} will lose access to this organization until reactivated.`
            : `${statusConfirm?.name} will regain access to this organization.`
        }
        confirmLabel={statusConfirm?.status === "suspended" ? "Suspend" : "Reactivate"}
        destructive={statusConfirm?.status === "suspended"}
        loading={mStatus.isPending}
        onConfirm={() => {
          if (!statusConfirm) return;
          mStatus.mutate(
            { userId: statusConfirm.userId, status: statusConfirm.status },
            { onSettled: () => setStatusConfirm(null) },
          );
        }}
      />
      <ConfirmDialog
        open={!!roleConfirm}
        onOpenChange={(o) => !o && setRoleConfirm(null)}
        title="Revoke role?"
        description={
          <>
            Remove the <span className="font-medium">{roleConfirm?.role}</span> role from{" "}
            {roleConfirm?.name}? They will immediately lose the permissions granted by this role.
          </>
        }
        confirmLabel="Revoke role"
        destructive
        loading={mRevoke.isPending}
        onConfirm={() => {
          if (!roleConfirm) return;
          mRevoke.mutate(
            { userId: roleConfirm.userId, role: roleConfirm.role },
            { onSettled: () => setRoleConfirm(null) },
          );
        }}
      />
    </Card>
  );
}

/* ----------------------------- Invitations ------------------------------ */

function InvitationsTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listInvitations);
  const create = useServerFn(createInvitation);
  const revoke = useServerFn(revokeInvitation);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("counselor");

  const q = useQuery({
    queryKey: ["invitations", orgId],
    queryFn: () => list({ data: { orgId } }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["invitations", orgId] });

  const mCreate = useMutation({
    mutationFn: () => create({ data: { orgId, email, role } }),
    onSuccess: (inv) => {
      toast.success(`Invitation created for ${inv.email}`);
      setEmail("");
      invalidate();
      const link = `${window.location.origin}/invite/${inv.token}`;
      navigator.clipboard?.writeText(link).catch(() => {});
      toast.message("Invite link copied to clipboard", { description: link });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mRevoke = useMutation({
    mutationFn: (invitationId: string) => revoke({ data: { orgId, invitationId } }),
    onSuccess: () => {
      toast.success("Invitation revoked");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [revokeConfirm, setRevokeConfirm] = useState<{ id: string; email: string } | null>(null);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Invitations</CardTitle>
        <CardDescription>
          Invite people to join this organization. They accept via a secure link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_200px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            mCreate.mutate();
          }}
        >
          <Input
            type="email"
            required
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={mCreate.isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            {mCreate.isPending ? "Sending..." : "Invite"}
          </Button>
        </form>

        {q.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No invitations yet. Invite counselors, staff, or clients from the Invitations
                    tab.
                  </TableCell>
                </TableRow>
              )}
              {(q.data ?? []).map((inv) => {
                const state = inv.revoked_at
                  ? "revoked"
                  : inv.accepted_at
                    ? "accepted"
                    : new Date(inv.expires_at) < new Date()
                      ? "expired"
                      : "pending";
                const link = `${window.location.origin}/invite/${inv.token}`;
                return (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{inv.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          state === "pending"
                            ? "outline"
                            : state === "accepted"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {state === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard?.writeText(link);
                              toast.success("Link copied");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRevokeConfirm({ id: inv.id, email: inv.email })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!revokeConfirm}
        onOpenChange={(o) => !o && setRevokeConfirm(null)}
        title="Revoke invitation?"
        description={
          <>
            The invitation link for <span className="font-medium">{revokeConfirm?.email}</span> will
            stop working immediately. They'll need a new invitation to join.
          </>
        }
        confirmLabel="Revoke invitation"
        destructive
        loading={mRevoke.isPending}
        onConfirm={() => {
          if (!revokeConfirm) return;
          mRevoke.mutate(revokeConfirm.id, { onSettled: () => setRevokeConfirm(null) });
        }}
      />
    </Card>
  );
}

/* ---------------------------------- Audit ------------------------------- */

function AuditTab({ orgId }: { orgId: string }) {
  const list = useServerFn(listAuditLog);
  const q = useQuery({
    queryKey: ["audit", orgId],
    queryFn: () => list({ data: { orgId, limit: 200 } }),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Audit log</CardTitle>
        <CardDescription>
          Every mutation in this organization is recorded here (append-only).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No events yet. Activity will appear here as changes are made.
                  </TableCell>
                </TableRow>
              )}
              {(q.data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {e.entity_type}
                    {e.entity_id ? ` - ${e.entity_id.slice(0, 8)}...` : ""}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {e.actor_id?.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {e.diff ? JSON.stringify(e.diff) : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
