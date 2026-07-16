import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in - Teraji" },
      { name: "description", content: "Sign in to your Teraji counseling workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: (redirect as "/dashboard") ?? "/dashboard", replace: true });
    });
  }, [navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Verification email sent - check your inbox.");
        navigate({ to: "/verify-email", search: { email }, replace: true });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent - check your inbox.");
        navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: (redirect as "/dashboard") ?? "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<"signin" | "signup" | "forgot", string> = {
    signin: "Welcome back",
    signup: "Create your Teraji account",
    forgot: "Reset your password",
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary/90 to-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-foreground/15 font-bold">
            T
          </div>
          Teraji
        </Link>
        <div>
          <p className="font-display text-3xl font-semibold leading-tight">
            A private, safe, and delightful digital workspace for every counseling team.
          </p>
          <p className="mt-4 text-sm opacity-80">
            Multi-tenant - privacy-first - built with clinical rigor.
          </p>
        </div>
        <span className="text-xs opacity-70">Copyright {new Date().getFullYear()} Teraji</span>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
                T
              </div>
              Teraji
            </Link>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {titles[mode as "signin" | "signup" | "forgot"]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Set up your organization workspace in minutes."
              : mode === "forgot"
                ? "We'll email you a link to set a new password."
                : "Sign in to continue to your workspace."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                <div>
                  New to Teraji?{" "}
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="text-primary hover:underline"
                  >
                    Create an account
                  </Link>
                </div>
                <div>
                  <Link
                    to="/auth"
                    search={{ mode: "forgot" }}
                    className="text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </>
            )}
            {mode === "signup" && (
              <div>
                Already have an account?{" "}
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            )}
            {mode === "forgot" && (
              <div>
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="text-primary hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
