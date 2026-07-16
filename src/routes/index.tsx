import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Calendar, MessageCircle, ClipboardList, AlertTriangle, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teraji — Secure counseling platform for organizations" },
      {
        name: "description",
        content:
          "Teraji gives counseling teams a private, dignified digital workspace: scheduling, notes, assessments, crisis workflows, and secure messaging — built for clinical rigor.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">T</div>
            <span className="font-display text-lg font-semibold tracking-tight">Teraji</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Built for Kenyan institutions · Ready for the world
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Counseling that respects the person,
            <br className="hidden sm:block" />
            <span className="text-primary"> not just the process.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Teraji is a secure, multi-tenant platform for counseling teams — scheduling,
            private notes, structured assessments, crisis workflows, and safe messaging,
            all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Create your organization
            </Link>
            <Link
              to="/auth"
              className="rounded-md border border-input bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              I have an invite
            </Link>
          </div>
        </section>

        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Calendar,      title: "Scheduling",  copy: "Counselor availability, appointments, and check-ins with a lightweight state machine." },
              { Icon: ClipboardList, title: "Notes & summaries", copy: "Private SOAP-style notes for counselors, shared summaries clients can read." },
              { Icon: MessageCircle, title: "Secure messaging", copy: "End-to-end confidential threads between clients and their assigned counselor." },
              { Icon: BarChart3,     title: "Assessments",  copy: "PHQ-9, GAD-7, and org-defined forms with automated scoring and trends." },
              { Icon: AlertTriangle, title: "Crisis workflow", copy: "Risk escalations, safety planning, and on-call routing with an audit trail." },
              { Icon: ShieldCheck,   title: "Compliance-first", copy: "Row-level tenant isolation, MFA for admins, immutable audit log, Kenya DPA aligned." },
            ].map(({ Icon, title, copy }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Teraji</span>
          <span>Nairobi · Africa/Nairobi (EAT)</span>
        </div>
      </footer>
    </div>
  );
}
