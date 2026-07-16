import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, CheckCircle2, RefreshCw, ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Verify your email — Teraji" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = useSearch({ from: "/verify-email" });
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  // Poll + listen for verification: fires as soon as the confirmation link is
  // clicked in another tab (Supabase syncs localStorage cross-tab).
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user?.email_confirmed_at) {
        setVerified(true);
        setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1200);
      }
    }

    check();
    const interval = window.setInterval(check, 3000);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") check();
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function resend() {
    if (!email) {
      toast.error("No email on file — please sign up again.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Verification email sent again — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-6 py-10">
      {/* Ambient animated blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          style={{ animation: "teraji-float 10s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
          style={{ animation: "teraji-float 14s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-accent/40 blur-3xl"
          style={{ animation: "teraji-float 12s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Icon with pulse rings */}
          <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <span
              className="absolute inset-2 rounded-full bg-primary/25"
              style={{ animation: "teraji-pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite" }}
            />
            <div className="relative grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
              {verified ? (
                <CheckCircle2 className="h-8 w-8 animate-in zoom-in-50 duration-500" />
              ) : (
                <Mail className="h-8 w-8" style={{ animation: "teraji-tilt 3s ease-in-out infinite" }} />
              )}
            </div>
          </div>

          <h1 className="text-center font-display text-2xl font-semibold tracking-tight">
            {verified ? "You're verified!" : "Check your email"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {verified ? (
              <>Taking you to your workspace…</>
            ) : (
              <>
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email ?? "your email"}</span>.
                <br />
                Click it to activate your Teraji account.
              </>
            )}
          </p>

          {/* Progress dots */}
          {!verified && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-2 rounded-full bg-primary/70"
                  style={{
                    animation: `teraji-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                  }}
                />
              ))}
              <span className="ml-3 text-xs text-muted-foreground">Waiting for verification…</span>
            </div>
          )}

          {!verified && (
            <div className="mt-8 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={resend}
                disabled={resending || !email}
              >
                <RefreshCw className={resending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
              >
                I've verified — sign in
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-4 text-center">
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Didn't get it? Check your spam folder, or make sure you signed up with{" "}
          <span className="font-medium">{email ?? "the right address"}</span>.
        </p>
      </div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes teraji-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes teraji-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
        @keyframes teraji-tilt {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes teraji-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}