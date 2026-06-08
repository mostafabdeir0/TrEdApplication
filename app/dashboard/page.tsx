import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (application) redirect("/dashboard/status");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Burgundy header */}
        <div className="bg-burgundy px-8 py-10 text-center">
          <span className="text-6xl leading-none">🌲</span>
          <h1 className="mt-4 text-3xl font-bold text-white">
            Applications Are Open
          </h1>
          <p className="mt-2 text-sm text-white/70">
            AUB Club — Membership 2025–2026
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          <p className="text-center leading-relaxed text-gray-600">
            The AUB Club is a student-led organization dedicated to fostering
            community, collaboration, and academic excellence. We welcome
            motivated students from all backgrounds and disciplines.
          </p>

          <p className="mt-4 text-center leading-relaxed text-gray-600">
            Applications are reviewed by our faculty advisors. Shortlisted
            candidates will be invited for a brief interview before a final
            decision is communicated.
          </p>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl bg-cream py-5">
            {[
              { value: "~10 min", label: "to complete" },
              { value: "4 steps", label: "in the form" },
              { value: "Rolling", label: "decisions" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xl font-bold text-burgundy">{item.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/apply"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-burgundy px-10 text-base font-semibold text-white transition-colors hover:bg-burgundy-dark"
            >
              Apply Now →
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              The application takes approximately 10 minutes to complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
