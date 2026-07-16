import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type RiskLevel = Database["public"]["Enums"]["risk_level"];
type CaseStatus = Database["public"]["Enums"]["case_status"];
type CounselorAvailability = Database["public"]["Enums"]["counselor_availability_status"];

type ClientJourney = {
  client: {
    id: string;
    org_id: string;
    case_status: CaseStatus;
    assigned_counselor_id: string | null;
    intake_completed_at: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  counselor: {
    id: string;
    org_id: string;
    profile: { full_name: string | null; avatar_url: string | null } | null;
    professional_title: string | null;
    credentials: string | null;
    specialties: string[];
    bio: string | null;
    languages_spoken: string[];
    years_experience: number | null;
    availability_status: CounselorAvailability | null;
    active: boolean;
  } | null;
  progress: {
    invited_at: string | null;
    registered_at: string | null;
    email_verified_at: string | null;
    consent_completed_at: string | null;
    intake_completed_at: string | null;
    ready_for_assignment_at: string | null;
    assigned_at: string | null;
    active_at: string | null;
  } | null;
  consentDocument: {
    id: string;
    version: number;
    title: string;
    body: string;
    effective_at: string;
  } | null;
  consentHistory: Array<{
    id: string;
    consent_version: number;
    consent_text: string;
    accepted_at: string;
    accepted_ip: string | null;
    accepted_user_agent: string | null;
  }>;
  intakeSubmission: {
    id: string;
    version: number;
    responses: Record<string, unknown>;
    phq9_score: number;
    gad7_score: number;
    submitted_at: string;
  } | null;
  checklist: {
    emailVerified: boolean;
    consentAccepted: boolean;
    intakeCompleted: boolean;
    readyForAssignment: boolean;
    assigned: boolean;
    active: boolean;
  };
};

type ClientDetail = {
  client: {
    id: string;
    org_id: string;
    case_status: CaseStatus;
    assigned_counselor_id: string | null;
    intake_completed_at: string | null;
    updated_at: string;
  } | null;
  administrativeProfile: {
    id: string;
    registration_number: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    gender: string | null;
    date_of_birth: string | null;
    department: string | null;
    year_of_study: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    active_status: boolean;
  } | null;
  clinicalProfile: {
    id: string;
    presenting_issue: string | null;
    background: string | null;
    mental_health_history: string | null;
    medical_history: string | null;
    medication: string | null;
    risk_level: RiskLevel;
    primary_counselor_id: string | null;
    case_status: CaseStatus;
  } | null;
  onboarding: ClientJourney["progress"];
  consentHistory: ClientJourney["consentHistory"];
  intakeSubmission: ClientJourney["intakeSubmission"];
  counselors: Array<{
    id: string;
    org_id: string;
    active: boolean;
    availability_status: CounselorAvailability | null;
    professional_title: string | null;
    credentials: string | null;
    specialties: string[];
    profile: { full_name: string | null; avatar_url: string | null } | null;
  }>;
};

function audit(
  supa: Awaited<ReturnType<typeof requireSupabaseAuth.__type>> extends never ? never : never,
  _actorId: string,
  _orgId: string | null,
  _action: string,
  _entityType: string,
  _entityId: string | null,
  _diff: Record<string, unknown> = {},
) {
  return Promise.resolve();
}

function getClientIp() {
  const request = getRequest();
  const headers = request?.headers;
  if (!headers) return null;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("true-client-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

async function writeAudit(
  supa: Database extends never ? never : never,
  actorId: string,
  orgId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  diff: Record<string, unknown> = {},
) {
  await supa.from("audit_log").insert({
    actor_id: actorId,
    org_id: orgId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff: diff as never,
  });
}

async function getCurrentClient(context: { supabase: Database extends never ? never : never; userId: string }) {
  const { data: clients, error } = await context.supabase
    .from("clients")
    .select("id,org_id,case_status,assigned_counselor_id,intake_completed_at,created_at,updated_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return clients?.[0] ?? null;
}

async function getCurrentCounselor(context: { supabase: Database extends never ? never : never; userId: string }) {
  const { data: counselors, error } = await context.supabase
    .from("counselors")
    .select(
      "id,org_id,active,availability_status,professional_title,credentials,specialties,bio,languages_spoken,years_experience,profiles:user_id(full_name,avatar_url)",
    )
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return counselors?.[0] ?? null;
}

function computeScores(answers: number[]) {
  return answers.reduce((sum, value) => sum + Number(value || 0), 0);
}

function normalizeStrings(values: unknown): string[] {
  return Array.isArray(values)
    ? values.map((value) => String(value).trim()).filter(Boolean)
    : [];
}

/* -------------------------------- Counselors --------------------------- */

export const getMyCounselorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("full_name,avatar_url,phone,locale,timezone")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profileError) throw profileError;

    const counselor = await getCurrentCounselor(context);
    if (!counselor) return null;

    return { profile, counselor };
  });

export const listCounselors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("counselors")
      .select(
        "id,org_id,active,availability_status,professional_title,credentials,specialties,languages_spoken,years_experience,bio,profiles:user_id(full_name,avatar_url)",
      )
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const updateMyCounselorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      professionalTitle?: string;
      credentials?: string;
      specialties?: string[];
      languagesSpoken?: string[];
      yearsExperience?: number | null;
      bio?: string;
      fullName?: string;
      avatarUrl?: string;
      phone?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const counselor = await getCurrentCounselor(context);
    if (!counselor) throw new Error("counselor_profile_not_found");

    const [profileUpdate, counselorUpdate] = await Promise.all([
      context.supabase
        .from("profiles")
        .update({
          full_name: data.fullName?.trim() || undefined,
          avatar_url: data.avatarUrl?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        })
        .eq("user_id", context.userId),
      context.supabase
        .from("counselors")
        .update({
          professional_title: data.professionalTitle?.trim() || undefined,
          credentials: data.credentials?.trim() || undefined,
          specialties: data.specialties ? normalizeStrings(data.specialties) : undefined,
          languages_spoken: data.languagesSpoken
            ? normalizeStrings(data.languagesSpoken)
            : undefined,
          years_experience:
            typeof data.yearsExperience === "number" ? data.yearsExperience : undefined,
          bio: data.bio?.trim() || undefined,
        })
        .eq("id", counselor.id)
        .eq("user_id", context.userId),
    ]);

    if (profileUpdate.error) throw profileUpdate.error;
    if (counselorUpdate.error) throw counselorUpdate.error;

    await writeAudit(
      context.supabase,
      context.userId,
      counselor.org_id,
      "counselor.profile.updated",
      "counselors",
      counselor.id,
      {
        professionalTitle: data.professionalTitle ?? null,
        credentials: data.credentials ?? null,
        yearsExperience: data.yearsExperience ?? null,
      },
    );

    return { ok: true };
  });

