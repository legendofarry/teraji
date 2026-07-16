import type { getMySession } from "@/lib/bootstrap.functions";
import type { Database } from "@/integrations/supabase/types";

export type MySession = Awaited<ReturnType<typeof getMySession>>;
export type AppRole = Database["public"]["Enums"]["app_role"];

export type Workspace = "platform" | "organization" | "clinical" | "administrative" | "personal";

export type DashboardNavItem = {
  label: string;
  hash?: string;
  to?: string;
};

const rolePriority: AppRole[] = [
  "platform_admin",
  "org_admin",
  "clinical_supervisor",
  "counselor",
  "org_staff",
  "client",
];

export function getActiveMemberships(session: MySession | undefined | null) {
  return session?.activeMemberships ?? [];
}

export function getPrimaryOrganization(session: MySession | undefined | null) {
  return session?.primaryMembership?.organizations ?? null;
}

export function getHighestActiveRole(session: MySession | undefined | null): AppRole | null {
  return (session?.highestRole as AppRole | null) ?? null;
}

export function getWorkspace(role: AppRole | null): Workspace {
  switch (role) {
    case "platform_admin":
      return "platform";
    case "org_admin":
      return "organization";
    case "clinical_supervisor":
    case "counselor":
      return "clinical";
    case "org_staff":
      return "administrative";
    case "client":
      return "personal";
    default:
      return "personal";
  }
}

export function getRoleLabel(role: AppRole | null) {
  switch (role) {
    case "platform_admin":
      return "Platform Administrator";
    case "org_admin":
      return "Organization Administrator";
    case "clinical_supervisor":
      return "Clinical Supervisor";
    case "counselor":
      return "Counselor";
    case "org_staff":
      return "Organization Staff";
    case "client":
      return "Client";
    default:
      return "Workspace";
  }
}

export function getWorkspaceDescription(role: AppRole | null) {
  switch (role) {
    case "platform_admin":
      return "Manage organizations, governance, and platform-wide controls.";
    case "org_admin":
      return "Configure your organization, members, and invitations.";
    case "clinical_supervisor":
    case "counselor":
      return "Track clients, sessions, notes, and follow-up tasks.";
    case "org_staff":
      return "Support scheduling, registrations, and coordination.";
    case "client":
      return "Complete your onboarding and keep track of your care.";
    default:
      return "Your workspace will appear here once your role is active.";
  }
}

export function getWorkspaceNavItems(session: MySession | undefined | null): DashboardNavItem[] {
  const role = getHighestActiveRole(session);
  const organization = getPrimaryOrganization(session);

  switch (role) {
    case "platform_admin":
      return [
        { label: "Organizations", hash: "organizations" },
        { label: "Platform Activity", hash: "platform-activity" },
        { label: "Feature Flags", hash: "feature-flags" },
        { label: "Pending Requests", hash: "pending-organization-requests" },
      ];
    case "org_admin":
      return [
        {
          label: "Organization Settings",
          to: organization?.id ? `/org/${organization.id}/settings` : "/dashboard",
        },
        { label: "Team Members", hash: "team-members" },
        { label: "Invitations", hash: "invitations" },
        { label: "Recent Activity", hash: "recent-activity" },
      ];
    case "clinical_supervisor":
    case "counselor":
      return [
        { label: "Assigned Clients", hash: "assigned-clients" },
        { label: "Today's Appointments", hash: "todays-appointments" },
        { label: "Pending Notes", hash: "pending-notes" },
        { label: "Tasks", hash: "tasks" },
      ];
    case "org_staff":
      return [
        { label: "Scheduling", hash: "scheduling" },
        { label: "Registrations", hash: "registrations" },
        { label: "Administrative Tasks", hash: "administrative-tasks" },
      ];
    case "client":
      return [
        { label: "Progress", hash: "progress-checklist" },
        { label: "Assigned Counselor", hash: "assigned-counselor" },
        { label: "Upcoming Appointment", hash: "upcoming-appointment" },
        { label: "Homework", hash: "homework" },
        { label: "Shared Summaries", hash: "shared-summaries" },
      ];
    default:
      return [];
  }
}

export function getRoleDisplayRole(session: MySession | undefined | null) {
  const role = getHighestActiveRole(session);
  return role ? getRoleLabel(role) : "Workspace";
}

export function sortRolesForDisplay(roles: AppRole[]) {
  return roles.slice().sort((a, b) => rolePriority.indexOf(a) - rolePriority.indexOf(b));
}
