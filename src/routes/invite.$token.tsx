import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { peekInvitation, acceptInvitation } from "@/lib/organizations.functions";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Accept invitation - Teraji" }, { name: "robots", content: "noindex" }],
  }),
  component: InvitePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm">Invitation not found.</div>,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const peek = useServerFn(peekInvitation);
  const accept = useServerFn(acceptInvitation);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const q = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => peek({ data: { token } }),
    enabled: authed === true,
  });

  const acceptMut = useMutation({
    mutationFn: () => accept({ data: { token } }),
    onSuccess: (res) => {
      toast.success("You are in - welcome to the team!");
      router.invalidate();
      if (res.role === "org_admin") {
        navigate({ to: "/org/$orgId/settings", params: { orgId: res.org_id }, replace: true });
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (authed === null) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to accept your invitation</CardTitle>
            <CardDescription>You need an account with the invited email address.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                navigate({ to: "/auth", search: { mode: "signin", redirect: `/invite/${token}` } })
              }
            >
              Continue to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (q.isLoading)
    return <div className="p-8 text-sm text-muted-foreground">Checking invitation...</div>;
  const inv = q.data;
  if (!inv?.found) return <div className="p-8 text-sm">Invitation not found.</div>;

  const emailMismatch = inv.email && email && inv.email.toLowerCase() !== email.toLowerCase();
  const stale =
    inv.revoked || inv.accepted || (inv.expires_at && new Date(inv.expires_at) < new Date());

  return (
    <div className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{inv.org?.name ?? "Organization"}</CardTitle>
          </div>
          <CardDescription>
            You&apos;ve been invited as <span className="font-medium">{inv.role}</span> for{" "}
            <span className="font-medium">{inv.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailMismatch && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              You&apos;re signed in as {email}. Sign out and sign in as {inv.email} to accept.
            </p>
          )}
          {inv.accepted && (
            <p className="text-sm text-muted-foreground">
              This invitation has already been accepted.
            </p>
          )}
          {inv.revoked && (
            <p className="text-sm text-destructive">This invitation has been revoked.</p>
          )}
          {!inv.accepted &&
            !inv.revoked &&
            inv.expires_at &&
            new Date(inv.expires_at) < new Date() && (
              <p className="text-sm text-destructive">
                This invitation expired on {new Date(inv.expires_at).toLocaleDateString()}.
              </p>
            )}
          <Button
            className="w-full"
            disabled={!!emailMismatch || !!stale || acceptMut.isPending}
            onClick={() => acceptMut.mutate()}
          >
            {acceptMut.isPending ? "Accepting..." : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