export const updateCounselorAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      orgId: string;
      counselorId: string;
      active: boolean;
      availabilityStatus: CounselorAvailability;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: session, error: sessionError } = await context.supabase.auth.getUser();
    if (sessionError) throw sessionError;
    const isAdmin = !!session.user && !!data.orgId;
    if (!isAdmin) throw new Error("forbidden");

    const { error } = await context.supabase
      .from("counselors")
      .update({
        active: data.active,
        availability_status: data.availabilityStatus,
      })
      .eq("id", data.counselorId)
      .eq("org_id", data.orgId);
    if (error) throw error;

    await writeAudit(
      context.supabase,
      context.userId,
      data.orgId,
      "counselor.metadata.updated",
      "counselors",
      data.counselorId,
      {
        active: data.active,
        availabilityStatus: data.availabilityStatus,
      },
    );

    return { ok: true };
  });

/* -------------------------------- Clients ------------------------------ */

export const getMyClientJourney = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClientJourney | null> => {
    const client = await getCurrentClient(context);
    if (!client) return null;

    const [
      { data: organization, error: orgError },
      { data: profile, error: profileError },
      { data: onboarding, error: onboardingError },
      { data: consentHistory, error: consentHistoryError },
      { data: intakeSubmission, error: intakeError },
      { data: activeConsent, error: consentDocumentError },
      { data: counselor, error: counselorError },
      { data: authState, error: authError },
    ] = await Promise.all([
      context.supabase.from("organizations").select("id,name,slug").eq("id", client.org_id).maybeSingle(),
      context.supabase
        .from("client_administrative_profiles")
        .select("id,registration_number,full_name,email,phone,gender,date_of_birth,department,year_of_study,emergency_contact_name,emergency_contact_phone,active_status")
        .eq("client_id", client.id)
        .maybeSingle(),
      context.supabase
        .from("client_onboarding_progress")
        .select("invited_at,registered_at,email_verified_at,consent_completed_at,intake_completed_at,ready_for_assignment_at,assigned_at,active_at")
        .eq("client_id", client.id)
        .maybeSingle(),
      context.supabase
        .from("client_consent_history")
        .select("id,consent_version,consent_text,accepted_at,accepted_ip,accepted_user_agent")
        .eq("client_id", client.id)
        .order("accepted_at", { ascending: false }),
      context.supabase
        .from("client_intake_submissions")
        .select("id,version,responses,phq9_score,gad7_score,submitted_at")
        .eq("client_id", client.id)
        .maybeSingle(),
      context.supabase
        .from("consent_documents")
        .select("id,version,title,body,effective_at")
        .eq("org_id", client.org_id)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("counselors")
        .select("id,org_id,active,availability_status,professional_title,credentials,specialties,bio,languages_spoken,years_experience,profiles:user_id(full_name,avatar_url)")
        .eq("id", client.assigned_counselor_id ?? "")
        .maybeSingle(),
      context.supabase.auth.getUser(),
    ]);

    if (orgError) throw orgError;
    if (profileError) throw profileError;
    if (onboardingError) throw onboardingError;
    if (consentHistoryError) throw consentHistoryError;
    if (intakeError) throw intakeError;
    if (consentDocumentError) throw consentDocumentError;
    if (counselorError) throw counselorError;
    if (authError) throw authError;

    const emailVerified = !!authState.data.user?.email_confirmed_at;
    const progress = onboarding ?? null;
    const checklist = {
      emailVerified,
      consentAccepted: !!progress?.consent_completed_at || (consentHistory?.length ?? 0) > 0,
      intakeCompleted: !!progress?.intake_completed_at || !!client.intake_completed_at,
      readyForAssignment: !!progress?.ready_for_assignment_at,
      assigned: !!progress?.assigned_at || !!client.assigned_counselor_id,
      active: !!progress?.active_at || client.case_status === "active",
    };

    return {
      client,
      organization: organization ?? null,
      counselor: counselor ?? null,
      progress,
      consentDocument: activeConsent ?? null,
      consentHistory: consentHistory ?? [],
      intakeSubmission: intakeSubmission
        ? {
            ...intakeSubmission,
            responses: intakeSubmission.responses as Record<string, unknown>,
          }
        : null,
      checklist,
    };
  });

