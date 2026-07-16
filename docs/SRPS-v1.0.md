# Software Requirements & Product Specification (SRPS) — v1.0 (Approved)

> Single source of truth for future implementation.
> Legend: **[C]** Confirmed · **[R]** Recommendation · **[O]** Open question.
> Approval status: **APPROVED** with additions (Emergency Contact, Case Status, Tasks/Follow-ups) — incorporated below.

---

## 1. Executive Summary

**[C]** A secure, cloud-based, multi-tenant SaaS platform for managing counseling services. MVP targets Kenyan post-secondary institutions (universities, colleges, TVETs, training institutions). Architecture is organization-agnostic and will support companies, NGOs, faith-based, community, private practice, government, and healthcare organizations without redesign.

**[C]** MVP delivers: in-person session scheduling, session notes & case management, secure async messaging, structured assessments, crisis/risk-escalation, tasks & follow-ups, aggregate reporting, and secure notifications. Voice/video/live rooms/screen-share/in-session file sharing are architected in v1 and implemented in a later milestone with **Daily.co** behind a provider-agnostic `session_media` abstraction.

---

## 2. Product Vision

**[C]** "Give every counseling organization a private, safe, and delightful digital workspace to schedule, deliver, document, and improve care — with client dignity, data protection, and clinical rigor as non-negotiables."

---

## 3. Product Scope

### 3.1 In scope (MVP / v1)
- Multi-tenant org onboarding (invite-only default; other methods architected)
- Role-based access (Platform Admin, Org Admin, Counselor, Client, Org Staff)
- Client roster, intake, consent capture, **emergency contact**, **case status**
- Counselor availability & appointment scheduling (in-person)
- Session lifecycle (booked → checked-in → in-progress → completed / no-show / cancelled)
- Private clinical notes + client-visible shared summary / care plan
- **Tasks & Follow-ups** (counselor-owned, client-linked, session-linked)
- Structured assessments (PHQ-9, GAD-7, custom org-defined forms)
- Crisis / risk-escalation workflow with safety plan template (uses emergency contact)
- Secure async messaging (counselor ↔ client) with attachments
- Anonymised org-level analytics
- Notifications: Email + Web Push
- Full audit log
- Client & counselor self-service profile management

### 3.2 Architected in v1, delivered later
- 1:1 voice & video sessions
- Organization live meeting rooms
- Group counseling sessions
- Screen sharing
- In-session file sharing
- Org subscription billing (Airtel Money & M-Pesa first; Stripe later)
- Additional onboarding methods (domain, join code/QR, CSV bulk, SSO)
- Client-facing paid counseling billing (opt-in per org)
- SMS + WhatsApp notifications
- Regional / in-country data residency for enterprise tier
- Native mobile apps

### 3.3 Explicitly out of scope (v1 and v2)
- Prescribing / e-pharmacy
- Insurance claims processing
- Public directory of counselors outside an org

---

## 4. Target Market

**[C]** Primary: Kenyan post-secondary institutions (~500+ eligible). Secondary (post-MVP): Kenyan private counseling practices, faith-based orgs, corporates, NGOs. Long-term: any organization providing counseling or wellbeing services globally.

**[R]** Design copy, currency (KES), locale (en-KE), and time zone (EAT) defaults for Kenya; keep i18n keys and locale switch from day one.

---

## 5. User Personas

| Persona | Context | Primary goals | Pain points solved |
|---|---|---|---|
| **Amina — Dean of Students** | Public university, 25k students | Compliant, auditable counseling service; visibility into demand | Paper files, no data on wait times, privacy risk |
| **David — Head Counselor** | 6-counselor team | Efficient triage, safe notes, workload balance | Excel scheduling, unsecured docs |
| **Grace — Counselor** | Sees 6–8 clients/day | Fast notes, safe messaging, follow-up tracking | Losing continuity between sessions |
| **Brian — Student/Client** | Undergraduate, smartphone-first | Book privately, message counselor, complete forms | Stigma of walking into office, no visibility of appointment |
| **Faith — Org Admin (non-clinical)** | Registrar's office | Provision counselors, run reports, manage roster | Manual user setup |
| **Peter — Platform Admin** | Lovable-side operator | Onboard orgs, monitor uptime, handle billing | N/A — new role |

