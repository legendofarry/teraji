import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMySession } from "@/lib/bootstrap.functions";
import { createOrganization } from "@/lib/organizations.functions";
import { Building2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — Teraji" }, { name: "robots", content: "noindex" }] }),
  component: OnboardingPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Failed to load: {error.message}</div>
  ),
});

function OnboardingPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const fetchSession = useServerFn(getMySession);
  const createOrg = useServerFn(createOrganization);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const q = useQuery({ queryKey: ["me", "session"], queryFn: () => fetchSession() });

  const createMut = useMutation({
    mutationFn: (input: { name: string; slug: string }) => createOrg({ data: input }),
    onSuccess: (res) => {
      toast.success("Organization created");
      router.invalidate();
      navigate({ to: "/org/$orgId/settings", params: { orgId: res.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const me = q.data;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Welcome to Teraji</h1>
          <p className="mt-2 text-sm text-muted-foreground">Let's get you set up in an organization.</p>
        </div>

        {me?.memberships && me.memberships.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Your organizations</CardTitle>
              <CardDescription>Continue where you left off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {me.memberships.map((m) => (
                <Link
                  key={m.org_id}
                  to="/org/$orgId/settings"
                  params={{ orgId: m.org_id }}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {(m.organizations as { name?: string } | null)?.name ?? m.org_id}
                    </span>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.status}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {me?.isPlatformAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create a new organization</CardTitle>
              <CardDescription>
                As Platform Administrator you can create organizations. You'll automatically become its first Org Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createMut.mutate({ name, slug });
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }}
                    placeholder="Nairobi Wellness Center"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nairobi-wellness"
                    pattern="[a-z0-9][a-z0-9-]{1,50}"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
                </div>
                <Button type="submit" disabled={createMut.isPending || !name || !slug}>
                  {createMut.isPending ? "Creating…" : "Create organization"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!me?.isPlatformAdmin && me?.memberships?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waiting for an invitation</CardTitle>
              <CardDescription>
                Ask your organization administrator to invite you by email, or open your invitation link if you already have one.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}
