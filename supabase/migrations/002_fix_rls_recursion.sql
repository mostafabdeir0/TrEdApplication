-- ============================================================
-- Fix: infinite recursion in RLS policies
--
-- Root cause: every policy that checked professor/student role
-- did so by querying public.profiles with EXISTS(...). When that
-- subquery runs on a table whose own policies also query profiles,
-- PostgreSQL recurses infinitely.
--
-- Solution: a SECURITY DEFINER function that reads the role
-- without triggering RLS (it runs as the function owner, not the
-- calling user), then all role-check policies use it instead.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Helper: get the calling user's role without RLS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;


-- ------------------------------------------------------------
-- 2. profiles — drop recursive policy, recreate with helper
-- ------------------------------------------------------------
DROP POLICY "profiles: professor can read all" ON public.profiles;

CREATE POLICY "profiles: professor can read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'professor');


-- ------------------------------------------------------------
-- 3. applications — replace all EXISTS(profiles…) checks
-- ------------------------------------------------------------
DROP POLICY "applications: student can insert"   ON public.applications;
DROP POLICY "applications: professor can read all" ON public.applications;
DROP POLICY "applications: professor can update"  ON public.applications;

CREATE POLICY "applications: student can insert"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND get_my_role() = 'student'
  );

CREATE POLICY "applications: professor can read all"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'professor');

CREATE POLICY "applications: professor can update"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING     (get_my_role() = 'professor')
  WITH CHECK (get_my_role() = 'professor');


-- ------------------------------------------------------------
-- 4. meetings — replace all EXISTS(profiles…) checks
-- ------------------------------------------------------------
DROP POLICY "meetings: professor can insert" ON public.meetings;
DROP POLICY "meetings: professor can update" ON public.meetings;

CREATE POLICY "meetings: professor can insert"
  ON public.meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'professor');

CREATE POLICY "meetings: professor can update"
  ON public.meetings
  FOR UPDATE
  TO authenticated
  USING     (get_my_role() = 'professor')
  WITH CHECK (get_my_role() = 'professor');
