import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/badge";
import type { Application, Meeting } from "@/types";
import { FileDown } from "lucide-react";
import ActionPanel from "./ActionPanel";

type AppWithProfile = Application & {
  profiles: { full_name: string; aub_email: string };
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Auth check with regular client
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Data with admin client (needs to join student profiles across RLS boundary)
  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("applications")
    .select("*, profiles(full_name, aub_email)")
    .eq("id", params.id)
    .single();

  if (!raw) notFound();

  const app = raw as AppWithProfile;

  const { data: meeting } = await admin
    .from("meetings")
    .select("*")
    .eq("application_id", params.id)
    .maybeSingle();

  const fields = [
    { label: "Why do you want to join?", content: app.why_join },
    { label: "Experience & Skills", content: app.experience },
    { label: "Goals", content: app.goals },
    { label: "Weekly Availability", content: app.availability },
  ];

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/professor"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back to Inbox
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {app.profiles.full_name}
          </h1>
          <p className="text-sm text-gray-500">{app.profiles.aub_email}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* ── LEFT: application details ── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Student info grid */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Student Info
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {[
                { label: "Full Name", value: app.profiles.full_name },
                { label: "AUB Email", value: app.profiles.aub_email },
                { label: "Major", value: app.major ?? "—" },
                { label: "Year of Study", value: app.year_of_study ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Application answers */}
          {fields.map(({ label, content }) => (
            <div key={label} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {label}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {content}
              </p>
            </div>
          ))}

          {/* CV download */}
          {app.cv_url && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                CV
              </h2>
              <CVDownloadLink cvPath={app.cv_url} />
            </div>
          )}
        </div>

        {/* ── RIGHT: action panel (sticky) ── */}
        <div className="w-80 shrink-0">
          <div className="sticky top-8">
            <ActionPanel
              application={app}
              meeting={(meeting as Meeting) ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

async function CVDownloadLink({ cvPath }: { cvPath: string }) {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from("cvs")
    .createSignedUrl(cvPath, 3600);

  if (!data?.signedUrl) {
    return <p className="text-sm italic text-gray-400">CV unavailable</p>;
  }

  return (
    <a
      href={data.signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      <FileDown className="h-4 w-4" />
      Download CV
    </a>
  );
}
