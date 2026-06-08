"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types";

type ActionResult = { success: true } | { error: string };

async function getProfessorAdminClient() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "You must be signed in to perform this action.",
    } as const;
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "professor") {
    return {
      authorized: false,
      error: "You are not authorized to perform this action.",
    } as const;
  }

  return { authorized: true, admin } as const;
}

function refreshApplication(applicationId: string) {
  revalidatePath("/professor");
  revalidatePath(`/professor/applications/${applicationId}`);
}

async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<ActionResult> {
  const auth = await getProfessorAdminClient();
  if (!auth.authorized) return { error: auth.error };

  const { error } = await auth.admin
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to update application ${applicationId}:`, error);
    return { error: "Failed to update the application." };
  }

  refreshApplication(applicationId);
  return { success: true };
}

export async function scheduleInterview(
  applicationId: string,
  date: string,
  time: string,
  location: string,
  meetingLink: string
): Promise<ActionResult> {
  const auth = await getProfessorAdminClient();
  if (!auth.authorized) return { error: auth.error };

  const scheduledAt = new Date(`${date}T${time}`);
  if (!applicationId || !date || !time || Number.isNaN(scheduledAt.getTime())) {
    return { error: "Please provide a valid interview date and time." };
  }

  const payload = {
    application_id: applicationId,
    scheduled_at: scheduledAt.toISOString(),
    location: location.trim() || null,
    meeting_link: meetingLink.trim() || null,
    completed: false,
  };

  const { data: existingMeeting, error: lookupError } = await auth.admin
    .from("meetings")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (lookupError) {
    console.error(`Failed to find meeting for application ${applicationId}:`, lookupError);
    return { error: "Failed to schedule the interview." };
  }

  const meetingResult = existingMeeting
    ? await auth.admin
        .from("meetings")
        .update(payload)
        .eq("id", existingMeeting.id)
        .select("id")
        .single()
    : await auth.admin.from("meetings").insert(payload).select("id").single();

  if (meetingResult.error) {
    console.error(
      `Failed to save meeting for application ${applicationId}:`,
      meetingResult.error
    );
    return { error: "Failed to schedule the interview." };
  }

  const { error: statusError } = await auth.admin
    .from("applications")
    .update({ status: "meeting_invited" satisfies ApplicationStatus })
    .eq("id", applicationId)
    .select("id")
    .single();

  if (statusError) {
    console.error(`Failed to update application ${applicationId}:`, statusError);
    return { error: "The meeting was saved, but the application status was not updated." };
  }

  refreshApplication(applicationId);
  return { success: true };
}

export async function rejectApplication(applicationId: string): Promise<ActionResult> {
  return updateApplicationStatus(applicationId, "rejected");
}

export async function markUnderReview(applicationId: string): Promise<ActionResult> {
  return updateApplicationStatus(applicationId, "under_review");
}

export async function markMeetingDone(applicationId: string): Promise<ActionResult> {
  const auth = await getProfessorAdminClient();
  if (!auth.authorized) return { error: auth.error };

  const { data: meeting, error: meetingError } = await auth.admin
    .from("meetings")
    .update({ completed: true })
    .eq("application_id", applicationId)
    .select("id")
    .maybeSingle();

  if (meetingError || !meeting) {
    if (meetingError) {
      console.error(
        `Failed to complete meeting for application ${applicationId}:`,
        meetingError
      );
    }
    return { error: "Failed to mark the meeting as completed." };
  }

  const { error: statusError } = await auth.admin
    .from("applications")
    .update({ status: "meeting_done" satisfies ApplicationStatus })
    .eq("id", applicationId)
    .select("id")
    .single();

  if (statusError) {
    console.error(`Failed to update application ${applicationId}:`, statusError);
    return { error: "The meeting was completed, but the application status was not updated." };
  }

  refreshApplication(applicationId);
  return { success: true };
}

export async function finalAccept(applicationId: string): Promise<ActionResult> {
  return updateApplicationStatus(applicationId, "accepted");
}

export async function finalReject(applicationId: string): Promise<ActionResult> {
  return updateApplicationStatus(applicationId, "rejected");
}
