import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusTracker from "./StatusTracker";
import type { Application, Meeting } from "@/types";

export default async function StatusPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!application) redirect("/dashboard");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("application_id", application.id)
    .maybeSingle();

  return (
    <StatusTracker
      application={application as Application}
      meeting={(meeting as Meeting) ?? null}
    />
  );
}
