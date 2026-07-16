import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { getMySession } from "@/lib/bootstrap.functions";
import {
  getHighestActiveRole,
  getRoleLabel,
  getRoleDisplayRole,
  getWorkspaceDescription,
  getWorkspaceNavItems,
} from "@/lib/session";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const qc = useQueryClient();
  const fetchSession = useServerFn(getMySession);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["me", "session"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });
  const session = sessionQuery.data ?? null;

  const role = getHighestActiveRole(session);
  const navItems = useMemo(() => getWorkspaceNavItems(session), [session]);
  const roleLabel = getRoleDisplayRole(session);
  const description = getWorkspaceDescription(role);

  async function performSignOut() {
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      router.invalidate();
      navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2" aria-label="Teraji home">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                T
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">Teraji</span>
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {roleLabel}
                </Badge>
                {session?.primaryMembership?.organizations?.name && (
                  <span className="text-sm text-muted-foreground">
                    {session.primaryMembership.organizations.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          <nav aria-label="Workspace navigation" className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const target = item.hash
                ? `${item.to ?? "/dashboard"}#${item.hash}`
                : (item.to ?? "/dashboard");
              const active = item.hash
                ? location.pathname === (item.to ?? "/dashboard") &&
                  location.hash === `#${item.hash}`
                : location.pathname === (item.to ?? "/dashboard");
              return (
                <Link
                  key={item.label}
                  to={item.to ?? "/dashboard"}
                  hash={item.hash}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-accent text-foreground" }}
                  aria-current={active ? "page" : undefined}
                  title={target}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              {role ? getRoleLabel(role) : "Signed in"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setSignOutOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {!session && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
          >
            Loading your workspace...
          </div>
        )}
        {children}
      </main>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out of Teraji?"
        description="You'll need to sign in again to return to your workspace."
        confirmLabel="Sign out"
        loading={signingOut}
        onConfirm={performSignOut}
      />
    </div>
  );
}
