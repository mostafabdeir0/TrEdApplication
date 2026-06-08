import Link from "next/link";
import { redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/types";

export default async function SubmittedApplicationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) redirect("/dashboard");

  const application = data as Application;
  const submittedDate = new Date(application.submitted_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-burgundy">
            Your Submission
          </p>
          <h1 className="mt-2 font-display text-5xl font-bold text-burgundy">
            Submitted Application
          </h1>
          <p className="mt-2 text-lg text-aub-muted">
            Review the information and answers included in your application.
          </p>
        </div>
        <Link
          href="/dashboard/status"
          className="rounded border border-burgundy px-5 py-2.5 text-sm font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-white"
        >
          View Application Status
        </Link>
      </div>

      <section className="border border-aub-line bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-aub-line pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-aub-muted">
              Submitted On
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-aub-ink">
              {submittedDate}
            </p>
          </div>
          <span className="rounded bg-burgundy/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-burgundy">
            Read Only
          </span>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <ApplicationField
            label="Major"
            value={application.major ?? "Not provided"}
          />
          <ApplicationField
            label="Year of Study"
            value={application.year_of_study ?? "Not provided"}
          />
        </div>

        <div className="mt-7 space-y-5">
          <ApplicationField
            label="Why do you want to join?"
            value={application.why_join}
            long
          />
          <ApplicationField
            label="Experience & Skills"
            value={application.experience}
            long
          />
          <ApplicationField label="Goals" value={application.goals} long />
          <ApplicationField
            label="Weekly Availability"
            value={application.availability}
            long
          />
          <CVField cvPath={application.cv_url} />
        </div>
      </section>
    </div>
  );
}

function ApplicationField({
  label,
  value,
  long = false,
}: {
  label: string;
  value: string;
  long?: boolean;
}) {
  return (
    <div className="border border-aub-line bg-aub-soft p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aub-muted">
        {label}
      </p>
      <p
        className={`mt-2 whitespace-pre-wrap break-words text-aub-ink ${
          long ? "text-sm leading-7" : "font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

async function CVField({ cvPath }: { cvPath: string | null }) {
  if (!cvPath) {
    return <ApplicationField label="CV" value="No CV uploaded" />;
  }

  const supabase = createClient();
  const { data } = await supabase.storage
    .from("cvs")
    .createSignedUrl(cvPath, 3600);

  return (
    <div className="border border-aub-line bg-aub-soft p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-aub-muted">
        CV
      </p>
      {data?.signedUrl ? (
        <a
          href={data.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded bg-burgundy px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <FileDown className="h-4 w-4" />
          View Uploaded CV
        </a>
      ) : (
        <p className="mt-2 text-sm text-aub-muted">CV unavailable</p>
      )}
    </div>
  );
}
