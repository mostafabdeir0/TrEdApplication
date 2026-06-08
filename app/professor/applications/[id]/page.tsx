import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/badge";
import type { Application, Meeting } from "@/types";
import ActionPanel from "./ActionPanel";

type AppWithProfile = Application & {
  profiles: { full_name: string; aub_email: string };
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-aub-line pb-7">
        <div>
          <Link
            href="/professor"
            className="text-sm font-medium text-burgundy hover:underline"
          >
            ← Back to Applications
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold text-aub-ink">
            {app.profiles.full_name}
          </h1>
          <p className="mt-1 text-sm text-aub-muted">
            {app.profiles.aub_email}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <section className="border border-aub-line bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-aub-muted">
              Student Info
            </h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                { label: "Full Name", value: app.profiles.full_name },
                { label: "AUB Email", value: app.profiles.aub_email },
                { label: "Major", value: app.major ?? "—" },
                { label: "Year of Study", value: app.year_of_study ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wide text-aub-muted/65">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-aub-ink">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {fields.map(({ label, content }) => (
            <section
              key={label}
              className="border border-aub-line bg-white p-6 shadow-sm"
            >
              <h2 className="mb-3 font-display text-xl font-semibold text-burgundy">
                {label}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-aub-muted">
                {content}
              </p>
            </section>
          ))}

          {app.cv_url && (
            <section className="border border-aub-line bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-display text-xl font-semibold text-burgundy">
                Curriculum Vitae
              </h2>
              <CVDownloadLink cvPath={app.cv_url} />
            </section>
          )}
        </div>

        <aside className="w-full shrink-0 xl:w-80">
          <div className="sticky top-24">
            <ActionPanel
              application={app}
              meeting={(meeting as Meeting) ?? null}
            />
          </div>
        </aside>
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
    return <p className="text-sm italic text-aub-muted/60">CV unavailable</p>;
  }

  return (
    <a
      href={data.signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded border border-burgundy px-4 py-2 text-sm font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-white"
    >
      <FileDown className="h-4 w-4" />
      Download CV
    </a>
  );
}
