-- Migration 12: Storage Bucket and Policies for Badges
-- Creates storage bucket for badge images and sets up RLS policies

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create badges bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('badges', 'badges', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for badges" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload badges" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update badges" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete badges" ON storage.objects;

-- Allow anyone to read badges (public access)
CREATE POLICY "Public read access for badges"
ON storage.objects FOR SELECT
USING (bucket_id = 'badges');

-- Allow service role to upload badges
CREATE POLICY "Service role can upload badges"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'badges' 
  AND auth.role() = 'service_role'
);

-- Allow service role to update badges
CREATE POLICY "Service role can update badges"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'badges' 
  AND auth.role() = 'service_role'
);

-- Allow service role to delete badges
CREATE POLICY "Service role can delete badges"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'badges' 
  AND auth.role() = 'service_role'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify bucket was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'badges'
  ) THEN
    RAISE EXCEPTION 'Badges bucket was not created successfully';
  END IF;
  
  RAISE NOTICE 'Migration 12 completed: Storage bucket "badges" created with public read access';
END $$;
