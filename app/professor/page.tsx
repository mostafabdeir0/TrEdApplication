import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export default async function ProfessorPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: all } = await admin.from("applications").select("id, status");
  const statusFilter = searchParams.status as ApplicationStatus | undefined;
  let query = admin
    .from("applications")
    .select(
      "id, status, major, year_of_study, submitted_at, profiles(full_name, aub_email)"
    )
    .order("submitted_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: applications } = await query;
  const apps = (applications as unknown as AppRow[] | null) ?? [];
  const stats = {
    total: all?.length ?? 0,
    pending: all?.filter((a) => a.status === "submitted").length ?? 0,
    meetings:
      all?.filter(
        (a) => a.status === "meeting_invited" || a.status === "meeting_done"
      ).length ?? 0,
    accepted: all?.filter((a) => a.status === "accepted").length ?? 0,
  };

  const statCards = [
    { label: "Total Apps", value: stats.total, icon: ClipboardList, color: "text-burgundy" },
    { label: "Pending", value: stats.pending, icon: Clock3, color: "text-[#A03E3D]" },
    { label: "Scheduled", value: stats.meetings, icon: CalendarDays, color: "text-bliss-blue" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "text-burgundy" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-aub-ink">
          Professor Dashboard
        </h1>
        <p className="mt-2 text-lg text-aub-muted">
          Manage student applications and club reviews for the current semester.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-2 gap-5 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="border border-aub-line bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aub-muted">
              {label}
            </p>
            <div className="mt-5 flex items-end justify-between">
              <span className={`font-display text-4xl font-semibold ${color}`}>
                {value}
              </span>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-aub-ink">
              {statusFilter ? "Filtered Applications" : "Recent Applications"}
            </h2>
            {statusFilter && (
              <Link href="/professor" className="mt-1 block text-sm text-burgundy hover:underline">
                Clear filter
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 rounded bg-aub-panel px-4 py-2 text-sm font-bold text-aub-ink">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </span>
            <span className="rounded bg-aub-panel px-4 py-2 text-sm font-bold text-aub-ink">
              Sort
            </span>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center border-2 border-dashed border-aub-line bg-white/30 p-10 text-center">
            <ClipboardList className="h-12 w-12 text-aub-muted/40" />
            <p className="mt-4 font-display text-xl text-aub-muted">
              No applications here yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ApplicationCard({ app }: { app: AppRow }) {
  const name = app.profiles?.full_name ?? "Unknown";
  const email = app.profiles?.aub_email ?? "";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const date = new Date(app.submitted_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="flex min-h-72 flex-col justify-between border border-aub-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-aub-panel text-sm font-bold text-burgundy">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold leading-tight text-aub-ink">
                {name}
              </h3>
              <p className="truncate text-sm text-aub-muted">
                {app.major ?? app.year_of_study ?? email}
              </p>
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <p className="mt-7 line-clamp-2 text-sm leading-6 text-aub-muted">
          {email}
          {app.year_of_study ? ` · ${app.year_of_study}` : ""}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-aub-line pt-4">
        <span className="text-sm italic text-aub-muted">{date}</span>
        <Link
          href={`/professor/applications/${app.id}`}
          className="rounded bg-burgundy px-6 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Review
        </Link>
      </div>
    </article>
  );
}
