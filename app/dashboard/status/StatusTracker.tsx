"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus, Meeting } from "@/types";
import { cn } from "@/lib/utils";
import { Check, Calendar, Clock, MapPin, Video } from "lucide-react";

interface Props {
  application: Application;
  meeting: Meeting | null;
}

const STAGES = [
  {
    key: "submitted",
    label: "Application Submitted",
    description: "Your application has been received and is awaiting review.",
  },
  {
    key: "under_review",
    label: "Under Review",
    description: "Our faculty advisors are carefully reviewing your application.",
  },
  {
    key: "meeting_invited",
    label: "Interview Invited",
    description: "You have been selected for an interview.",
  },
  {
    key: "meeting_done",
    label: "Interview Completed",
    description: "Your interview has been completed successfully.",
  },
  {
    key: "decision",
    label: "Final Decision",
    description: "A final decision has been made on your application.",
  },
] as const;

const STATUS_TO_STAGE: Record<ApplicationStatus, number> = {
  submitted: 0,
  under_review: 1,
  meeting_invited: 2,
  meeting_done: 3,
  accepted: 4,
  rejected: 4,
};

function isMeetingVisible(status: ApplicationStatus) {
  return (
    status === "meeting_invited" ||
    status === "meeting_done" ||
    status === "accepted" ||
    status === "rejected"
  );
}

export default function StatusTracker({ application, meeting: initialMeeting }: Props) {
  const [app, setApp] = useState<Application>(application);
  const [meeting, setMeeting] = useState<Meeting | null>(initialMeeting);
  const supabase = createClient();

  const currentIndex = STATUS_TO_STAGE[app.status];
  const isDecided = app.status === "accepted" || app.status === "rejected";

  // Realtime: subscribe to application updates and meeting inserts/updates.
  // Requires realtime to be enabled on these tables in Supabase Dashboard →
  // Database → Replication.
  useEffect(() => {
    const channel = supabase
      .channel(`status-${app.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `id=eq.${app.id}`,
        },
        (payload) => {
          setApp((prev) => ({ ...prev, ...(payload.new as Application) }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meetings",
          filter: `application_id=eq.${app.id}`,
        },
        (payload) => {
          setMeeting(payload.new as Meeting);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `application_id=eq.${app.id}`,
        },
        (payload) => {
          setMeeting(payload.new as Meeting);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [app.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Main card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="bg-burgundy px-8 py-6">
          <h1 className="text-xl font-bold text-white">Application Status</h1>
          <p className="mt-1 text-sm text-white/70">
            AUB Club Membership — 2025–2026
          </p>
        </div>

        {/* Timeline */}
        <div className="px-8 py-6">
          {STAGES.map((stage, i) => {
            const isDecisionStage = stage.key === "decision";
            const isCompleted =
              i < currentIndex ||
              (isDecisionStage && isDecided);
            const isCurrent =
              i === currentIndex && !(isDecisionStage && isDecided);
            const isFuture = !isCompleted && !isCurrent;
            const isLast = i === STAGES.length - 1;

            return (
              <div key={stage.key} className="flex gap-5">
                {/* Left column: circle + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                      isCompleted && "border-burgundy bg-burgundy",
                      isCurrent && "border-burgundy bg-white",
                      isFuture && "border-gray-200 bg-white"
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    )}
                    {isCurrent && (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-burgundy opacity-50" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-burgundy" />
                      </span>
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={cn(
                        "mt-1 w-0.5 flex-1",
                        isCompleted ? "bg-burgundy" : "bg-gray-100"
                      )}
                      style={{ minHeight: "36px" }}
                    />
                  )}
                </div>

                {/* Right column: text + meeting card */}
                <div className={cn("pb-7", isLast && "pb-0")}>
                  <p
                    className={cn(
                      "font-semibold leading-snug",
                      !isFuture ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {stage.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-sm",
                      !isFuture ? "text-gray-500" : "text-gray-300"
                    )}
                  >
                    {stage.description}
                  </p>

                  {/* Meeting details — shown at the meeting_invited stage */}
                  {stage.key === "meeting_invited" &&
                    isMeetingVisible(app.status) && (
                      <div className="mt-3">
                        {meeting ? (
                          <MeetingCard meeting={meeting} />
                        ) : (
                          <p className="text-sm italic text-gray-400">
                            Meeting details will be shared soon.
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision banners */}
      {app.status === "accepted" && (
        <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-6 py-5">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">Congratulations!</p>
            <p className="mt-0.5 text-sm text-green-700">
              You have been accepted into the AUB Club. Welcome to the team!
            </p>
          </div>
        </div>
      )}

      {app.status === "rejected" && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
          <p className="font-semibold text-gray-700">Thank you for applying.</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Unfortunately, we cannot offer you a spot this year. We encourage
            you to apply again in the future and wish you the very best.
          </p>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const date = new Date(meeting.scheduled_at);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-2 rounded-xl border border-burgundy/20 bg-burgundy/5 p-4">
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 shrink-0 text-burgundy" />
        <span className="font-medium text-gray-800">{dateStr}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 shrink-0 text-burgundy" />
        <span className="text-gray-700">{timeStr}</span>
      </div>
      {meeting.location && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-burgundy" />
          <span className="text-gray-700">{meeting.location}</span>
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
      {meeting.notes && (
        <p className="border-t border-burgundy/10 pt-2 text-xs text-gray-500">
          {meeting.notes}
        </p>
      )}
    </div>
  );
}
