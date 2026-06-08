import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAOH0qu6F_vVq2RhErrHe0qiIHc3VHnFSyj1V3VAEG8--Fp32dfipQi9ZnF_dVglZR_u0lcR-pAyAPRzmyVN0OKO28UAREfS_fPxoktm3YFFKGcBxUYQb-FKsHo82jCBKUV12qrD_RvuSlrK4OTUUKTJTWbc_2ShRLA9JTNPW_KlVAQ93__9j6kwIm3CwUC6JFJm5qQaCDQOLCxNktBHHA1FTrMSCkVMm3LqjXUTDfSYJMKyFI-LodAumkdEoxfaFt4cPzfvpxCHBk";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  return (
    <>
      <section className="mb-12">
        <h1 className="font-display text-5xl font-bold tracking-tight text-burgundy md:text-6xl">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 max-w-2xl text-lg leading-8 text-aub-muted">
          Explore new opportunities to engage with the AUB community and begin
          your university club journey.
        </p>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <section className="border border-aub-line bg-white p-8 shadow-sm lg:col-span-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-burgundy">
            Membership 2025–2026
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-aub-ink">
            Build your legacy at AUB.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-aub-muted">
            The AUB Club is a student-led organization dedicated to community,
            collaboration, and academic excellence. Applications are reviewed by
            faculty advisors, with shortlisted candidates invited to interview.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Clock3, value: "~10 min", label: "to complete" },
              { icon: Users, value: "4 steps", label: "in the form" },
              { icon: CalendarDays, value: "Rolling", label: "decisions" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="border border-aub-line bg-aub-soft p-5">
                <Icon className="h-5 w-5 text-burgundy" />
                <p className="mt-4 font-display text-2xl font-semibold text-burgundy">
                  {value}
                </p>
                <p className="text-xs font-semibold text-aub-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="relative min-h-[430px] overflow-hidden bg-cover bg-center p-8 lg:col-span-5"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy via-burgundy/60 to-burgundy/10" />
          <div className="relative z-10 flex h-full min-h-[366px] flex-col justify-end">
            <h2 className="font-display text-4xl font-semibold text-white">
              Applications are open!
            </h2>
            <p className="mt-2 max-w-sm text-base leading-7 text-white/80">
              Join our club community and make a lasting impact on campus.
            </p>
            <Link
              href="/dashboard/apply"
              className="mt-7 inline-flex w-fit items-center gap-3 rounded bg-burgundy px-8 py-3.5 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
