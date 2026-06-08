"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Application, Meeting, ApplicationStatus } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Video } from "lucide-react";

type AppWithProfile = Application & {
  profiles: { full_name: string; aub_email: string };
};

interface Props {
  application: AppWithProfile;
  meeting: Meeting | null;
}

export default function ActionPanel({ application, meeting: initMeeting }: Props) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [meeting, setMeeting] = useState<Meeting | null>(initMeeting);

  // UI state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Meeting form state (pre-fill from existing meeting)
  const initDate = initMeeting
    ? new Date(initMeeting.scheduled_at).toISOString().split("T")[0]
    : "";
  const initTime = initMeeting
    ? new Date(initMeeting.scheduled_at).toTimeString().slice(0, 5)
    : "";
  const [mDate, setMDate] = useState(initDate);
  const [mTime, setMTime] = useState(initTime);
  const [mLocation, setMLocation] = useState(initMeeting?.location ?? "");
  const [mLink, setMLink] = useState(initMeeting?.meeting_link ?? "");
  const [mError, setMError] = useState("");

  const router = useRouter();
  const supabase = createClient();

  function flash(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function patchStatus(next: ApplicationStatus) {
    const { error } = await supabase
      .from("applications")
      .update({ status: next })
      .eq("id", application.id);
    if (error) return false;
    setStatus(next);
    router.refresh();
    return true;
  }

  async function handleStatusUpdate(next: ApplicationStatus) {
    setLoading(next);
    const ok = await patchStatus(next);
    ok
      ? flash("success", "Status updated successfully.")
      : flash("error", "Failed to update status. Please try again.");
    setLoading(null);
    setShowRejectConfirm(false);
    setShowAcceptConfirm(false);
  }

  async function handleSendInvitation() {
    setMError("");
    if (!mDate || !mTime) {
      setMError("Please select a date and time.");
      return;
    }

    setLoading("meeting");
    const scheduledAt = new Date(`${mDate}T${mTime}`).toISOString();
    const payload = {
      application_id: application.id,
      scheduled_at: scheduledAt,
      location: mLocation.trim() || null,
      meeting_link: mLink.trim() || null,
      completed: false,
    };

    const result = meeting
      ? await supabase.from("meetings").update(payload).eq("id", meeting.id).select().single()
      : await supabase.from("meetings").insert(payload).select().single();

    if (result.error) {
      flash("error", "Failed to schedule meeting. Please try again.");
      setLoading(null);
      return;
    }

    setMeeting(result.data as Meeting);
    const ok = await patchStatus("meeting_invited");
    ok
      ? flash("success", "Meeting invitation sent.")
      : flash("error", "Meeting saved but status update failed.");
    setShowMeetingForm(false);
    setLoading(null);
  }

  async function handleMarkMeetingDone() {
    setLoading("done");
    if (meeting) {
      await supabase
        .from("meetings")
        .update({ completed: true })
        .eq("id", meeting.id);
    }
    const ok = await patchStatus("meeting_done");
    ok
      ? flash("success", "Meeting marked as completed.")
      : flash("error", "Failed to update status.");
    setLoading(null);
  }

  const isDecided = status === "accepted" || status === "rejected";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Header */}
      <div className="bg-burgundy px-6 py-5">
        <Link
          href="/professor"
          className="text-xs font-medium text-white/60 hover:text-white"
        >
          ← Back to Inbox
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Current Status
        </p>
        <div className="mt-1.5">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "mx-4 mt-4 rounded-lg border px-4 py-3 text-sm",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.msg}
        </div>
      )}

      <div className="space-y-3 p-5">
        {/* ── Submitted / Under Review ── */}
        {(status === "submitted" || status === "under_review") && (
          <>
            {status === "submitted" && (
              <button
                disabled={loading === "under_review"}
                onClick={() => handleStatusUpdate("under_review")}
                className="flex w-full items-center justify-center rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                {loading === "under_review" ? "Updating…" : "Mark as Under Review"}
              </button>
            )}

            {/* Invite to Meeting */}
            {!showMeetingForm ? (
              <button
                onClick={() => setShowMeetingForm(true)}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Invite to Meeting
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Schedule Interview
                </p>
                <Input
                  id="m-date"
                  label="Date"
                  type="date"
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                />
                <Input
                  id="m-time"
                  label="Time"
                  type="time"
                  value={mTime}
                  onChange={(e) => setMTime(e.target.value)}
                />
                <Input
                  id="m-loc"
                  label="Location"
                  type="text"
                  placeholder="e.g. West Hall 301"
                  value={mLocation}
                  onChange={(e) => setMLocation(e.target.value)}
                />
                <Input
                  id="m-link"
                  label="Video Link (optional)"
                  type="url"
                  placeholder="https://meet.google.com/…"
                  value={mLink}
                  onChange={(e) => setMLink(e.target.value)}
                />
                {mError && (
                  <p className="text-xs text-red-600">{mError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={loading === "meeting"}
                    onClick={handleSendInvitation}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading === "meeting" ? "Sending…" : "Send Invitation"}
                  </button>
                  <button
                    onClick={() => { setShowMeetingForm(false); setMError(""); }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reject */}
            {!showRejectConfirm ? (
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Reject Application
              </button>
            ) : (
              <ConfirmBox
                message="Reject this application? This cannot be undone."
                confirmLabel={loading === "rejected" ? "Rejecting…" : "Yes, Reject"}
                confirmClass="bg-red-600 hover:bg-red-700"
                disabled={loading === "rejected"}
                onConfirm={() => handleStatusUpdate("rejected")}
                onCancel={() => setShowRejectConfirm(false)}
              />
            )}
          </>
        )}

        {/* ── Meeting Invited / Done ── */}
        {(status === "meeting_invited" || status === "meeting_done") && (
          <>
            {meeting && <MeetingDetails meeting={meeting} />}

            {status === "meeting_invited" && (
              <button
                disabled={loading === "done"}
                onClick={handleMarkMeetingDone}
                className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {loading === "done" ? "Updating…" : "Mark Meeting as Completed"}
              </button>
            )}

            {/* Final Accept */}
            {!showAcceptConfirm ? (
              <button
                onClick={() => setShowAcceptConfirm(true)}
                className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Final Accept
              </button>
            ) : (
              <ConfirmBox
                message="Accept this applicant into the AUB Club?"
                confirmLabel={loading === "accepted" ? "Accepting…" : "Yes, Accept"}
                confirmClass="bg-green-600 hover:bg-green-700"
                disabled={loading === "accepted"}
                onConfirm={() => handleStatusUpdate("accepted")}
                onCancel={() => setShowAcceptConfirm(false)}
              />
            )}

            {/* Final Reject */}
            {!showRejectConfirm ? (
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Final Reject
              </button>
            ) : (
              <ConfirmBox
                message="Reject this application? This cannot be undone."
                confirmLabel={loading === "rejected" ? "Rejecting…" : "Yes, Reject"}
                confirmClass="bg-red-600 hover:bg-red-700"
                disabled={loading === "rejected"}
                onConfirm={() => handleStatusUpdate("rejected")}
                onCancel={() => setShowRejectConfirm(false)}
              />
            )}
          </>
        )}

        {/* ── Final decision banner ── */}
        {isDecided && (
          <div
            className={cn(
              "rounded-xl border px-4 py-4",
              status === "accepted"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
            )}
          >
            <p
              className={cn(
                "font-semibold",
                status === "accepted" ? "text-green-800" : "text-gray-700"
              )}
            >
              {status === "accepted" ? "🎉 Accepted" : "Application Rejected"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                status === "accepted" ? "text-green-700" : "text-gray-500"
              )}
            >
              {status === "accepted"
                ? "This student has been accepted into the club."
                : "No further actions are available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ConfirmBox({
  message,
  confirmLabel,
  confirmClass,
  disabled,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-700">{message}</p>
      <div className="flex gap-2">
        <button
          disabled={disabled}
          onClick={onConfirm}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors disabled:opacity-50",
            confirmClass
          )}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MeetingDetails({ meeting }: { meeting: Meeting }) {
  const date = new Date(meeting.scheduled_at);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        Scheduled Interview
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
        {dateStr}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Clock className="h-4 w-4 shrink-0 text-blue-500" />
        {timeStr}
      </div>
      {meeting.location && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
          {meeting.location}
        </div>
      )}
      {meeting.meeting_link && (
        <div className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 shrink-0 text-blue-500" />
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline-offset-2 hover:underline"
          >
            Join Video Call
          </a>
        </div>
      )}
    </div>
  );
}
