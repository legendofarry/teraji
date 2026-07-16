import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Circle,
  Flag,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  createInvitation,
  createOrganization,
  listOrganizations,
  listMembers,
  listInvitations,
  listAuditLog,
  listPlatformAuditLog,
  revokeInvitation,
} from "@/lib/organizations.functions";
import { getMySession } from "@/lib/bootstrap.functions";
import {
  getHighestActiveRole,
  getPrimaryOrganization,
  getRoleLabel,
  type AppRole,
} from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard - Teraji" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Failed to load: {error.message}</div>
  ),
});

function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const fetchSession = useServerFn(getMySession);
  const createOrg = useServerFn(createOrganization);
  const listOrgs = useServerFn(listOrganizations);
  const listGlobalAudit = useServerFn(listPlatformAuditLog);
  const listOrgMembers = useServerFn(listMembers);
  const listOrgInvitations = useServerFn(listInvitations);
  const listOrgAudit = useServerFn(listAuditLog);

  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [inviteRoleIntent, setInviteRoleIntent] = useState<AppRole | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["me", "session"],
    queryFn: () => fetchSession(),
  });
  const session = sessionQuery.data ?? null;
  const role = getHighestActiveRole(session);
  const primaryOrg = getPrimaryOrganization(session);

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => listOrgs(),
    enabled: role === "platform_admin",
  });
  const platformAuditQuery = useQuery({
    queryKey: ["platform-audit"],
    queryFn: () => listGlobalAudit({ data: { limit: 12 } }),
    enabled: role === "platform_admin",
  });
  const membersQuery = useQuery({
    queryKey: ["members", primaryOrg?.id],
    queryFn: () => listOrgMembers({ data: { orgId: primaryOrg?.id ?? "" } }),
    enabled: role === "org_admin" && !!primaryOrg?.id,
  });
  const invitationsQuery = useQuery({
    queryKey: ["invitations", primaryOrg?.id],
    queryFn: () => listOrgInvitations({ data: { orgId: primaryOrg?.id ?? "" } }),
    enabled: role === "org_admin" && !!primaryOrg?.id,
  });
  const orgAuditQuery = useQuery({
    queryKey: ["audit", primaryOrg?.id],
    queryFn: () => listOrgAudit({ data: { orgId: primaryOrg?.id ?? "", limit: 12 } }),
    enabled: role === "org_admin" && !!primaryOrg?.id,
  });

  const createOrgMut = useMutation({
    mutationFn: (input: { name: string; slug: string }) => createOrg({ data: input }),
    onSuccess: async (res) => {
      toast.success("Organization created");
      setCreateOrgOpen(false);
      setOrgName("");
      setOrgSlug("");
      await qc.invalidateQueries();
      router.invalidate();
      window.location.assign(`/org/${res.id}/settings`);
    },
    onError: (error: Error) => {
      const messages: Record<string, string> = {
        name_and_slug_required: "Enter both an organization name and URL slug.",
        invalid_slug: "Use lowercase letters, numbers, and hyphens only in the slug.",
      };
      toast.error(messages[error.message] ?? error.message);
    },
  });

  const activeOrganization =
    primaryOrg?.name ??
    session?.memberships.find((membership) => membership.organizations)?.organizations?.name ??
    null;
  const hasPlatformOrganizations = (organizationsQuery.data ?? []).length > 0;

  return (
    <div className="space-y-8">
      {role === "platform_admin" && (
        <IntroCard
          badge="Platform administrator"
          title="Welcome to Teraji."
          description="Your platform has been initialized. Your next step is to create and manage organizations."
          actions={
            <>
              <Button onClick={() => setCreateOrgOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("organizations")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Manage Organizations
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("platform-activity")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Platform Audit Log
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("feature-flags")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Feature Flags
              </Button>
            </>
          }
        />
      )}

      {role === "org_admin" && (
        <IntroCard
          badge="Organization administrator"
          title={`Welcome to ${activeOrganization ?? "your organization"}.`}
          description="Complete your organization setup before inviting your team."
          actions={
            <>
              <Button asChild>
                <Link to="/org/$orgId/settings" params={{ orgId: primaryOrg?.id ?? "" }}>
                  Organization Settings
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInviteRoleIntent("counselor");
                  document
                    .getElementById("invitations")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Invite Counselors
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInviteRoleIntent("org_staff");
                  document
                    .getElementById("invitations")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Invite Staff
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInviteRoleIntent("client");
                  document
                    .getElementById("invitations")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Invite Clients
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById("team-members")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Manage Members
              </Button>
            </>
          }
        />
      )}

      {role === "counselor" || role === "clinical_supervisor" ? (
        <IntroCard
          badge="Clinical workspace"
          title="Welcome."
          description="No clients have been assigned yet. Your Organization Administrator will assign clients as they are onboarded."
          actions={null}
        />
      ) : null}

      {role === "org_staff" && (
        <IntroCard
          badge="Administrative workspace"
          title="Welcome."
          description="You can assist with scheduling and administrative operations. Clinical information remains protected."
          actions={null}
        />
      )}

      {role === "client" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit rounded-full">
              Client progress
            </Badge>
            <CardTitle className="text-2xl">Welcome.</CardTitle>
            <CardDescription>
              Complete the steps below to keep your onboarding moving forward.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressStep label="Email Verified" complete={!!session?.emailVerified} />
            <ProgressStep
              label="Consent Accepted"
              complete={false}
              note="Complete Consent to begin. This step will unlock the next part of your onboarding once the module is available."
            />
            <ProgressStep
              label="Intake Completed"
              complete={false}
              note="Your intake form will appear here after consent has been accepted."
            />
            <ProgressStep
              label="First Appointment Booked"
              complete={false}
              note="Appointment booking will appear here once your counselor or organization enables it."
            />
          </CardContent>
        </Card>
      )}

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {role === "platform_admin" && (
          <>
            <WidgetCard
              id="organizations"
              title="Organizations"
              description="Create and review the organizations on your platform."
              icon={Building2}
              actionLabel="Create organization"
              actionOnClick={() => setCreateOrgOpen(true)}
            >
              {sessionQuery.isLoading || organizationsQuery.isLoading ? (
                <LoadingState />
              ) : hasPlatformOrganizations ? (
                <div className="space-y-3">
                  {(organizationsQuery.data ?? []).slice(0, 5).map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">/{org.slug}</div>
                      </div>
                      <Badge variant="outline">{org.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No organizations have been created."
                  description="Create the first organization to begin onboarding teams and members."
                  icon={Building2}
                  action={
                    <Button onClick={() => setCreateOrgOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create organization
                    </Button>
                  }
                />
              )}
            </WidgetCard>

            <WidgetCard
              id="platform-activity"
              title="Platform Activity"
              description="See recent governance and onboarding activity across the platform."
              icon={ShieldCheck}
              actionLabel="Audit log"
            >
              {platformAuditQuery.isLoading ? (
                <LoadingState />
              ) : (platformAuditQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="No platform activity yet."
                  description="Activity will appear here as organizations and administrators start using the platform."
                  icon={ShieldCheck}
                />
              ) : (
                <ActivityList rows={platformAuditQuery.data ?? []} />
              )}
            </WidgetCard>

            <WidgetCard
              id="feature-flags"
              title="Feature Flags"
              description="Reserve this space for platform-wide feature controls."
              icon={Flag}
            >
              <EmptyState
                title="Feature flags are not configured yet."
                description="This widget is ready for future release controls without redesign."
                icon={Flag}
              />
            </WidgetCard>

            <WidgetCard
              id="pending-organization-requests"
              title="Pending Organization Requests"
              description="Track incoming organization requests and status changes."
              icon={Users}
            >
              <EmptyState
                title={
                  hasPlatformOrganizations
                    ? "No pending requests."
                    : "No organizations have been created."
                }
                description={
                  hasPlatformOrganizations
                    ? "Requests will appear here once the workflow is enabled."
                    : "Create the first organization to start the platform."
                }
                icon={Users}
              />
            </WidgetCard>
          </>
        )}

        {role === "org_admin" && (
          <>
            <WidgetCard
              id="team-members"
              title="Team Members"
              description="Review who has been added to this organization."
              icon={Users}
            >
              {membersQuery.isLoading ? (
                <LoadingState />
              ) : (membersQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="No team members have been invited."
                  description="Invite counselors, staff, or clients from the Invitations section."
                  icon={Users}
                />
              ) : (
                <div className="space-y-3">
                  {(membersQuery.data ?? []).map((member) => {
                    const profile = member.profiles as { full_name?: string | null } | null;
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-start justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <div>
                          <div className="font-medium">
                            {profile?.full_name ?? "Unnamed member"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.user_id.slice(0, 8)}...
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {member.roles.map((memberRole) => (
                            <Badge key={memberRole} variant="secondary">
                              {getRoleLabel(memberRole as AppRole)}
                            </Badge>
                          ))}
                          <Badge variant="outline">{member.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </WidgetCard>

            <WidgetCard
              id="invitations"
              title="Invitations"
              description="Invite people into the organization with role-aware access."
              icon={Sparkles}
            >
              <InvitationWidget
                orgId={primaryOrg?.id ?? ""}
                defaultRole={inviteRoleIntent}
                onRoleUsed={() => setInviteRoleIntent(null)}
                invitations={invitationsQuery.data ?? []}
                loading={invitationsQuery.isLoading}
                onRefresh={async () => {
                  await qc.invalidateQueries({ queryKey: ["invitations", primaryOrg?.id] });
                  await qc.invalidateQueries({ queryKey: ["members", primaryOrg?.id] });
                  await qc.invalidateQueries({ queryKey: ["audit", primaryOrg?.id] });
                }}
              />
            </WidgetCard>

            <WidgetCard
              id="organization-settings"
              title="Organization Setup"
              description="Check the organization record and open the full settings page."
              icon={Building2}
              actionLabel="Open settings"
            >
              <EmptyState
                title="Keep your setup aligned."
                description="Use the organization settings page to update branding, terminology, and compliance settings."
                icon={Building2}
                action={
                  <Button asChild>
                    <Link to="/org/$orgId/settings" params={{ orgId: primaryOrg?.id ?? "" }}>
                      Organization Settings
                    </Link>
                  </Button>
                }
              />
            </WidgetCard>

            <WidgetCard
              id="recent-activity"
              title="Recent Activity"
              description="Review the latest changes in this organization."
              icon={ShieldCheck}
            >
              {orgAuditQuery.isLoading ? (
                <LoadingState />
              ) : (orgAuditQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="No activity yet."
                  description="Organization events will appear here as members, invitations, and settings change."
                  icon={ShieldCheck}
                />
              ) : (
                <ActivityList rows={orgAuditQuery.data ?? []} />
              )}
            </WidgetCard>
          </>
        )}

        {(role === "counselor" || role === "clinical_supervisor") && (
          <>
            <WidgetCard
              id="assigned-clients"
              title="Assigned Clients"
              description="Clients assigned to you will appear here."
              icon={Users}
            >
              <EmptyState
                title="No clients assigned."
                description="Your Organization Administrator will assign clients as they are onboarded."
                icon={Users}
              />
            </WidgetCard>
            <WidgetCard
              id="todays-appointments"
              title="Today's Appointments"
              description="Your schedule will populate here when appointments are available."
              icon={Sparkles}
            >
              <EmptyState
                title="No appointments scheduled today."
                description="Appointments will appear here once scheduling is enabled for your organization."
                icon={Sparkles}
              />
            </WidgetCard>
            <WidgetCard
              id="pending-notes"
              title="Pending Notes"
              description="Draft notes and follow-up items will show up here."
              icon={ShieldCheck}
            >
              <EmptyState
                title="No pending notes."
                description="Notes will surface here after sessions are recorded."
                icon={ShieldCheck}
              />
            </WidgetCard>
            <WidgetCard
              id="tasks"
              title="Tasks"
              description="Track clinical follow-ups and next steps."
              icon={CheckCircle2}
            >
              <EmptyState
                title="No open tasks."
                description="Tasks will appear here when follow-ups are created."
                icon={CheckCircle2}
              />
            </WidgetCard>
          </>
        )}

        {role === "org_staff" && (
          <>
            <WidgetCard
              id="scheduling"
              title="Scheduling"
              description="Coordinate appointments and availability."
              icon={Sparkles}
            >
              <EmptyState
                title="No appointments scheduled."
                description="Scheduling work will appear here once appointments are created."
                icon={Sparkles}
              />
            </WidgetCard>
            <WidgetCard
              id="registrations"
              title="Registrations"
              description="Track onboarding and registration work."
              icon={Users}
            >
              <EmptyState
                title="No registrations yet."
                description="New registrations will appear here as people join the organization."
                icon={Users}
              />
            </WidgetCard>
            <WidgetCard
              id="administrative-tasks"
              title="Administrative Tasks"
              description="Manage non-clinical follow-up work."
              icon={CheckCircle2}
            >
              <EmptyState
                title="No administrative tasks."
                description="Tasks will appear here as the organization starts coordinating work."
                icon={CheckCircle2}
              />
            </WidgetCard>
          </>
        )}

        {role === "client" && (
          <>
            <WidgetCard
              id="progress-checklist"
              title="Progress Checklist"
              description="See what is complete and what still needs attention."
              icon={CheckCircle2}
            >
              <div className="space-y-3">
                <ChecklistRow complete={!!session?.emailVerified} label="Email Verified" />
                <ChecklistRow
                  complete={false}
                  label="Consent Accepted"
                  note="Complete Consent to begin."
                />
                <ChecklistRow
                  complete={false}
                  label="Intake Completed"
                  note="Intake will unlock after Consent."
                />
                <ChecklistRow
                  complete={false}
                  label="First Appointment Booked"
                  note="Scheduling will appear here when available."
                />
              </div>
            </WidgetCard>
            <WidgetCard
              id="assigned-counselor"
              title="Assigned Counselor"
              description="Your care team will appear here."
              icon={Users}
            >
              <EmptyState
                title="No counselor assigned yet."
                description="Your organization will assign a counselor when your onboarding is ready."
                icon={Users}
              />
            </WidgetCard>
            <WidgetCard
              id="upcoming-appointment"
              title="Upcoming Appointment"
              description="Your next booking will appear here."
              icon={Sparkles}
            >
              <EmptyState
                title="Complete Consent to begin."
                description="Your first appointment will show up here once the care flow is active."
                icon={Sparkles}
              />
            </WidgetCard>
            <WidgetCard
              id="homework"
              title="Homework"
              description="Client tasks and follow-up work will appear here."
              icon={CheckCircle2}
            >
              <EmptyState
                title="No homework assigned."
                description="Assigned activities will appear here when your counselor creates them."
                icon={CheckCircle2}
              />
            </WidgetCard>
            <WidgetCard
              id="shared-summaries"
              title="Shared Summaries"
              description="Review shared summaries and care notes here."
              icon={ShieldCheck}
            >
              <EmptyState
                title="No shared summaries yet."
                description="Shared summaries will appear here after they are published."
                icon={ShieldCheck}
              />
            </WidgetCard>
          </>
        )}
      </section>

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
        name={orgName}
        slug={orgSlug}
        onNameChange={(value) => {
          setOrgName(value);
          if (!orgSlug) {
            setOrgSlug(
              value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 50),
            );
          }
        }}
        onSlugChange={setOrgSlug}
        busy={createOrgMut.isPending}
        onSubmit={() => createOrgMut.mutate({ name: orgName, slug: orgSlug })}
      />
    </div>
  );
}

function IntroCard({
  badge,
  title,
  description,
  actions,
}: {
  badge: string;
  title: string;
  description: string;
  actions: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <Badge variant="secondary" className="w-fit rounded-full">
          {badge}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-base text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
      </CardHeader>
    </Card>
  );
}

function WidgetCard({
  id,
  title,
  description,
  icon: Icon,
  actionLabel,
  actionOnClick,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel?: string;
  actionOnClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {actionLabel && actionOnClick && (
            <Button size="sm" variant="ghost" onClick={actionOnClick}>
              {actionLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChecklistRow({
  label,
  complete,
  note,
}: {
  label: string;
  complete: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
      <div className="mt-0.5 text-primary">
        {complete ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <div className="font-medium">{label}</div>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

function ProgressStep({
  label,
  complete,
  note,
}: {
  label: string;
  complete: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
      <div className="mt-0.5 text-primary">
        {complete ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <div className="font-medium">{label}</div>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
      Loading your workspace...
    </div>
  );
}

function ActivityList({
  rows,
}: {
  rows: Array<{
    id: string;
    at: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    diff?: unknown;
  }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{row.action}</div>
            <div className="text-xs text-muted-foreground">{new Date(row.at).toLocaleString()}</div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {row.entity_type}
            {row.entity_id ? ` - ${row.entity_id.slice(0, 8)}...` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateOrganizationDialog({
  open,
  onOpenChange,
  name,
  slug,
  onNameChange,
  onSlugChange,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  slug: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Set up a new organization so you can manage members and configure the workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nairobi Wellness Center"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-slug">URL slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="nairobi-wellness"
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={busy || !name.trim() || !slug.trim()}>
            {busy ? "Creating..." : "Create organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvitationWidget({
  orgId,
  defaultRole,
  onRoleUsed,
  invitations,
  loading,
  onRefresh,
}: {
  orgId: string;
  defaultRole: AppRole | null;
  onRoleUsed: () => void;
  invitations: Array<{
    id: string;
    email: string;
    role: AppRole;
    token: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  }>;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const create = useServerFn(createInvitation);
  const revoke = useServerFn(revokeInvitation);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>(defaultRole ?? "counselor");
  const [revokeConfirm, setRevokeConfirm] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    if (defaultRole) setRole(defaultRole);
  }, [defaultRole]);

  const createMut = useMutation({
    mutationFn: () => create({ data: { orgId, email, role } }),
    onSuccess: async (invitation) => {
      toast.success(`Invitation created for ${invitation.email}`);
      setEmail("");
      await onRefresh();
      const link = `${window.location.origin}/invite/${invitation.token}`;
      const copied = navigator.clipboard?.writeText(link);
      copied?.catch(() => {});
      toast.message("Invite link copied to clipboard", { description: link });
    },
    onError: (error: Error) => {
      const messages: Record<string, string> = {
        invalid_email: "Enter a valid email address.",
        cannot_invite_platform_admin:
          "Platform administrators cannot be invited through this flow.",
      };
      toast.error(messages[error.message] ?? error.message);
    },
  });

  const revokeMut = useMutation({
    mutationFn: (invitationId: string) => revoke({ data: { orgId, invitationId } }),
    onSuccess: async () => {
      toast.success("Invitation revoked");
      await onRefresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_200px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <Input
          type="email"
          required
          placeholder="person@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Invitation email"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            const next = value as AppRole;
            setRole(next);
            onRoleUsed();
          }}
        >
          <SelectTrigger aria-label="Invitation role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {(["counselor", "org_staff", "client"] as AppRole[]).map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {getRoleLabel(candidate)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={createMut.isPending || !email.trim() || !orgId}>
          {createMut.isPending ? "Sending..." : "Invite"}
        </Button>
      </form>

      {loading ? (
        <LoadingState />
      ) : invitations.length === 0 ? (
        <EmptyState
          title="No invitations yet."
          description="Invite counselors, staff, or clients when you are ready."
          icon={Sparkles}
        />
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const state = invitation.revoked_at
              ? "revoked"
              : invitation.accepted_at
                ? "accepted"
                : new Date(invitation.expires_at) < new Date()
                  ? "expired"
                  : "pending";
            const link = `${window.location.origin}/invite/${invitation.token}`;
            return (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{invitation.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {getRoleLabel(invitation.role)} - Expires{" "}
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  {state === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const copied = navigator.clipboard?.writeText(link);
                          copied?.catch(() => {});
                          toast.success("Link copied");
                        }}
                      >
                        Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setRevokeConfirm({ id: invitation.id, email: invitation.email })
                        }
                      >
                        Revoke
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!revokeConfirm}
        onOpenChange={(open) => !open && setRevokeConfirm(null)}
        title="Revoke invitation?"
        description={
          <>
            The invitation link for <span className="font-medium">{revokeConfirm?.email}</span> will
            stop working immediately.
          </>
        }
        confirmLabel="Revoke invitation"
        destructive
        loading={revokeMut.isPending}
        onConfirm={() => {
          if (!revokeConfirm) return;
          revokeMut.mutate(revokeConfirm.id, { onSettled: () => setRevokeConfirm(null) });
        }}
      />
    </div>
  );
}
