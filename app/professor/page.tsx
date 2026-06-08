import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types";

type AppRow = {
  id: string;
  status: ApplicationStatus;
  major: string | null;
  year_of_study: string | null;
  submitted_at: string;
  profiles: { full_name: string; aub_email: string } | null;
};

const FILTER_TABS = [
  { label: "All", value: null },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Meeting Invited", value: "meeting_invited" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
] as const;

export default async function ProfessorPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Auth check — regular client (reads own profile via owner-read policy)
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Data queries — admin client bypasses RLS so the profile join works
  // for ALL student rows, not just the professor's own profile.
  const admin = createAdminClient();

  const { data: all } = await admin.from("applications").select("id, status");

  const statusFilter = searchParams.status as ApplicationStatus | undefined;
  let query = admin
    .from("applications")
    .select("id, status, major, year_of_study, submitted_at, profiles(full_name, aub_email)")
    .order("submitted_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: applications } = await query;
  const apps = (applications as AppRow[]) ?? [];

  const stats = {
    total: all?.length ?? 0,
    pending: all?.filter((a) => a.status === "submitted").length ?? 0,
    meetings:
      all?.filter(
        (a) => a.status === "meeting_invited" || a.status === "meeting_done"
      ).length ?? 0,
    accepted: all?.filter((a) => a.status === "accepted").length ?? 0,
  };

  return (
    <div className="p-8">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900">Application Inbox</h1>
      <p className="mt-1 text-sm text-gray-500">
        Review and manage student applications
      </p>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          {
            label: "Pending Review",
            value: stats.pending,
            color: "text-amber-600",
          },
          {
            label: "Meetings",
            value: stats.meetings,
            color: "text-blue-600",
          },
          {
            label: "Accepted",
            value: stats.accepted,
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {stat.label}
            </p>
            <p className={cn("mt-2 text-3xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mt-7 flex gap-0.5 border-b border-gray-200">
        {FILTER_TABS.map((tab) => {
          const href = tab.value
            ? `/professor?status=${tab.value}`
            : "/professor";
          const active =
            (statusFilter ?? null) === tab.value;
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-burgundy text-burgundy"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Application list */}
      <div className="mt-4 space-y-3">
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <span className="text-4xl">📭</span>
            <p className="mt-3 font-medium text-gray-400">
              No applications here yet
            </p>
          </div>
        ) : (
          apps.map((app) => <ApplicationCard key={app.id} app={app} />)
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app }: { app: AppRow }) {
  const name = app.profiles?.full_name ?? "Unknown";
  const email = app.profiles?.aub_email ?? "";
  const initial = name.charAt(0).toUpperCase();

  const date = new Date(app.submitted_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const meta = [app.major, app.year_of_study].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-6 py-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar + info */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{name}</p>
          <p className="truncate text-sm text-gray-500">
            {email}
            {meta && <span className="text-gray-400"> · {meta}</span>}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-5">
        <p className="hidden text-xs text-gray-400 sm:block">
          Submitted {date}
        </p>
        <StatusBadge status={app.status} />
        <Link
          href={`/professor/applications/${app.id}`}
          className="rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-burgundy-dark"
        >
          Review →
        </Link>
      </div>
    </div>
  );
}