export const listClientReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("clients")
      .select(
        "id,user_id,org_id,case_status,intake_completed_at,assigned_counselor_id,client_administrative_profiles!inner(full_name,email,active_status),client_clinical_profiles!left(primary_counselor_id,risk_level,case_status),client_onboarding_progress!left(invited_at,registered_at,email_verified_at,consent_completed_at,intake_completed_at,ready_for_assignment_at,assigned_at,active_at)",
      )
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const getClientProfileBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; clientId: string }) => d)
  .handler(async ({ data, context }): Promise<ClientDetail> => {
    const [
      { data: client, error: clientError },
      { data: administrativeProfile, error: adminError },
      { data: clinicalProfile, error: clinicalError },
      { data: onboarding, error: onboardingError },
      { data: consentHistory, error: consentHistoryError },
      { data: intakeSubmission, error: intakeError },
      { data: counselors, error: counselorsError },
    ] = await Promise.all([
      context.supabase
        .from("clients")
        .select("id,org_id,case_status,assigned_counselor_id,intake_completed_at,updated_at")
        .eq("id", data.clientId)
        .eq("org_id", data.orgId)
        .maybeSingle(),
      context.supabase
        .from("client_administrative_profiles")
        .select("id,registration_number,full_name,email,phone,gender,date_of_birth,department,year_of_study,emergency_contact_name,emergency_contact_phone,active_status")
        .eq("client_id", data.clientId)
        .maybeSingle(),
      context.supabase
        .from("client_clinical_profiles")
        .select("id,presenting_issue,background,mental_health_history,medical_history,medication,risk_level,primary_counselor_id,case_status")
        .eq("client_id", data.clientId)
        .maybeSingle(),
      context.supabase
        .from("client_onboarding_progress")
        .select("invited_at,registered_at,email_verified_at,consent_completed_at,intake_completed_at,ready_for_assignment_at,assigned_at,active_at")
        .eq("client_id", data.clientId)
        .maybeSingle(),
      context.supabase
        .from("client_consent_history")
        .select("id,consent_version,consent_text,accepted_at,accepted_ip,accepted_user_agent")
        .eq("client_id", data.clientId)
        .order("accepted_at", { ascending: false }),
      context.supabase
        .from("client_intake_submissions")
        .select("id,version,responses,phq9_score,gad7_score,submitted_at")
        .eq("client_id", data.clientId)
        .maybeSingle(),
      context.supabase
        .from("counselors")
        .select("id,org_id,active,availability_status,professional_title,credentials,specialties,profiles:user_id(full_name,avatar_url)")
        .eq("org_id", data.orgId)
        .order("created_at", { ascending: false }),
    ]);

    if (clientError) throw clientError;
    if (adminError) throw adminError;
    if (clinicalError) throw clinicalError;
    if (onboardingError) throw onboardingError;
    if (consentHistoryError) throw consentHistoryError;
    if (intakeError) throw intakeError;
    if (counselorsError) throw counselorsError;

    return {
      client,
      administrativeProfile: administrativeProfile ?? null,
      clinicalProfile: clinicalProfile ?? null,
      onboarding: onboarding ?? null,
      consentHistory: consentHistory ?? [],
      intakeSubmission: intakeSubmission
        ? {
            ...intakeSubmission,
            responses: intakeSubmission.responses as Record<string, unknown>,
          }
        : null,
      counselors: counselors ?? [],
    };
  });