---

## 6. User Roles & Responsibilities

**[C]** Five system roles. Roles are stored in a separate `user_roles` table (never on profiles) and checked via a `has_role` SECURITY DEFINER function to avoid RLS recursion.

| Role | Scope | Key responsibilities |
|---|---|---|
| **Platform Administrator** | Global | Onboard/suspend orgs, feature flags, platform telemetry, billing config. **Zero access to tenant counseling data.** |
| **Organization Administrator** | One org | Configure org, manage staff/counselors, onboarding methods, retention overrides, view org-level analytics, manage roster |
| **Counselor** | One org, own caseload + shared queue | Own availability, conduct sessions, write private notes & shared summary, manage assessments, initiate escalations, create/close tasks |
| **Client** | One org, own record only | Book/cancel, complete intake & assessments, message assigned counselor, view shared summary, view own tasks |
| **Organization Staff** | One org, restricted | Front-desk / reception: view schedule, check-in clients, no access to notes/messages |

**[R]** Add a permission-based sub-role: **Clinical Supervisor** (counselor with `permissions:supervise`) who can review other counselors' notes for supervision.

**[O]** Should Org Admin be able to be simultaneously a Counselor? Recommendation: yes, roles are additive.

---

## 7. Permissions Matrix

Legend: ✅ full · 🟡 conditional · ❌ none

| Capability | Platform Admin | Org Admin | Counselor | Org Staff | Client | Supervisor |
|---|---|---|---|---|---|---|
| Create org | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure org settings | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users in own org | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own org roster | ❌ | ✅ | 🟡 assigned | 🟡 limited | ❌ | ✅ |
| Book / edit appointment | ❌ | ✅ | ✅ | 🟡 create only | 🟡 own only | ✅ |
| Read counselor's **private** notes | ❌ | ❌ | 🟡 own only | ❌ | ❌ | 🟡 supervisees only |
| Read **shared summary** | ❌ | ❌ | 🟡 assigned | ❌ | 🟡 own | 🟡 supervisees |
| Send message to client | ❌ | ❌ | 🟡 assigned | ❌ | 🟡 to counselor | ❌ |
| Complete assessment | ❌ | ❌ | ✅ | ❌ | 🟡 assigned | ✅ |
| Trigger escalation | ❌ | ❌ | ✅ | ❌ | 🟡 self-alert | ✅ |
| Manage client **case status** | ❌ | 🟡 override | ✅ assigned | ❌ | ❌ | ✅ |
| View/edit **emergency contact** | ❌ | 🟡 org admin | 🟡 assigned | ❌ | ✅ own | 🟡 supervisees |
| Create/assign **task** | ❌ | 🟡 own team | ✅ | ❌ | ❌ | ✅ |
| View own tasks (as client) | ❌ | ❌ | ❌ | ❌ | 🟡 client-visible only | ❌ |
| View org analytics | ❌ | ✅ | 🟡 own | ❌ | ❌ | ✅ |
| View platform analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export client's own data (DSAR) | ❌ | 🟡 with audit | ❌ | ❌ | ✅ | ❌ |
| Impersonate user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**[C]** Platform Admin has **zero-access** to tenant counseling data (enforced by RLS). Break-glass access is out of scope for v1.

---

## 8. User Journey Maps

1. **Org onboarding**: Platform Admin creates org → invites Org Admin → Org Admin configures onboarding method (default: invite-only) → adds counselors → imports/invites clients.
2. **Client first session**: Invite email/SMS → account activation → consent + intake form (**including emergency contact**) → assessment (PHQ-9) → book appointment → reminder (email + web push) → check-in → session → counselor writes notes + shared summary → **creates follow-up tasks** → follow-up scheduled → case status set to `Active`.
3. **Crisis escalation**: Assessment score ≥ threshold OR counselor flag → escalation record created → on-call counselor + Org Admin notified → **emergency contact surfaced** → safety plan created with client → follow-up tasks tracked → case status may move to `Waiting` or remain `Active`.
4. **Async messaging**: Client opens conversation with assigned counselor → sends message + attachment → counselor notified → responds within SLA window configured per org.
5. **Case closure**: Counselor completes agreed goals → moves case status to `Closed` (or `Referred` / `Archived`) → outstanding tasks resolved or reassigned → client notified.
6. **Reporting**: Org Admin opens dashboard → sees anonymised counts by month, presenting issue, wait time, no-show rate, assessment score trends, **case-status distribution**, **task completion rates**.

