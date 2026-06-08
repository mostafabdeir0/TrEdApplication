-- Extend applications with year_of_study and major collected in the multi-step form.
-- Added as nullable so existing rows (if any) are unaffected.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS year_of_study text,
  ADD COLUMN IF NOT EXISTS major text;