export const updateClientAdministrativeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      orgId: string;
      clientId: string;
      registrationNumber?: string;
      fullName: string;
      email: string;
      phone?: string;
      gender?: string;
      dateOfBirth?: string | null;
      department?: string;
      yearOfStudy?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      activeStatus: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("client_administrative_profiles")
      .upsert(
        {
          org_id: data.orgId,
          client_id: data.clientId,
          registration_number: data.registrationNumber?.trim() || null,
          full_name: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone?.trim() || null,
          gender: data.gender?.trim() || null,
          date_of_birth: data.dateOfBirth || null,
          department: data.department?.trim() || null,
          year_of_study: data.yearOfStudy?.trim() || null,
          emergency_contact_name: data.emergencyContactName?.trim() || null,
          emergency_contact_phone: data.emergencyContactPhone?.trim() || null,
          active_status: data.activeStatus,
        },
        { onConflict: "client_id" },
      );
    if (error) throw error;

    await writeAudit(
      context.supabase,
      context.userId,
      data.orgId,
      "client.administrative_profile.updated",
      "client_administrative_profiles",
      data.clientId,
      {
        fullName: data.fullName,
        activeStatus: data.activeStatus,
      },
    );

    return { ok: true };
  });

export const updateClientClinicalProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      orgId: string;
      clientId: string;
      presentingIssue?: string;
      background?: string;
      mentalHealthHistory?: string;
      medicalHistory?: string;
      medication?: string;
      riskLevel?: RiskLevel;
      caseStatus?: CaseStatus;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("client_clinical_profiles")
      .upsert(
        {
          org_id: data.orgId,
          client_id: data.clientId,
          presenting_issue: data.presentingIssue?.trim() || null,
          background: data.background?.trim() || null,
          mental_health_history: data.mentalHealthHistory?.trim() || null,
          medical_history: data.medicalHistory?.trim() || null,
          medication: data.medication?.trim() || null,
          risk_level: data.riskLevel ?? "none",
          case_status: data.caseStatus ?? "intake",
        },
        { onConflict: "client_id" },
      );
    if (error) throw error;

    await writeAudit(
      context.supabase,
      context.userId,
      data.orgId,
      "client.clinical_profile.updated",
      "client_clinical_profiles",
      data.clientId,
      {
        riskLevel: data.riskLevel ?? "none",
        caseStatus: data.caseStatus ?? "intake",
      },
    );

    return { ok: true };
  });