---

## 9. Functional Requirements

**FR-1 Auth & Identity**: Email/password + Google OAuth; MFA (TOTP) optional for all, required for Org Admin & Platform Admin. Password HIBP check on. Rate-limited.
**FR-2 Org & Tenant**: Org create/suspend, per-org branding, per-org onboarding config, per-org retention config.
**FR-3 User Provisioning**: Invitation-only default (email + SMS-ready); architecture supports domain, join code/QR, CSV, SSO.
**FR-4 Scheduling**: Counselor availability templates, appointment types & durations, booking, rescheduling, cancellation policy, waitlist.
**FR-5 Session Lifecycle**: State machine `scheduled → checked_in → in_progress → completed | no_show | cancelled`.
**FR-6 Notes**: Structured SOAP-style **private note** + separate **shared summary**; both versioned, append-only audit.
**FR-7 Assessments**: Versioned form definitions (PHQ-9, GAD-7 seeded), scoring rules, scheduled re-administration, thresholds trigger escalation candidates.
**FR-8 Crisis Workflow**: Escalation record with severity, on-call routing, safety plan template, resolution & review. Emergency contact is surfaced at escalation time.
**FR-9 Messaging**: Threaded conversations scoped to client + assigned counselor; attachments via signed URLs; typing/read receipts.
**FR-10 Consent**: Versioned consent documents per org; capture, store, re-consent on version bump.
**FR-11 Notifications**: Email (Resend) + Web Push (VAPID). SMS/WhatsApp architected via a `notification_channel` abstraction.
**FR-12 Analytics**: Org dashboard with anonymised aggregates; platform dashboard with per-org counts (no clinical data).
**FR-13 Audit**: Every read/write on clinical data logged (actor, target, action, timestamp, ip, user_agent).
**FR-14 Data Subject Rights**: Client self-service export (JSON + PDF) and deletion request; retention/legal hold aware.
**FR-15 Media (later)**: `session_media` abstraction with adapter pattern; Daily.co adapter first.
**FR-16 Emergency Contact (NEW)**: Each client MAY have zero or more emergency contacts with fields `full_name`, `relationship`, `phone_number`, `email` (optional), `is_primary`, `notes`. Editable by the client and by the assigned counselor. Surfaced automatically in the escalation view and safety plan. Change history retained (audit).
**FR-17 Case Status (NEW)**: Each client has a single `case_status` enum: `active | waiting | closed | referred | archived`. Transitions are logged with actor, timestamp, and optional reason. Business rules:
- New clients default to `waiting` until first appointment is completed, then `active`.
- `referred` requires a referral record (org name or internal counselor, reason).
- `closed` and `archived` may auto-resolve or reassign open tasks per org policy.
- Escalations cannot be opened on `archived` clients (must be reactivated first).
**FR-18 Tasks & Follow-ups (NEW)**: A task represents an actionable item created by a counselor (or auto-generated from a workflow such as escalation or assessment threshold).
- Fields: `id`, `org_id`, `client_id` (optional), `session_id` (optional), `assignee_user_id` (counselor by default), `title`, `description`, `due_at`, `priority (low|medium|high|urgent)`, `status (open|in_progress|done|cancelled)`, `is_client_visible (bool, default false)`, `source (manual|assessment|escalation|session|system)`, `completed_at`, `completed_by`, timestamps, audit.
- If `is_client_visible = true`, the client sees the task (title only, safe copy) in their dashboard.
- Tasks are surfaced in: counselor dashboard (My Tasks), client 360 (per-client task list), org dashboard (overdue task heatmap).
- Overdue tasks trigger reminder notifications per assignee preferences.
- Deleting a client soft-cascades to their tasks; hard-delete respects retention rules.

