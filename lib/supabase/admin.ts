import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely.
// Only call this from Server Components where the caller's role
// has already been verified via the regular auth client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
