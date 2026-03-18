-- ============================================================================
-- SOFT DELETE & REACTIONS MIGRATION
-- Adds soft delete for profiles/projects and reactions for community posts
-- ============================================================================

-- Add soft delete columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);

-- Add soft delete columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deletion_reason text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id);

-- Add indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled ON profiles(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deletion_scheduled ON projects(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;

-- ============================================================================
-- REACTIONS TABLE (likes, upvotes, etc. for community posts)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'insightful', 'fire');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS post_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction    reaction_type NOT NULL DEFAULT 'like',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_reaction ON post_reactions(post_id, reaction);

-- ============================================================================
-- SOFT DELETE FUNCTIONS
-- ============================================================================

-- Schedule profile deletion (user-initiated)
CREATE OR REPLACE FUNCTION schedule_profile_deletion(
  profile_id uuid,
  days_until_deletion integer DEFAULT 30,
  reason text DEFAULT 'User requested account deletion'
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    deletion_scheduled_at = now() + (days_until_deletion || ' days')::interval,
    deletion_reason = reason
  WHERE id = profile_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel scheduled profile deletion
CREATE OR REPLACE FUNCTION cancel_profile_deletion(profile_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    deletion_scheduled_at = NULL,
    deletion_reason = NULL
  WHERE id = profile_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute profile soft delete
CREATE OR REPLACE FUNCTION soft_delete_profile(
  profile_id uuid,
  admin_id uuid DEFAULT NULL,
  reason text DEFAULT 'Account deleted'
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    deleted_at = now(),
    deleted_by = admin_id,
    deletion_reason = reason,
    is_profile_public = false,
    community_status = 'banned'
  WHERE id = profile_id AND deleted_at IS NULL;
  
  -- Soft delete all user's projects
  UPDATE projects
  SET 
    deleted_at = now(),
    deleted_by = admin_id,
    deletion_reason = 'Profile deleted',
    is_public = false
  WHERE user_id = profile_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule project deletion (user-initiated)
CREATE OR REPLACE FUNCTION schedule_project_deletion(
  project_id uuid,
  days_until_deletion integer DEFAULT 7,
  reason text DEFAULT 'User requested project deletion'
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deletion_scheduled_at = now() + (days_until_deletion || ' days')::interval,
    deletion_reason = reason
  WHERE id = project_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel scheduled project deletion
CREATE OR REPLACE FUNCTION cancel_project_deletion(project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deletion_scheduled_at = NULL,
    deletion_reason = NULL
  WHERE id = project_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute project soft delete
CREATE OR REPLACE FUNCTION soft_delete_project(
  project_id uuid,
  admin_id uuid DEFAULT NULL,
  reason text DEFAULT 'Project deleted'
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deleted_at = now(),
    deleted_by = admin_id,
    deletion_reason = reason,
    is_public = false
  WHERE id = project_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-execute scheduled deletions (run via cron or scheduled job)
CREATE OR REPLACE FUNCTION process_scheduled_deletions()
RETURNS void AS $$
BEGIN
  -- Process scheduled profile deletions
  UPDATE profiles
  SET 
    deleted_at = now(),
    deletion_reason = COALESCE(deletion_reason, 'Scheduled deletion executed'),
    is_profile_public = false,
    community_status = 'banned'
  WHERE deletion_scheduled_at IS NOT NULL 
    AND deletion_scheduled_at <= now()
    AND deleted_at IS NULL;
  
  -- Process scheduled project deletions
  UPDATE projects
  SET 
    deleted_at = now(),
    deletion_reason = COALESCE(deletion_reason, 'Scheduled deletion executed'),
    is_public = false
  WHERE deletion_scheduled_at IS NOT NULL 
    AND deletion_scheduled_at <= now()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore soft-deleted profile (admin only)
CREATE OR REPLACE FUNCTION restore_profile(
  profile_id uuid,
  admin_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_scheduled_at = NULL,
    deletion_reason = NULL,
    community_status = 'active'
  WHERE id = profile_id AND deleted_at IS NOT NULL;
  
  -- Note: Projects are NOT auto-restored, must be done individually
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore soft-deleted project (admin only)
CREATE OR REPLACE FUNCTION restore_project(
  project_id uuid,
  admin_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_scheduled_at = NULL,
    deletion_reason = NULL
  WHERE id = project_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete profile (admin only - irreversible)
CREATE OR REPLACE FUNCTION hard_delete_profile(
  profile_id uuid,
  admin_id uuid
)
RETURNS void AS $$
BEGIN
  -- This will cascade delete all related data
  DELETE FROM profiles WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete project (admin only - irreversible)
CREATE OR REPLACE FUNCTION hard_delete_project(
  project_id uuid,
  admin_id uuid
)
RETURNS void AS $$
BEGIN
  DELETE FROM projects WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REACTION FUNCTIONS
-- ============================================================================

-- Toggle reaction on a post
CREATE OR REPLACE FUNCTION toggle_post_reaction(
  p_post_id uuid,
  p_user_id uuid,
  p_reaction reaction_type DEFAULT 'like'
)
RETURNS boolean AS $$
DECLARE
  reaction_exists boolean;
BEGIN
  -- Check if reaction exists
  SELECT EXISTS(
    SELECT 1 FROM post_reactions 
    WHERE post_id = p_post_id AND user_id = p_user_id AND reaction = p_reaction
  ) INTO reaction_exists;
  
  IF reaction_exists THEN
    -- Remove reaction
    DELETE FROM post_reactions 
    WHERE post_id = p_post_id AND user_id = p_user_id AND reaction = p_reaction;
    RETURN false;
  ELSE
    -- Add reaction
    INSERT INTO post_reactions (post_id, user_id, reaction)
    VALUES (p_post_id, p_user_id, p_reaction)
    ON CONFLICT (post_id, user_id, reaction) DO NOTHING;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reaction counts for a post
CREATE OR REPLACE FUNCTION get_post_reaction_counts(p_post_id uuid)
RETURNS TABLE(reaction reaction_type, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT pr.reaction, COUNT(*)::bigint
  FROM post_reactions pr
  WHERE pr.post_id = p_post_id
  GROUP BY pr.reaction;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED RLS POLICIES
-- ============================================================================

-- Update profiles RLS to exclude soft-deleted profiles
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  USING (is_profile_public = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Update projects RLS to exclude soft-deleted projects
DROP POLICY IF EXISTS "Public projects viewable by all" ON projects;
CREATE POLICY "Public projects viewable by all"
  ON projects FOR SELECT
  USING (is_public = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Reactions RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON post_reactions;
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON post_reactions;
CREATE POLICY "Users can add reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON post_reactions;
CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active (non-deleted) profiles
CREATE OR REPLACE VIEW active_profiles AS
SELECT * FROM profiles WHERE deleted_at IS NULL;

-- View for active (non-deleted) projects
CREATE OR REPLACE VIEW active_projects AS
SELECT * FROM projects WHERE deleted_at IS NULL;

-- View for profiles scheduled for deletion
CREATE OR REPLACE VIEW profiles_pending_deletion AS
SELECT 
  id,
  username,
  display_name,
  deletion_scheduled_at,
  deletion_reason,
  (deletion_scheduled_at - now()) as time_remaining
FROM profiles 
WHERE deletion_scheduled_at IS NOT NULL 
  AND deleted_at IS NULL
ORDER BY deletion_scheduled_at ASC;

-- View for projects scheduled for deletion
CREATE OR REPLACE VIEW projects_pending_deletion AS
SELECT 
  p.id,
  p.title,
  p.user_id,
  pr.username,
  p.deletion_scheduled_at,
  p.deletion_reason,
  (p.deletion_scheduled_at - now()) as time_remaining
FROM projects p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.deletion_scheduled_at IS NOT NULL 
  AND p.deleted_at IS NULL
ORDER BY p.deletion_scheduled_at ASC;

-- View for posts with reaction counts
CREATE OR REPLACE VIEW posts_with_reactions AS
SELECT 
  cp.*,
  COALESCE(
    (SELECT json_object_agg(reaction, count)
     FROM (
       SELECT reaction, COUNT(*) as count
       FROM post_reactions
       WHERE post_id = cp.id
       GROUP BY reaction
     ) reactions
    ), '{}'::json
  ) as reaction_counts,
  (SELECT COUNT(*) FROM post_reactions WHERE post_id = cp.id) as total_reactions
FROM community_posts cp;

-- ============================================================================
-- COMMENTS
-- ============================================================================

/*
USAGE EXAMPLES:

-- User schedules their profile deletion (30 days default)
SELECT schedule_profile_deletion('user-uuid-here', 30, 'I want to delete my account');

-- User cancels scheduled deletion
SELECT cancel_profile_deletion('user-uuid-here');

-- Admin immediately soft-deletes a profile
SELECT soft_delete_profile('user-uuid-here', 'admin-uuid-here', 'Terms violation');

-- User schedules project deletion (7 days default)
SELECT schedule_project_deletion('project-uuid-here', 7, 'No longer needed');

-- Admin restores a soft-deleted profile
SELECT restore_profile('user-uuid-here', 'admin-uuid-here');

-- Admin permanently deletes (IRREVERSIBLE)
SELECT hard_delete_profile('user-uuid-here', 'admin-uuid-here');

-- Toggle a reaction on a post
SELECT toggle_post_reaction('post-uuid-here', 'user-uuid-here', 'like');

-- Get reaction counts for a post
SELECT * FROM get_post_reaction_counts('post-uuid-here');

-- Run scheduled deletions (set up as cron job)
SELECT process_scheduled_deletions();

-- View profiles pending deletion
SELECT * FROM profiles_pending_deletion;

-- View posts with reaction counts
SELECT * FROM posts_with_reactions WHERE project_id = 'some-uuid';
*/