---

## 10. Business Rules

- **BR-1**: A client belongs to exactly one org. Cross-org access is impossible.
- **BR-2**: Only the authoring counselor can edit a private note; supervisors read-only.
- **BR-3**: Shared summary changes are versioned; clients always see the latest published version.
- **BR-4**: A client may have at most one active counselor assignment; changes require Org Admin approval or documented handover.
- **BR-5**: Escalations block session completion until a safety plan or resolution is recorded.
- **BR-6**: Deleted records are soft-deleted for the retention window (default 7y); hard-delete only via DSAR + legal-hold check.
- **BR-7**: Notifications must never include clinical content in transport — only "You have a new message" style.
- **BR-8**: Messaging attachments are scanned (size + MIME allow-list) and stored encrypted at rest.
- **BR-9**: Availability changes cannot orphan existing bookings; system requires reschedule flow.
- **BR-10**: An org cannot be hard-deleted while active clients or unresolved escalations exist.
- **BR-11 (NEW)**: An emergency contact marked `is_primary` is unique per client; setting a new primary demotes the previous.
- **BR-12 (NEW)**: Moving a client to `closed`, `referred`, or `archived` requires all open, non-client-visible tasks to be resolved or reassigned; the UI must prompt.
- **BR-13 (NEW)**: A client-visible task's title must pass a "no clinical content in the title" review guideline (owner: counselor); enforced by pattern lint + org policy.

---

## 11. Non-Functional Requirements

| # | Category | Requirement |
|---|---|---|
| NFR-1 | Security | TLS 1.2+ in transit; AES-256 at rest; per-tenant RLS; MFA for admins; secrets in secrets manager |
| NFR-2 | Privacy | Compliant with Kenya DPA 2019 + GDPR principles + HIPAA-inspired safeguards; DPIA template maintained |
| NFR-3 | Availability | 99.5% v1 target; 99.9% roadmap |
| NFR-4 | Performance | P95 page load < 2.5s on 4G; API P95 < 400ms |
| NFR-5 | Scalability | 10k orgs, 5M users design target; RLS sharding-friendly |
| NFR-6 | Accessibility | WCAG 2.1 AA |
| NFR-7 | Localization | en-KE default, i18n-ready, EAT timezone default |
| NFR-8 | Auditability | Immutable audit log, min 7y retention |
| NFR-9 | Recoverability | RPO ≤ 1h, RTO ≤ 4h; daily backups + PITR |
| NFR-10 | Observability | Structured logs, error tracking, uptime monitoring, per-tenant usage metering |

---

## 12. Relational Data Model (Postgres + RLS) — v1

### 12.1 Core tables (illustrative — final DDL in Appendix B)

