"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Application, Meeting, ApplicationStatus } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import {
  finalAccept,
  finalReject,
  markMeetingDone,
  markUnderReview,
  rejectApplication,
  scheduleInterview,
} from "./actions";

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

  function flash(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleStatusUpdate(
    next: ApplicationStatus,
    action: (applicationId: string) => Promise<{ success: true } | { error: string }>
  ) {
    setLoading(next);
    const result = await action(application.id);
    if ("error" in result) {
      flash("error", result.error);
    } else {
      setStatus(next);
      flash("success", "Status updated successfully.");
      router.refresh();
    }
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
    const result = await scheduleInterview(
      application.id,
      mDate,
      mTime,
      mLocation,
      mLink
    );

    if ("error" in result) {
      flash("error", result.error);
      setLoading(null);
      return;
    }

    setMeeting({
      id: meeting?.id ?? "",
      application_id: application.id,
      scheduled_at: scheduledAt,
      location: mLocation.trim() || null,
      meeting_link: mLink.trim() || null,
      notes: meeting?.notes ?? null,
      completed: false,
    });
    setStatus("meeting_invited");
    flash("success", "Meeting invitation sent.");
    setShowMeetingForm(false);
    setLoading(null);
    router.refresh();
  }

  async function handleMarkMeetingDone() {
    setLoading("done");
    const result = await markMeetingDone(application.id);
    if ("error" in result) {
      flash("error", result.error);
    } else {
      setMeeting((current) =>
        current ? { ...current, completed: true } : current
      );
      setStatus("meeting_done");
      flash("success", "Meeting marked as completed.");
      router.refresh();
    }
    setLoading(null);
  }

  const isDecided = status === "accepted" || status === "rejected";

  return (
    <div className="overflow-hidden border border-aub-line bg-white shadow-sm">
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
                onClick={() => handleStatusUpdate("under_review", markUnderReview)}
                className="flex w-full items-center justify-center rounded bg-aub-muted px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-aub-ink disabled:opacity-50"
              >
                {loading === "under_review" ? "Updating…" : "Mark as Under Review"}
              </button>
            )}

            {/* Invite to Meeting */}
            {!showMeetingForm ? (
              <button
                onClick={() => setShowMeetingForm(true)}
                className="flex w-full items-center justify-center rounded bg-bliss-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Invite to Meeting
              </button>
            ) : (
              <div className="space-y-3 border border-aub-line bg-aub-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-burgundy">
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
                    className="flex-1 rounded bg-burgundy py-2 text-sm font-semibold text-white hover:bg-burgundy-dark disabled:opacity-50"
                  >
                    {loading === "meeting" ? "Sending…" : "Send Invitation"}
                  </button>
                  <button
                    onClick={() => { setShowMeetingForm(false); setMError(""); }}
                    className="rounded border border-aub-line px-3 py-2 text-sm text-aub-muted hover:bg-aub-panel"
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
                className="flex w-full items-center justify-center rounded bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                Reject Application
              </button>
            ) : (
              <ConfirmBox
                message="Reject this application? This cannot be undone."
                confirmLabel={loading === "rejected" ? "Rejecting…" : "Yes, Reject"}
                confirmClass="bg-red-600 hover:bg-red-700"
                disabled={loading === "rejected"}
                onConfirm={() => handleStatusUpdate("rejected", rejectApplication)}
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
                className="flex w-full items-center justify-center rounded bg-bliss-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading === "done" ? "Updating…" : "Mark Meeting as Completed"}
              </button>
            )}

            {/* Final Accept */}
            {!showAcceptConfirm ? (
              <button
                onClick={() => setShowAcceptConfirm(true)}
                className="flex w-full items-center justify-center rounded bg-burgundy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-burgundy-dark"
              >
                Final Accept
              </button>
            ) : (
              <ConfirmBox
                message="Accept this applicant into the AUB Club?"
                confirmLabel={loading === "accepted" ? "Accepting…" : "Yes, Accept"}
                confirmClass="bg-green-600 hover:bg-green-700"
                disabled={loading === "accepted"}
                onConfirm={() => handleStatusUpdate("accepted", finalAccept)}
                onCancel={() => setShowAcceptConfirm(false)}
              />
            )}

            {/* Final Reject */}
            {!showRejectConfirm ? (
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="flex w-full items-center justify-center rounded bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                Final Reject
              </button>
            ) : (
              <ConfirmBox
                message="Reject this application? This cannot be undone."
                confirmLabel={loading === "rejected" ? "Rejecting…" : "Yes, Reject"}
                confirmClass="bg-red-600 hover:bg-red-700"
                disabled={loading === "rejected"}
                onConfirm={() => handleStatusUpdate("rejected", finalReject)}
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
    <div className="space-y-3 border border-aub-line bg-aub-soft p-4">
      <p className="text-sm text-aub-muted">{message}</p>
      <div className="flex gap-2">
        <button
          disabled={disabled}
          onClick={onConfirm}
          className={cn(
            "flex-1 rounded py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50",
            confirmClass
          )}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-aub-line px-3 py-2 text-sm text-aub-muted hover:bg-aub-panel"
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
    <div className="space-y-2 border border-aub-line bg-aub-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-burgundy">
        Scheduled Interview
      </p>
      <div className="flex items-center gap-2 text-sm text-aub-muted">
        <Calendar className="h-4 w-4 shrink-0 text-burgundy" />
        {dateStr}
      </div>
      <div className="flex items-center gap-2 text-sm text-aub-muted">
        <Clock className="h-4 w-4 shrink-0 text-burgundy" />
        {timeStr}
      </div>
      {meeting.location && (
        <div className="flex items-center gap-2 text-sm text-aub-muted">
          <MapPin className="h-4 w-4 shrink-0 text-burgundy" />
          {meeting.location}
        </div>
      )}
      {meeting.meeting_link && (
        <div className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 shrink-0 text-burgundy" />
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy underline-offset-2 hover:underline"
          >
            Join Video Call
          </a>
        </div>
      )}
    </div>
  );
}
