import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./_components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name: string = profile?.full_name ?? "Student";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-aub-line bg-cream shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="font-display text-2xl font-semibold text-burgundy"
            >
              AUB TrEd Portal
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <Link
                href="/dashboard"
                className="border-b-2 border-burgundy pb-1 text-sm font-bold text-burgundy"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/application"
                className="text-sm text-aub-muted transition-colors hover:text-burgundy"
              >
                My Applications
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-aub-ink">{name}</p>
              <p className="text-xs text-aub-muted">AUB Student</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-aub-line bg-aub-panel text-xs font-bold text-burgundy">
              {initials}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12 md:px-10">{children}</main>

      <footer className="mt-16 border-t border-aub-line bg-aub-panel px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-display text-lg font-bold text-burgundy">
              AUB TrEd Portal
            </p>
            <p className="mt-1 text-sm text-aub-muted">
              © 2026 American University of Beirut. All Rights Reserved.
            </p>
          </div>
          <nav className="flex flex-wrap gap-6 text-xs font-semibold text-aub-muted">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Support</span>
            <span>University Home</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