- `organizations` (id, name, slug, status, region, retention_days, onboarding_config jsonb, branding jsonb, created_at)
- `profiles` (user_id PK/FK auth.users, full_name, phone, locale, timezone, avatar_url)
- `organization_members` (org_id, user_id, status, joined_at)
- `user_roles` (id, user_id, org_id nullable for platform admin, role app_role) — **separate table**
- `clients` (id, org_id, user_id, external_id, demographics jsonb (encrypted at column-level for sensitive fields), assigned_counselor_id nullable, **case_status enum ('active','waiting','closed','referred','archived') default 'waiting'**, case_status_updated_at, case_status_updated_by, referral_ref jsonb nullable)
- `client_emergency_contacts` **(NEW)** (id, org_id, client_id, full_name, relationship, phone_number, email nullable, is_primary bool, notes, created_at, updated_at)
- `counselors` (id, org_id, user_id, credentials, specialties[])
- `availability_slots` (id, counselor_id, rrule, start_at, end_at, timezone)
- `appointments` (id, org_id, client_id, counselor_id, type, start_at, end_at, status, location_or_modality, created_by)
- `sessions` (id, appointment_id, started_at, ended_at, outcome)
- `session_notes_private` (id, session_id, counselor_id, body_encrypted, version, created_at)
- `session_summaries_shared` (id, session_id, body, version, published_at)
- `tasks` **(NEW)** (id, org_id, client_id nullable, session_id nullable, assignee_user_id, title, description, due_at, priority enum, status enum, is_client_visible bool default false, source enum, completed_at, completed_by, created_by, created_at, updated_at)
- `assessments` (id, org_id, key, version, definition jsonb, scoring jsonb)
- `assessment_responses` (id, assessment_id, client_id, answers jsonb, score, risk_level, submitted_at)
- `escalations` (id, org_id, client_id, opened_by, severity, status, safety_plan_id, resolved_at)
- `safety_plans` (id, client_id, content jsonb, version, published_at)
- `conversations` (id, org_id, client_id, counselor_id, last_message_at)
- `messages` (id, conversation_id, sender_id, body_encrypted, attachment_id nullable, read_at)
- `attachments` (id, org_id, storage_path, mime, size, virus_scan_status)
- `consents` (id, org_id, client_id, document_version, accepted_at)
- `consent_documents` (id, org_id, version, body, effective_at)
- `notifications` (id, user_id, channel, template_key, payload, status, sent_at)
- `notification_preferences` (user_id, channel, template_key, enabled)
- `audit_log` (id, org_id, actor_id, action, entity_type, entity_id, diff jsonb, ip, user_agent, at) — append-only
- `session_media` (id, session_id, provider, room_id, recording_uri nullable) — placeholder for Daily.co
- `feature_flags` (org_id nullable, key, value)
- `billing_accounts` (org_id, provider, external_id, status) — schema-ready, unused in v1

### 12.2 Data relationship diagram (conceptual)

```text
organizations 1─┬─* organization_members *─1 profiles
                ├─* clients ─┬─* client_emergency_contacts
                │            └─* tasks (also linked to sessions/counselors)
                ├─* counselors
                ├─* appointments ─* sessions ─┬─1 session_notes_private
                │                             └─1 session_summaries_shared
                ├─* assessments ─* assessment_responses
                ├─* escalations ─1 safety_plans
                ├─* conversations ─* messages ─0..1 attachments
                └─* audit_log
```

### 12.3 RLS approach

