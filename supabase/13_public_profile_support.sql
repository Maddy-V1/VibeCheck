-- ============================================================================
-- 13. Public Profile Support
-- ============================================================================
-- This migration ensures public profiles and projects work correctly
-- Run this after all previous migrations (01-12)

-- Ensure RLS policies allow anonymous users to view public projects
DROP POLICY IF EXISTS "Public projects viewable by all" ON projects;
CREATE POLICY "Public projects viewable by all"
  ON projects FOR SELECT
  USING (
    is_public = true 
    AND (deleted_at IS NULL OR deleted_at > now())
  );

-- Ensure RLS policies allow anonymous users to view public profiles
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  USING (
    is_profile_public = true 
    AND (deleted_at IS NULL OR deleted_at > now())
  );

-- Ensure evaluations are viewable for public projects
DROP POLICY IF EXISTS "Public evaluations viewable by all" ON evaluations;
CREATE POLICY "Public evaluations viewable by all"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evaluations.project_id
      AND projects.is_public = true
      AND (projects.deleted_at IS NULL OR projects.deleted_at > now())
    )
  );

-- Add index for better performance on public profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_username_public 
  ON profiles(username) 
  WHERE is_profile_public = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_public 
  ON projects(user_id, is_public) 
  WHERE is_public = true AND deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (run these to check your data)
-- ============================================================================

-- Check your profile status
-- SELECT id, username, display_name, is_profile_public 
-- FROM profiles 
-- WHERE username = 'YOUR_USERNAME';

-- Check your projects status
-- SELECT id, title, is_public, status, deleted_at 
-- FROM projects 
-- WHERE user_id = 'YOUR_USER_ID';

-- If you need to make your profile public:
-- UPDATE profiles SET is_profile_public = true WHERE username = 'YOUR_USERNAME';

-- If you need to make your projects public:
-- UPDATE projects SET is_public = true WHERE user_id = 'YOUR_USER_ID';
