-- ============================================================
-- CV file storage bucket + application cv_url column
-- ============================================================

-- Create a private storage bucket for CVs (5 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Students can upload / overwrite their own CV (stored under their user-id folder)
CREATE POLICY "cvs: student can upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cvs'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "cvs: student can update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND name LIKE auth.uid()::text || '/%'
  );

-- Students and professors can read CVs they are allowed to see
CREATE POLICY "cvs: student can read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "cvs: professor can read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND get_my_role() = 'professor'
  );

-- Add cv_url (stores the storage path, e.g. "<user-id>/cv.pdf")
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cv_url text;