- Every clinical table carries `org_id`; base policies scope by `EXISTS(SELECT 1 FROM organization_members om WHERE om.org_id = table.org_id AND om.user_id = auth.uid() AND om.status = 'active')`.
- Fine-grained rules via SECURITY DEFINER helpers: `has_role(uid, role, org_id)`, `has_permission(uid, perm, org_id)`, `is_assigned_counselor(uid, client_id)`.
- Task visibility: assignee OR creator OR org admin; client sees only own tasks where `is_client_visible = true`.
- Emergency contacts: client + assigned counselor + org admin; supervisors read supervisees only.
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated;` on every public-schema table; `service_role` for admin ops. No `anon` grants on clinical tables.

---

## 13. Security & Authorization Model

- **Auth**: Supabase Auth via Lovable Cloud. Email/password + Google OAuth (v1). MFA (TOTP) optional / mandatory admin. HIBP leaked-password check enabled.
- **Session**: JWT bearer; per-tab sign-out clears cache; token refresh via Supabase client.
- **AuthZ layers**:
  1. Router guards (protected route subtree)
  2. Server function middleware (`requireSupabaseAuth`)
  3. Postgres RLS (the ultimate boundary)
  4. Column-level encryption for high-sensitivity fields (national ID, phone, note bodies, emergency contact phone)
- **Secrets**: All keys in Lovable secrets (Airtel/M-Pesa, Resend, Daily.co, VAPID) — never in code.
- **Auditing**: Every clinical read/write goes through a helper that writes `audit_log`.
- **Transport**: HTTPS-only, HSTS, secure cookies, CSP.
- **Storage**: Signed URLs (short TTL) for attachments; private bucket per org path prefix.
- **Break-glass**: Not in v1. Platform Admin cannot read tenant clinical data.

---

## 14. Screen Inventory & Navigation

### 14.1 Public / auth
- `/` Marketing landing
- `/auth` Sign in / sign up / reset
- `/invite/:token` Accept invitation
- `/join/:code` Org join code (later)

### 14.2 Client (protected)
- `/app` Dashboard (next appointment, unread messages, **my tasks**, pending assessments)
- `/app/appointments`
- `/app/messages/:conversationId`
- `/app/assessments/:id`
- `/app/summary` Shared care plan
- `/app/tasks` **(NEW)** Own visible tasks
- `/app/profile` (includes emergency contacts editor)
- `/app/privacy` DSAR export / delete

### 14.3 Counselor (protected)
- `/app/schedule` Calendar
- `/app/clients` Caseload (filterable by case_status)
- `/app/clients/:id` Client 360 (tabs: overview, sessions, notes, summary, messages, assessments, escalations, **tasks**, **emergency contacts**)
- `/app/sessions/:id/note`
- `/app/messages`
- `/app/tasks` **(NEW)** My tasks (open/overdue/upcoming)
- `/app/escalations`
- `/app/availability`

### 14.4 Org Admin (protected)
- `/admin/dashboard` Analytics (includes case-status distribution + task heatmap)
- `/admin/users`
- `/admin/counselors`
- `/admin/settings` (branding, onboarding methods, retention, consent docs, task policy)
- `/admin/assessments`
- `/admin/audit-log`
- `/admin/billing` (later)

### 14.5 Platform Admin (protected)
- `/platform/orgs`
- `/platform/telemetry`
- `/platform/feature-flags`
- `/platform/billing`

### 14.6 Navigation model
Persistent left nav on desktop, bottom nav on mobile. Role-aware menu rendered from a permission-tagged config.

---

## 15. Notification Strategy

- **Channels v1**: Email (Resend/Postmark), Web Push (VAPID). Architected: SMS (Africa's Talking), WhatsApp Business.
- **Templates**: appointment_booked, appointment_reminder_24h, appointment_reminder_1h, appointment_cancelled, message_received, escalation_opened, assessment_assigned, consent_update_required, invitation_sent, account_activated, **task_assigned, task_due_soon, task_overdue, case_status_changed**.
- **Content policy**: Never expose clinical content in the payload — link back into the app.
- **Preferences**: Per-user per-template opt-out (mandatory: security, escalations).
- **Delivery**: Queue via server functions; retry with backoff; log to `notifications`.

---

## 16. System Architecture

### 16.1 Runtime
- **Frontend**: TanStack Start v1 (React 19), Vite 7, TailwindCSS v4, shadcn/ui.
- **Backend**: TanStack Start server functions on Cloudflare Worker runtime (Lovable default).
- **Data**: Lovable Cloud (Postgres + RLS + Auth + Storage + Realtime).
- **Async jobs**: `pg_cron` + edge-invoked server routes under `/api/public/cron/*` (signature-verified) for reminders, retention sweeps, task overdue scans.
- **Realtime**: Supabase Realtime channels for messaging + presence.
- **Media (later)**: Daily.co behind `session_media` adapter.
- **Payments (later)**: Airtel Money + M-Pesa Daraja via server functions; Stripe via `enable_stripe_payments` later.

### 16.2 Multi-tenancy
- Shared DB, RLS-isolated. `org_id` on every tenant row. Membership via `organization_members` + `has_role`.
- Enterprise dedicated-DB tier reserved as a future option.

### 16.3 High-level diagram

```text
 Browsers (Client / Counselor / Admin PWA)
        │  HTTPS
        ▼
 TanStack Start SSR + Server Functions (Cloudflare Worker)
        │
        ├── Supabase Auth (JWT, OAuth)
        ├── Postgres (RLS, pg_cron)
        ├── Storage (attachments, per-org prefix)
        ├── Realtime (messaging, presence)
        ├── Notification workers → Resend / Web Push (SMS/WA later)
        └── Media adapter → Daily.co (later)
```

### 16.4 Environments
- `dev` (Lovable preview), `staging`, `prod`. Separate Supabase projects; migrations promoted forward-only.

---

## 17. Design System Recommendations

- **Foundations**: Tailwind v4 tokens in `styles.css`; semantic color tokens (never hardcoded hex); Radix + shadcn/ui primitives.
- **Tone**: Calm, trustworthy, low-stimulation. Rounded 8–12px, generous spacing, muted accent.
- **Typography [R]**: `Inter` for UI; `Source Serif 4` for long-form notes/summaries.
- **Palette [R]**: Deep teal primary, warm sand neutral, restrained coral for alerts; case-status pills use distinct, colorblind-safe tokens.
- **Accessibility**: WCAG 2.1 AA; tested with axe + manual screen-reader.
- **Mobile-first**: All flows validated at 360×640.
- **Motion**: Reduced-motion respected; no autoplay video.

**[O]** Brand assets (logo, wordmark, product name) — pending.

---

## 18. Testing Strategy

- **Unit**: Vitest for pure logic (scoring, permission helpers, state machines, task/case-status transitions).
- **Component**: Testing Library on critical UI (booking, note editor, escalation, task list, emergency contact editor).
- **Integration**: Server-function tests hitting a test Supabase project; RLS assertion suite for every clinical table × every role (including tasks and emergency contacts).
- **E2E**: Playwright smoke journeys per persona (includes create-follow-up-task and case-closure flows).
- **Security testing**: Automated dependency scanning; quarterly RLS audit; annual pen test.
- **Accessibility**: axe-core in CI; manual audit per release.
- **Load [R]**: k6 baseline before enabling video.
- **Definition of Done**: unit + one integration + one E2E happy path + RLS test.

---

## 19. Deployment Strategy

- **Hosting**: Lovable platform (Cloudflare Worker runtime).
- **Migrations**: SQL migrations in repo; forward-only; every `CREATE TABLE public.*` includes GRANT + RLS + policies in the same migration.
- **Release cadence**: Continuous to `dev`; weekly to `staging`; fortnightly to `prod` during v1 stabilization.
- **Feature flags**: `feature_flags` table (per-org overrides) for staged rollouts (esp. video, tasks-client-visibility).
- **Backups**: Supabase daily backups + PITR; quarterly restore drill.
- **Incident response**: On-call rota, runbook, status page.
- **Data residency migration path**: Documented playbook to move a tenant to a regional Supabase project when contracted.

---

## 20. Product Roadmap

| Phase | Milestone | Contents |
|---|---|---|
| **P0 — Foundations** (Weeks 1–3) | Bootstrap | Design system, auth, org+user model, RLS harness, audit log |
| **P1 — MVP core** (Weeks 4–9) | Bookings, Notes, Tasks | Scheduling, sessions, private notes + shared summary, emergency contact, case status, **tasks & follow-ups**, messaging, notifications |
| **P2 — Clinical depth** (Weeks 10–13) | Assessments & Crisis | Assessments engine, PHQ-9/GAD-7, escalation workflow (uses emergency contact), safety plans, org analytics |
| **P3 — Onboarding breadth** (Weeks 14–16) | Roster & Access | CSV import, domain onboarding, join code/QR, SMS channel |
| **P4 — Live sessions** (Weeks 17–22) | Video/Voice | Daily.co integration, 1:1 voice/video, meeting rooms, screen share, in-session file share |
| **P5 — Groups & Billing** (Weeks 23–28) | Group sessions | Group counseling, org subscription billing (Airtel + M-Pesa), Stripe |
| **P6 — Enterprise** (later) | Scale | SSO (Google Workspace / Entra / SAML), regional hosting option, supervisor role formalisation |

---

## 21. Confirmed Requirements (roll-up)

- Multi-tenant, shared DB with Postgres RLS, `org_id` on every clinical row
- Roles: Platform Admin, Org Admin, Counselor, Client, Org Staff (Supervisor as permission)
- Compliance baseline: Kenya DPA 2019 (mandatory) + GDPR principles + HIPAA-inspired safeguards
- MVP: in-person scheduling, notes (private + shared summary), async messaging, assessments, crisis workflow, **emergency contacts**, **case status**, **tasks/follow-ups**, analytics, email + web push
- Notes: private counselor notes + client-visible shared summary
- Media provider architected: Daily.co, deferred implementation
- Onboarding: invite-only default; architecture supports domain, join code/QR, CSV, SSO
- Notifications: Email + Web Push in MVP
- Retention: 7 years default, per-org configurable
- Platform Admin: zero access to tenant clinical data
- Data residency: Lovable Cloud default now, regional option later
- Billing: org-level subscription architected (Airtel Money + M-Pesa first, Stripe later)

## 22. Open Questions

1. Product name & brand assets
2. Confirm Supervisor role formalisation for v1 or defer
3. Exact intake demographic fields (Kenya-appropriate; avoid over-collection)
4. Cancellation / no-show policy defaults
5. Messaging SLA defaults (e.g. 24h business-day?)
6. Retention exceptions per Kenyan statute
7. Consent document template: org-supplied or platform-provided library?
8. Recording policy for future video (never / opt-in / org-configurable)
9. Reporting fields required by university partners (need 1–2 discovery interviews)
10. Escalation on-call routing rules (round-robin vs designated crisis counselor)
_All previously open questions 11–12 are now confirmed — see §11a and §11b below._

## 11a. Task Reminder Cadence (Confirmed — BR-14)

**Confirmed default schedule** for every task with a due date:

| Trigger | Timing | Channel |
|---|---|---|
| Assignment | Immediately on task create/assign | Email + Web Push |
| Pre-due | 24 hours before `due_at` | Email + Web Push |
| Due day | On `due_at` date at 08:00 local org timezone | Email + Web Push |
| Overdue | Once daily at 08:00 local org timezone | Email + Web Push |
| Overdue cap | Stop after 7 consecutive overdue reminders | — |

Rules:
- Reminders suppress if task is marked `completed`, `cancelled`, or reassigned.
- Reminder content follows the "no clinical content in notifications" rule (task title must be non-clinical or a generic label).
- **Future (post-MVP):** Organization Administrators may customize the reminder schedule (offsets, times, channels, overdue cap) per organization. Data model must store schedule as a per-org configurable policy from day one, even though only the default is exposed in v1.

## 11b. Case Archival Policy (Confirmed — BR-15)

- Cases in `closed` status are **automatically archived after 12 months of inactivity** (no notes, messages, sessions, tasks, or status changes on the case).
- Archived cases:
  - Remain **searchable** by authorized counselors (org-scoped, RLS enforced).
  - Remain **restorable** to `closed` (or reopened to `active`) by counselors with appropriate permission.
  - Are visually distinguished in UI (archived badge, filtered out of default active lists).
- **No automatic deletion.** Organization retention policies (default 7 years, §17) continue to govern eventual purge.
- A nightly job scans for eligible cases; archival events are written to the audit log.

## 23. Recommendations to reconsider

- Add Supervisor role in v1
- Column-level encryption for note bodies + emergency-contact phone from day one
- Ship PWA installability in P1
- "No clinical content in notifications / client-visible task titles" lint rule
- Publish a Kenya-specific DPIA and privacy notice before first live university

---

## Appendix A — Change log

- **v1.0** — Initial approved specification; incorporated user additions:
  - Emergency Contact (FR-16, BR-11, new table `client_emergency_contacts`, permissions matrix entries, screen updates)
  - Case Status enum (FR-17, BR-12, added to `clients` table, permissions matrix entries, analytics)
  - Tasks & Follow-ups (FR-18, BR-13, new `tasks` table, dedicated screens for counselor + client, notification templates, roadmap moved into P1)
- **v1.1** — Closed remaining open questions:
  - Task reminder cadence confirmed (BR-14, §11a): immediate on assignment, 24h pre-due, due-day 08:00, daily overdue up to 7 days; org-customizable in future.
  - Case archival policy confirmed (BR-15, §11b): auto-archive after 12 months inactivity in `closed`; searchable + restorable; no auto-delete; retention still governed by §17.
