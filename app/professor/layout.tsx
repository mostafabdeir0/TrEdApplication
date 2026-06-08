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
    <div className="flex min-h-screen">
      {/* Suspense required because Sidebar uses useSearchParams */}
      <Suspense fallback={<div className="w-64 shrink-0 bg-burgundy-dark" />}>
        <Sidebar professorName={profile?.full_name ?? "Professor"} />
      </Suspense>
      <main className="flex-1 overflow-auto bg-cream">{children}</main>
    </div>
  );
}