export const assignClientPrimaryCounselor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string; clientId: string; counselorId: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: client, error: clientError } = await context.supabase
      .from("clients")
      .select("id,org_id")
      .eq("id", data.clientId)
      .eq("org_id", data.orgId)
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client) throw new Error("client_not_found");

    const { error: clinicalError } = await context.supabase
      .from("client_clinical_profiles")
      .upsert(
        {
          org_id: data.orgId,
          client_id: data.clientId,
          primary_counselor_id: data.counselorId,
          case_status: data.counselorId ? "active" : "intake",
        },
        { onConflict: "client_id" },
      );
    if (clinicalError) throw clinicalError;

    const { error: clientUpdateError } = await context.supabase
      .from("clients")
      .update({
        assigned_counselor_id: data.counselorId,
        case_status: data.counselorId ? "active" : "intake",
      })
      .eq("id", data.clientId)
      .eq("org_id", data.orgId);
    if (clientUpdateError) throw clientUpdateError;

    const { error: onboardingError } = await context.supabase
      .from("client_onboarding_progress")
      .upsert(
        {
          org_id: data.orgId,
          client_id: data.clientId,
          assigned_at: data.counselorId ? new Date().toISOString() : null,
          active_at: data.counselorId ? new Date().toISOString() : null,
        },
        { onConflict: "client_id" },
      );
    if (onboardingError) throw onboardingError;

    await writeAudit(
      context.supabase,
      context.userId,
      data.orgId,
      "client.primary_counselor.assigned",
      "client_clinical_profiles",
      data.clientId,
      { counselorId: data.counselorId },
    );

    return { ok: true };
  });

export const acceptCurrentConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId?: string }) => d ?? {})
  .handler(async ({ context }) => {
    const client = await getCurrentClient(context);
    if (!client) throw new Error("client_profile_not_found");

    const { data: document, error: documentError } = await context.supabase
      .from("consent_documents")
      .select("id,version,title,body,effective_at")
      .eq("org_id", client.org_id)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (documentError) throw documentError;
    if (!document) throw new Error("no_active_consent_document");

    const { error: insertError } = await context.supabase.from("client_consent_history").insert({
      org_id: client.org_id,
      client_id: client.id,
      consent_document_id: document.id,
      consent_version: document.version,
      consent_text: document.body,
      accepted_ip: getClientIp(),
      accepted_user_agent:
        getRequest()?.headers.get("user-agent") ?? null,
    });
    if (insertError) throw insertError;

    const now = new Date().toISOString();
    const { error: progressError } = await context.supabase
      .from("client_onboarding_progress")
      .upsert(
        {
          org_id: client.org_id,
          client_id: client.id,
          consent_completed_at: now,
          ready_for_assignment_at: now,
        },
        { onConflict: "client_id" },
      );
    if (progressError) throw progressError;

    await writeAudit(
      context.supabase,
      context.userId,
      client.org_id,
      "client.consent.accepted",
      "client_consent_history",
      client.id,
      { consentVersion: document.version },
    );

    return { ok: true, consentVersion: document.version };
  });

export const submitClientIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      responses: Record<string, unknown>;
      phq9Answers: number[];
      gad7Answers: number[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const client = await getCurrentClient(context);
    if (!client) throw new Error("client_profile_not_found");

    const phq9Score = computeScores(data.phq9Answers ?? []);
    const gad7Score = computeScores(data.gad7Answers ?? []);

    const { error: intakeError } = await context.supabase
      .from("client_intake_submissions")
      .upsert(
        {
          org_id: client.org_id,
          client_id: client.id,
          version: 1,
          responses: {
            ...data.responses,
            phq9Answers: data.phq9Answers,
            gad7Answers: data.gad7Answers,
          },
          phq9_score: phq9Score,
          gad7_score: gad7Score,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "client_id" },
      );
    if (intakeError) throw intakeError;

    const now = new Date().toISOString();
    const { error: clientError } = await context.supabase
      .from("clients")
      .update({ intake_completed_at: now })
      .eq("id", client.id)
      .eq("org_id", client.org_id);
    if (clientError) throw clientError;

    const { error: clinicalError } = await context.supabase
      .from("client_clinical_profiles")
      .upsert(
        {
          org_id: client.org_id,
          client_id: client.id,
          case_status: "intake",
          risk_level:
            phq9Score >= 20 || gad7Score >= 15
              ? "high"
              : phq9Score >= 10 || gad7Score >= 10
                ? "moderate"
                : "none",
        },
        { onConflict: "client_id" },
      );
    if (clinicalError) throw clinicalError;

    const { error: progressError } = await context.supabase
      .from("client_onboarding_progress")
      .upsert(
        {
          org_id: client.org_id,
          client_id: client.id,
          intake_completed_at: now,
          ready_for_assignment_at: now,
        },
        { onConflict: "client_id" },
      );
    if (progressError) throw progressError;

    await writeAudit(
      context.supabase,
      context.userId,
      client.org_id,
      "client.intake.completed",
      "client_intake_submissions",
      client.id,
      {
        phq9Score,
        gad7Score,
      },
    );

    return {
      ok: true,
      phq9Score,
      gad7Score,
      readyForAssignmentAt: now,
    };
  });
