"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  PartyPopper,
  Play,
  X,
  Mail,
  MapPin,
  Search,
  Send,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus, Meeting } from "@/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";

interface Props {
  application: Application;
  meeting: Meeting | null;
}

const STAGES = [
  {
    key: "submitted",
    label: "Submitted",
    description: "Your application has been received and all documents are in order.",
    icon: Send,
  },
  {
    key: "under_review",
    label: "Under Review",
    description: "The committee is evaluating your application and statement of intent.",
    icon: Search,
  },
  {
    key: "meeting_invited",
    label: "Meeting Invited",
    description: "You have been selected for a formal introduction and interview.",
    icon: Mail,
  },
  {
    key: "meeting_done",
    label: "Meeting Completed",
    description: "Your interview has been completed successfully.",
    icon: CalendarDays,
  },
  {
    key: "decision",
    label: "Final Decision",
    description: "Confirmation of your club membership status.",
    icon: BadgeCheck,
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

const CONFETTI = Array.from({ length: 54 }, (_, index) => ({
  id: index,
  left: (index * 37) % 100,
  delay: (index % 12) * 0.09,
  duration: 2.8 + (index % 7) * 0.18,
  color: ["#6B1A2A", "#8B2E2E", "#D7A84B", "#1B4F8A", "#F3D7DC"][
    index % 5
  ],
  rotate: (index * 53) % 360,
}));

function isMeetingVisible(status: ApplicationStatus) {
  return (
    status === "meeting_invited" ||
    status === "meeting_done" ||
    status === "accepted" ||
    status === "rejected"
  );
}

export default function StatusTracker({
  application,
  meeting: initialMeeting,
}: Props) {
  const [app, setApp] = useState<Application>(application);
  const [meeting, setMeeting] = useState<Meeting | null>(initialMeeting);
  const [supabase] = useState(() => createClient());
  const [showCelebration, setShowCelebration] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndex = STATUS_TO_STAGE[app.status];
  const isDecided = app.status === "accepted" || app.status === "rejected";

  const playApplause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    try {
      await audio.play();
      setAudioBlocked(false);
    } catch {
      setAudioBlocked(true);
    }
  }, []);

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
        (payload) => setMeeting(payload.new as Meeting)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `application_id=eq.${app.id}`,
        },
        (payload) => setMeeting(payload.new as Meeting)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [app.id, supabase]);

  useEffect(() => {
    if (app.status !== "accepted") return;

    const storageKey = `aub-acceptance-celebrated:${app.id}`;
    if (window.localStorage.getItem(storageKey)) return;

    window.localStorage.setItem(storageKey, "true");
    setShowCelebration(true);
    void playApplause();
  }, [app.id, app.status, playApplause]);

  const submittedDate = new Date(app.submitted_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/acceptance-applause.mp3"
        preload="auto"
      />

      {showCelebration && (
        <CelebrationOverlay
          audioBlocked={audioBlocked}
          onClose={() => setShowCelebration(false)}
          onPlay={playApplause}
        />
      )}

      <section className="mb-12">
        <h1 className="font-display text-5xl font-bold tracking-tight text-burgundy">
          Your application journey.
        </h1>
        <p className="mt-2 max-w-2xl text-lg leading-8 text-aub-muted">
          Monitor your application as it moves through faculty review,
          interview, and final decision.
        </p>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="border border-aub-line bg-white p-8 shadow-sm lg:col-span-7">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold text-burgundy">
                Application Status
              </h2>
              <p className="text-sm text-aub-muted">
                AUB Club Membership — 2025–2026
              </p>
            </div>
            <span className="rounded-full border border-burgundy/20 bg-burgundy/10 px-4 py-1.5 text-xs font-bold text-burgundy">
              Active Journey
            </span>
          </div>

          <div className="relative space-y-10 pl-14">
            <div className="absolute bottom-5 left-5 top-5 w-px bg-aub-line" />
            {STAGES.map((stage, index) => {
              const isDecisionStage = stage.key === "decision";
              const completed =
                index < currentIndex || (isDecisionStage && isDecided);
              const current =
                index === currentIndex && !(isDecisionStage && isDecided);
              const future = !completed && !current;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="relative">
                  <div
                    className={cn(
                      "absolute -left-14 z-10 flex h-10 w-10 items-center justify-center rounded-lg border-4 border-white",
                      completed || current
                        ? "bg-burgundy text-white"
                        : "bg-aub-panel text-aub-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={cn(future && "opacity-45")}>
                    <h3
                      className={cn(
                        "font-semibold",
                        completed || current ? "text-burgundy" : "text-aub-ink"
                      )}
                    >
                      {stage.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-aub-muted">
                      {stage.description}
                    </p>
                    {current && (
                      <p className="mt-1 text-xs font-bold text-burgundy">
                        Status: Currently Active
                      </p>
                    )}
                    {stage.key === "meeting_invited" &&
                      isMeetingVisible(app.status) &&
                      meeting && <div className="mt-4"><MeetingCard meeting={meeting} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-5">
          <section className="border border-aub-line bg-aub-soft p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-aub-muted">
              Current Status
            </p>
            <div className="mt-4">
              <StatusBadge status={app.status} />
            </div>
            <div className="mt-7 border-t border-aub-line pt-5">
              <p className="text-xs text-aub-muted">Application submitted</p>
              <p className="mt-1 font-display text-2xl font-semibold text-burgundy">
                {submittedDate}
              </p>
            </div>
          </section>

          {meeting && isMeetingVisible(app.status) && (
            <section className="border border-aub-line bg-white p-7 shadow-sm">
              <h2 className="font-display text-2xl font-semibold text-burgundy">
                Interview Details
              </h2>
              <div className="mt-5">
                <MeetingCard meeting={meeting} />
              </div>
            </section>
          )}

          {app.status === "accepted" && (
            <section className="border border-green-200 bg-green-50 p-7">
              <p className="font-display text-2xl font-semibold text-green-800">
                Congratulations!
              </p>
              <p className="mt-2 text-sm leading-6 text-green-700">
                Your application has been accepted. Welcome to the TrEd team.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowCelebration(true);
                  void playApplause();
                }}
                className="mt-5 inline-flex items-center gap-2 rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <PartyPopper className="h-4 w-4" />
                Replay celebration
              </button>
            </section>
          )}

          {app.status === "rejected" && (
            <section className="border border-aub-line bg-aub-panel p-7">
              <p className="font-display text-2xl font-semibold text-aub-ink">
                Thank you for applying.
              </p>
              <p className="mt-2 text-sm leading-6 text-aub-muted">
                We cannot offer you a spot this year, but encourage you to apply
                again in the future.
              </p>
            </section>
          )}
        </aside>
      </div>

    </>
  );
}

function CelebrationOverlay({
  audioBlocked,
  onClose,
  onPlay,
}: {
  audioBlocked: boolean;
  onClose: () => void;
  onPlay: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-burgundy/80 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((piece) => (
          <span
            key={piece.id}
            className="acceptance-confetti absolute -top-8 h-4 w-2 rounded-sm"
            style={{
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 w-full max-w-xl border border-white/50 bg-cream px-8 py-10 text-center shadow-2xl md:px-12">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-aub-muted transition-colors hover:bg-aub-panel hover:text-burgundy"
          aria-label="Close celebration"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-burgundy text-white shadow-lg">
          <PartyPopper className="h-10 w-10" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-burgundy">
          Final Decision
        </p>
        <h2
          id="celebration-title"
          className="mt-3 font-display text-5xl font-bold text-burgundy"
        >
          Congratulations!
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-aub-muted">
          Your application has been accepted. Welcome to the TrEd team.
        </p>

        <button
          type="button"
          onClick={() => void onPlay()}
          className="mt-8 inline-flex items-center gap-2 rounded bg-burgundy px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <Play className="h-4 w-4 fill-current" />
          {audioBlocked ? "Play applause" : "Replay applause"}
        </button>
        {audioBlocked && (
          <p className="mt-3 text-xs text-aub-muted/70">
            Your browser blocked automatic sound. Press the button to play it.
          </p>
        )}
      </section>
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
    <div className="space-y-3 border border-aub-line bg-white p-4">
      <Detail icon={CalendarDays}>{dateStr}</Detail>
      <Detail icon={Clock}>{timeStr}</Detail>
      {meeting.location && <Detail icon={MapPin}>{meeting.location}</Detail>}
      {meeting.meeting_link && (
        <div className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 shrink-0 text-burgundy" />
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-burgundy hover:underline"
          >
            Join Video Call
          </a>
        </div>
      )}
      {meeting.notes && (
        <p className="border-t border-aub-line pt-3 text-xs text-aub-muted">
          {meeting.notes}
        </p>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-aub-muted">
      <Icon className="h-4 w-4 shrink-0 text-burgundy" />
      <span>{children}</span>
    </div>
  );
}
