-- ============================================================
-- AUB Club Portal — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- 1. Custom ENUM types
-- ============================================================

CREATE TYPE application_status AS ENUM (
  'submitted',
  'under_review',
  'meeting_invited',
  'meeting_done',
  'accepted',
  'rejected'
);

CREATE TYPE user_role AS ENUM ('student', 'professor');


-- ============================================================
-- 2. profiles
--    One row per auth.users entry. Created automatically by
--    the handle_new_user trigger (section 6).
-- ============================================================

CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  aub_email   text        UNIQUE NOT NULL,
  role        user_role   NOT NULL DEFAULT 'student',
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. applications
--    One application per student (enforced by UNIQUE on user_id).
-- ============================================================

CREATE TABLE public.applications (
  id           uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       application_status NOT NULL DEFAULT 'submitted',
  why_join     text               NOT NULL,
  experience   text               NOT NULL,
  goals        text               NOT NULL,
  availability text               NOT NULL,
  submitted_at timestamptz        NOT NULL DEFAULT now(),
  updated_at   timestamptz        NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);


-- ============================================================
-- 4. meetings
--    Linked to an application. A professor schedules these.
-- ============================================================

CREATE TABLE public.meetings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_at   timestamptz NOT NULL,
  location       text,
  meeting_link   text,
  notes          text,
  completed      boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 5. Trigger: auto-create profile on auth.users INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, aub_email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'student'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 6. Trigger: auto-update updated_at on applications
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 7. Row Level Security
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings     ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- profiles policies
-- ------------------------------------------------------------

-- Any authenticated user can read their own profile
CREATE POLICY "profiles: owner can read"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Any authenticated user can update their own profile
CREATE POLICY "profiles: owner can update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Professors can read all profiles (needed for application review)
CREATE POLICY "profiles: professor can read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  );


-- ------------------------------------------------------------
-- applications policies
-- ------------------------------------------------------------

-- Students can submit their own application
CREATE POLICY "applications: student can insert"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'student'
    )
  );

-- Students can read their own application
CREATE POLICY "applications: student can read own"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Professors can read all applications
CREATE POLICY "applications: professor can read all"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  );

-- Professors can update any application (e.g., change status)
CREATE POLICY "applications: professor can update"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  );


-- ------------------------------------------------------------
-- meetings policies
-- ------------------------------------------------------------

-- Professors can create meetings
CREATE POLICY "meetings: professor can insert"
  ON public.meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  );

-- Professors can update meetings
CREATE POLICY "meetings: professor can update"
  ON public.meetings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'professor'
    )
  );

-- Students can read their own meeting via their application
CREATE POLICY "meetings: student can read own"
  ON public.meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
        AND a.user_id = auth.uid()
    )
  );
