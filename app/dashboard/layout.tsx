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

  return (
    <div className="min-h-screen bg-cream">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-burgundy"
          >
            <span>🌲</span>
            AUB Club Portal
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-600 sm:block">
              {profile?.full_name ?? "Student"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
