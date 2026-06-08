import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./_components/Sidebar";

export default async function ProfessorLayout({
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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-cream">
      <Suspense fallback={<div className="fixed inset-x-0 top-0 h-16 bg-cream" />}>
        <Sidebar professorName={profile?.full_name ?? "Professor"} />
      </Suspense>
      <main className="min-h-screen pt-16 md:ml-64">
        {children}
        <footer className="mt-16 border-t border-aub-line bg-aub-panel px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-display text-xl font-bold text-burgundy">
                AUB Portal
              </p>
              <p className="mt-1 text-sm text-aub-muted">
                © 2026 American University of Beirut. All Rights Reserved.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-aub-muted">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Support</span>
              <span>University Home</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
