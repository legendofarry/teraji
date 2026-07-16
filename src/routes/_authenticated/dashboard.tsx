import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { claimPlatformAdmin, getMySession } from "@/lib/bootstrap.functions";
import { LogOut, ShieldCheck, Building2, User as UserIcon, Settings, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Teraji" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Failed to load: {error.message}</div>
  ),
});

function DashboardPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const fetchSession = useServerFn(getMySession);
  const bootstrap = useServerFn(claimPlatformAdmin);

  const q = useQuery({
    queryKey: ["me", "session"],
    queryFn: () => fetchSession(),
  });

  const bootstrapMut = useMutation({
    mutationFn: () => bootstrap(),
    onSuccess: () => {
      toast.success("You are now the Platform Administrator.");
      router.invalidate();
      q.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  const me = q.data;
  const hasNoOrg = me && me.memberships.length === 0 && !me.isPlatformAdmin;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">T</div>
            <span className="font-display text-lg font-semibold tracking-tight">Teraji</span>
          </div>
          <div className="flex items-center gap-3">
            {me?.email && <span className="text-sm text-muted-foreground hidden sm:inline">{me.email}</span>}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Welcome{me?.profile?.full_name ? `, ${me.profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            P1 features arrive next. This is your P0 foundations workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {me?.profile?.full_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Locale:</span> {me?.profile?.locale ?? "—"}</div>
              <div><span className="text-muted-foreground">Timezone:</span> {me?.profile?.timezone ?? "—"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Roles</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {me && me.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {me?.roles.map((r, i) => (
                    <Badge key={i} variant="secondary">{r.role}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Organizations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {me && me.memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">You are not a member of any organization yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {me?.memberships.map((m) => (
                    <li key={m.org_id} className="flex items-center justify-between">
                      <span>
                        {(m.organizations as { name?: string } | null)?.name ?? m.org_id}{" "}
                        <Badge variant="outline">{m.status}</Badge>
                      </span>
                      <Link to="/org/$orgId/settings" params={{ orgId: m.org_id }} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        <Settings className="h-3 w-3" /> Manage
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {me && !me.isPlatformAdmin && me.roles.length === 0 && (
          <Card className="mt-8 border-primary/40 bg-accent/30">
            <CardHeader>
              <CardTitle className="text-base">Platform Administrator bootstrap</CardTitle>
              <CardDescription>
                If your account's email matches the configured PLATFORM_ADMIN_EMAIL and no
                Platform Administrator exists yet, you can claim the role now. This action is
                audited and self-disables after the first success.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => bootstrapMut.mutate()} disabled={bootstrapMut.isPending}>
                {bootstrapMut.isPending ? "Claiming…" : "Claim Platform Administrator"}
              </Button>
            </CardContent>
          </Card>
        )}

        {(hasNoOrg || me?.isPlatformAdmin) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">{me?.isPlatformAdmin ? "Create or join an organization" : "Get started"}</CardTitle>
              <CardDescription>
                {me?.isPlatformAdmin
                  ? "Create a new organization or accept a pending invitation."
                  : "Accept an invitation or wait for your admin to add you."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/onboarding" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Open onboarding
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
