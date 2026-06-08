-- ============================================================
-- Permanent fix: remove ALL recursive SELECT policies on profiles.
--
-- Root cause: any policy that queries public.profiles from within
-- a policy ON public.profiles causes infinite recursion in
-- PostgreSQL RLS — even when wrapped in a SECURITY DEFINER
-- function (Supabase's postgres role does not carry BYPASSRLS).
--
-- Solution: keep only the simple owner-read policy (no subquery).
-- Professor access to student profiles is handled by the service-role
-- admin client in server components, which bypasses RLS entirely.
-- ============================================================

-- Drop every variant that may exist (from 001 or 002)
DROP POLICY IF EXISTS "profiles: owner can read"         ON public.profiles;
DROP POLICY IF EXISTS "profiles: professor can read all" ON public.profiles;

-- Re-create the sole owner-read policy — zero recursion possible
CREATE POLICY "profiles: owner can read"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
