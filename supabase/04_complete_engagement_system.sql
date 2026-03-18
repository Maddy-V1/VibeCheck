-- ============================================================================
-- COMPLETE ENGAGEMENT SYSTEM - FRESH START
-- Comments and Reactions for Community Posts AND Projects
-- Run this AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP - Remove all old structures
-- ============================================================================

-- Drop views
DROP VIEW IF EXISTS community_posts_with_engagement CASCADE;
DROP VIEW IF EXISTS projects_with_engagement CASCADE;
DROP VIEW IF EXISTS comments_detailed CASCADE;
DROP VIEW IF EXISTS top_level_comments CASCADE;
DROP VIEW IF EXISTS flagged_comments CASCADE;
DROP VIEW IF EXISTS posts_with_reactions CASCADE;

-- Drop functions (CASCADE removes dependent triggers automatically)
DROP FUNCTION IF EXISTS update_community_post_reaction_count() CASCADE;
DROP FUNCTION IF EXISTS update_project_reaction_count() CASCADE;
DROP FUNCTION IF EXISTS update_community_post_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_project_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_comment_reaction_count() CASCADE;
DROP FUNCTION IF EXISTS update_comment_reply_count() CASCADE;
DROP FUNCTION IF EXISTS mark_comment_edited() CASCADE;
DROP FUNCTION IF EXISTS auto_flag_comment() CASCADE;
DROP FUNCTION IF EXISTS toggle_community_post_reaction(uuid, uuid, reaction_type) CASCADE;
DROP FUNCTION IF EXISTS toggle_project_reaction(uuid, uuid, reaction_type) CASCADE;
DROP FUNCTION IF EXISTS toggle_comment_reaction(uuid, uuid, reaction_type) CASCADE;
DROP FUNCTION IF EXISTS add_community_post_comment(uuid, uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS add_project_comment(uuid, uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS edit_comment(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS delete_comment(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS flag_comment(uuid, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS moderate_comment(uuid, uuid, comment_status) CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_reactions_user_id;
DROP INDEX IF EXISTS idx_reactions_community_post_id;
DROP INDEX IF EXISTS idx_reactions_project_id;
DROP INDEX IF EXISTS idx_reactions_type;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_community_post_id;
DROP INDEX IF EXISTS idx_comments_project_id;
DROP INDEX IF EXISTS idx_comments_parent_id;
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comments_status;
DROP INDEX IF EXISTS idx_comment_reactions_comment_id;
DROP INDEX IF EXISTS idx_comment_reactions_user_id;
DROP INDEX IF EXISTS idx_comment_flags_comment_id;
DROP INDEX IF EXISTS idx_comment_flags_created_at;

-- Drop tables
DROP TABLE IF EXISTS comment_flags CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS post_reactions CASCADE;

-- ============================================================================
-- STEP 2: CREATE ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'insightful', 'fire', 'celebrate');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('visible', 'flagged', 'hidden', 'removed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: ADD COUNT COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add to community_posts
DO $$ 
BEGIN
  -- Add reaction_count if not exists
  BEGIN
    ALTER TABLE community_posts ADD COLUMN reaction_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN null;
  END;
  
  -- Add comment_count if not exists
  BEGIN
    ALTER TABLE community_posts ADD COLUMN comment_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN null;
  END;
END $$;

-- Add to projects
DO $$ 
BEGIN
  -- Add reaction_count if not exists
  BEGIN
    ALTER TABLE projects ADD COLUMN reaction_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN null;
  END;
  
  -- Add comment_count if not exists
  BEGIN
    ALTER TABLE projects ADD COLUMN comment_count integer DEFAULT 0;
  EXCEPTION
    WHEN duplicate_column THEN null;
  END;
END $$;

-- Create indexes for engagement sorting
CREATE INDEX IF NOT EXISTS idx_community_posts_reaction_count ON community_posts(reaction_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_comment_count ON community_posts(comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_engagement ON community_posts((reaction_count + comment_count) DESC);
CREATE INDEX IF NOT EXISTS idx_projects_reaction_count ON projects(reaction_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_comment_count ON projects(comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_engagement ON projects((reaction_count + comment_count) DESC);

-- ============================================================================
-- STEP 4: CREATE NEW TABLES
-- ============================================================================

-- Reactions table (for both community posts AND projects)
CREATE TABLE reactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES projects(id) ON DELETE CASCADE,
  reaction_type     reaction_type NOT NULL DEFAULT 'like',
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT reactions_one_target CHECK (
    (community_post_id IS NOT NULL AND project_id IS NULL) OR
    (community_post_id IS NULL AND project_id IS NOT NULL)
  ),
  CONSTRAINT reactions_user_item_unique UNIQUE(user_id, community_post_id, project_id)
);

CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_community_post_id ON reactions(community_post_id) WHERE community_post_id IS NOT NULL;
CREATE INDEX idx_reactions_project_id ON reactions(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_reactions_type ON reactions(reaction_type);

-- Comments table (for both community posts AND projects)
CREATE TABLE comments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES projects(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body              text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  status            comment_status DEFAULT 'visible',
  is_edited         boolean DEFAULT false,
  edited_at         timestamptz,
  reaction_count    integer DEFAULT 0,
  reply_count       integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  CONSTRAINT comments_one_target CHECK (
    (community_post_id IS NOT NULL AND project_id IS NULL) OR
    (community_post_id IS NULL AND project_id IS NOT NULL)
  )
);

CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_community_post_id ON comments(community_post_id) WHERE community_post_id IS NOT NULL;
CREATE INDEX idx_comments_project_id ON comments(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_status ON comments(status) WHERE status = 'visible';

-- Comment reactions table
CREATE TABLE comment_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL DEFAULT 'like',
  created_at    timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Comment flags table
CREATE TABLE comment_flags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason     text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_flags_comment_id ON comment_flags(comment_id);
CREATE INDEX idx_comment_flags_created_at ON comment_flags(created_at DESC);

-- ============================================================================
-- STEP 5: CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Update community_posts.reaction_count
CREATE OR REPLACE FUNCTION update_community_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.community_post_id IS NOT NULL THEN
    UPDATE community_posts SET reaction_count = reaction_count + 1 WHERE id = NEW.community_post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.community_post_id IS NOT NULL THEN
    UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.community_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_post_reaction_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_community_post_reaction_count();

-- Update projects.reaction_count
CREATE OR REPLACE FUNCTION update_project_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.project_id IS NOT NULL THEN
    UPDATE projects SET reaction_count = reaction_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
    UPDATE projects SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_reaction_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_project_reaction_count();

-- Update community_posts.comment_count
CREATE OR REPLACE FUNCTION update_community_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.community_post_id IS NOT NULL THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.community_post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.community_post_id IS NOT NULL THEN
    UPDATE community_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.community_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_post_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_community_post_comment_count();

-- Update projects.comment_count
CREATE OR REPLACE FUNCTION update_project_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.project_id IS NOT NULL THEN
    UPDATE projects SET comment_count = comment_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
    UPDATE projects SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_project_comment_count();

-- Update comments.reaction_count
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET reaction_count = reaction_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_reaction_count
  AFTER INSERT OR DELETE ON comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_count();

-- Update comments.reply_count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Mark comment as edited
CREATE OR REPLACE FUNCTION mark_comment_edited()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.body IS DISTINCT FROM NEW.body THEN
    NEW.is_edited := true;
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_comment_edited
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION mark_comment_edited();

-- Auto-flag comment after 3+ reports
CREATE OR REPLACE FUNCTION auto_flag_comment()
RETURNS TRIGGER AS $$
DECLARE
  flag_count integer;
BEGIN
  SELECT COUNT(*) INTO flag_count FROM comment_flags WHERE comment_id = NEW.comment_id;
  IF flag_count >= 3 THEN
    UPDATE comments SET status = 'flagged' WHERE id = NEW.comment_id AND status = 'visible';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_flag_comment
  AFTER INSERT ON comment_flags
  FOR EACH ROW EXECUTE FUNCTION auto_flag_comment();

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Toggle reaction on community post
CREATE OR REPLACE FUNCTION toggle_community_post_reaction(
  p_post_id uuid,
  p_user_id uuid,
  p_reaction reaction_type DEFAULT 'like'
)
RETURNS boolean AS $$
DECLARE
  existing_reaction reaction_type;
BEGIN
  SELECT reaction_type INTO existing_reaction
  FROM reactions WHERE community_post_id = p_post_id AND user_id = p_user_id;

  IF FOUND THEN
    IF existing_reaction = p_reaction THEN
      DELETE FROM reactions WHERE community_post_id = p_post_id AND user_id = p_user_id;
      RETURN false;
    ELSE
      UPDATE reactions SET reaction_type = p_reaction 
      WHERE community_post_id = p_post_id AND user_id = p_user_id;
      RETURN true;
    END IF;
  ELSE
    INSERT INTO reactions (community_post_id, user_id, reaction_type)
    VALUES (p_post_id, p_user_id, p_reaction);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle reaction on project
CREATE OR REPLACE FUNCTION toggle_project_reaction(
  p_project_id uuid,
  p_user_id uuid,
  p_reaction reaction_type DEFAULT 'like'
)
RETURNS boolean AS $$
DECLARE
  existing_reaction reaction_type;
BEGIN
  SELECT reaction_type INTO existing_reaction
  FROM reactions WHERE project_id = p_project_id AND user_id = p_user_id;

  IF FOUND THEN
    IF existing_reaction = p_reaction THEN
      DELETE FROM reactions WHERE project_id = p_project_id AND user_id = p_user_id;
      RETURN false;
    ELSE
      UPDATE reactions SET reaction_type = p_reaction 
      WHERE project_id = p_project_id AND user_id = p_user_id;
      RETURN true;
    END IF;
  ELSE
    INSERT INTO reactions (project_id, user_id, reaction_type)
    VALUES (p_project_id, p_user_id, p_reaction);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle reaction on comment
CREATE OR REPLACE FUNCTION toggle_comment_reaction(
  p_comment_id uuid,
  p_user_id uuid,
  p_reaction reaction_type DEFAULT 'like'
)
RETURNS boolean AS $$
DECLARE
  existing_reaction reaction_type;
BEGIN
  SELECT reaction_type INTO existing_reaction
  FROM comment_reactions WHERE comment_id = p_comment_id AND user_id = p_user_id;

  IF FOUND THEN
    IF existing_reaction = p_reaction THEN
      DELETE FROM comment_reactions WHERE comment_id = p_comment_id AND user_id = p_user_id;
      RETURN false;
    ELSE
      UPDATE comment_reactions SET reaction_type = p_reaction 
      WHERE comment_id = p_comment_id AND user_id = p_user_id;
      RETURN true;
    END IF;
  ELSE
    INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
    VALUES (p_comment_id, p_user_id, p_reaction);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to community post
CREATE OR REPLACE FUNCTION add_community_post_comment(
  p_post_id uuid,
  p_user_id uuid,
  p_body text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_comment_id uuid;
  parent_depth integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE user_id = p_user_id AND status = 'evaluated') THEN
    RAISE EXCEPTION 'User must have at least one evaluated project to comment';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND community_status = 'active') THEN
    RAISE EXCEPTION 'User is not allowed to comment';
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT parent_comment_id INTO parent_depth FROM comments WHERE id = p_parent_comment_id;
    IF parent_depth IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
  END IF;

  INSERT INTO comments (community_post_id, user_id, body, parent_comment_id)
  VALUES (p_post_id, p_user_id, p_body, p_parent_comment_id)
  RETURNING id INTO new_comment_id;

  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to project
CREATE OR REPLACE FUNCTION add_project_comment(
  p_project_id uuid,
  p_user_id uuid,
  p_body text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_comment_id uuid;
  parent_depth integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE user_id = p_user_id AND status = 'evaluated') THEN
    RAISE EXCEPTION 'User must have at least one evaluated project to comment';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND community_status = 'active') THEN
    RAISE EXCEPTION 'User is not allowed to comment';
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT parent_comment_id INTO parent_depth FROM comments WHERE id = p_parent_comment_id;
    IF parent_depth IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
  END IF;

  INSERT INTO comments (project_id, user_id, body, parent_comment_id)
  VALUES (p_project_id, p_user_id, p_body, p_parent_comment_id)
  RETURNING id INTO new_comment_id;

  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Edit comment (within 15 minutes)
CREATE OR REPLACE FUNCTION edit_comment(
  p_comment_id uuid,
  p_user_id uuid,
  p_new_body text
)
RETURNS boolean AS $$
DECLARE
  comment_age interval;
BEGIN
  SELECT (now() - created_at) INTO comment_age
  FROM comments WHERE id = p_comment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or user is not the owner';
  END IF;

  IF comment_age > interval '15 minutes' THEN
    RAISE EXCEPTION 'Comments can only be edited within 15 minutes of posting';
  END IF;

  UPDATE comments SET body = p_new_body WHERE id = p_comment_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete comment (soft delete)
CREATE OR REPLACE FUNCTION delete_comment(
  p_comment_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE comments SET status = 'hidden', body = '[deleted]'
  WHERE id = p_comment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or user is not the owner';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag comment
CREATE OR REPLACE FUNCTION flag_comment(
  p_comment_id uuid,
  p_user_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  INSERT INTO comment_flags (comment_id, user_id, reason, details)
  VALUES (p_comment_id, p_user_id, p_reason, p_details)
  ON CONFLICT (comment_id, user_id) DO UPDATE
  SET reason = EXCLUDED.reason, details = EXCLUDED.details;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Moderate comment (admin only)
CREATE OR REPLACE FUNCTION moderate_comment(
  p_comment_id uuid,
  p_admin_id uuid,
  p_new_status comment_status
)
RETURNS boolean AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_evaluator = true) THEN
    RAISE EXCEPTION 'Only evaluators can moderate comments';
  END IF;

  UPDATE comments SET status = p_new_status WHERE id = p_comment_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: CREATE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW community_posts_with_engagement AS
SELECT 
  cp.*,
  (cp.reaction_count + cp.comment_count) as engagement_score,
  p.username,
  p.display_name,
  p.avatar_url
FROM community_posts cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.is_deleted = false AND cp.moderation_status = 'visible';

CREATE OR REPLACE VIEW projects_with_engagement AS
SELECT 
  pr.*,
  (pr.reaction_count + pr.comment_count) as engagement_score,
  p.username,
  p.display_name,
  p.avatar_url
FROM projects pr
JOIN profiles p ON pr.user_id = p.id
WHERE pr.is_public = true AND (pr.deleted_at IS NULL OR pr.deleted_at > now());

CREATE OR REPLACE VIEW comments_detailed AS
SELECT 
  c.*,
  p.username,
  p.display_name,
  p.avatar_url,
  (SELECT COUNT(*) FROM comment_flags WHERE comment_id = c.id) as flag_count
FROM comments c
JOIN profiles p ON c.user_id = p.id;

-- ============================================================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON reactions FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view visible comments" ON comments FOR SELECT USING (status = 'visible');
CREATE POLICY "Users can view own comments" ON comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Evaluators can view all comments" ON comments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_evaluator = true));

-- Comment reactions policies
CREATE POLICY "Anyone can view comment reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own comment reactions" ON comment_reactions FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Comment flags policies
CREATE POLICY "Users can view own flags" ON comment_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Evaluators can view all flags" ON comment_flags FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_evaluator = true));
CREATE POLICY "Users can create flags" ON comment_flags FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMPLETE! 
-- ============================================================================
