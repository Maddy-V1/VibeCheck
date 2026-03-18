-- ============================================================================
-- COMMUNITY ENGAGEMENT SYSTEM
-- Professional-grade comments, reactions, and engagement tracking
-- ============================================================================

-- ============================================================================
-- ENUMS
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
-- COMMENTS TABLE
-- Replaces community_posts with clearer structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id   uuid REFERENCES comments(id) ON DELETE CASCADE,
  body                text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  status              comment_status DEFAULT 'visible',
  is_edited           boolean DEFAULT false,
  edited_at           timestamptz,
  reaction_count      integer DEFAULT 0,
  reply_count         integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status) WHERE status = 'visible';
CREATE INDEX IF NOT EXISTS idx_comments_project_status ON comments(project_id, status, created_at DESC) WHERE status = 'visible';

-- ============================================================================
-- REACTIONS TABLE
-- Tracks all reactions to comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction    reaction_type NOT NULL DEFAULT 'like',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)  -- One reaction per user per comment
);

CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_reaction ON comment_reactions(comment_id, reaction);

-- ============================================================================
-- REACTION COUNTS MATERIALIZED TABLE
-- Stores aggregated reaction counts for fast retrieval
-- ============================================================================

CREATE TABLE IF NOT EXISTS comment_reaction_counts (
  comment_id  uuid PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
  like_count        integer DEFAULT 0,
  helpful_count     integer DEFAULT 0,
  insightful_count  integer DEFAULT 0,
  fire_count        integer DEFAULT 0,
  celebrate_count   integer DEFAULT 0,
  total_count       integer DEFAULT 0,
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reaction_counts_total ON comment_reaction_counts(total_count DESC);

-- ============================================================================
-- COMMENT FLAGS TABLE
-- Track user reports on comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS comment_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details     text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)  -- One flag per user per comment
);

CREATE INDEX IF NOT EXISTS idx_flags_comment_id ON comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_flags_created_at ON comment_flags(created_at DESC);

-- ============================================================================
-- TRIGGERS - Auto-update counts
-- ============================================================================

-- Update reaction_count on comments when reaction added/removed
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET reaction_count = reaction_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET reaction_count = GREATEST(0, reaction_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_reaction_count ON comment_reactions;
CREATE TRIGGER trigger_update_comment_reaction_count
  AFTER INSERT OR DELETE ON comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_count();

-- Update reply_count on parent comment when reply added/removed
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.parent_comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON comments;
CREATE TRIGGER trigger_update_comment_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- Update reaction_counts table when reaction changes
CREATE OR REPLACE FUNCTION update_reaction_counts_table()
RETURNS TRIGGER AS $$
DECLARE
  target_comment_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_comment_id := NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    target_comment_id := OLD.comment_id;
  ELSIF TG_OP = 'UPDATE' THEN
    target_comment_id := NEW.comment_id;
  END IF;

  -- Upsert reaction counts
  INSERT INTO comment_reaction_counts (
    comment_id,
    like_count,
    helpful_count,
    insightful_count,
    fire_count,
    celebrate_count,
    total_count,
    updated_at
  )
  SELECT 
    target_comment_id,
    COUNT(*) FILTER (WHERE reaction = 'like'),
    COUNT(*) FILTER (WHERE reaction = 'helpful'),
    COUNT(*) FILTER (WHERE reaction = 'insightful'),
    COUNT(*) FILTER (WHERE reaction = 'fire'),
    COUNT(*) FILTER (WHERE reaction = 'celebrate'),
    COUNT(*),
    now()
  FROM comment_reactions
  WHERE comment_id = target_comment_id
  ON CONFLICT (comment_id) DO UPDATE SET
    like_count = EXCLUDED.like_count,
    helpful_count = EXCLUDED.helpful_count,
    insightful_count = EXCLUDED.insightful_count,
    fire_count = EXCLUDED.fire_count,
    celebrate_count = EXCLUDED.celebrate_count,
    total_count = EXCLUDED.total_count,
    updated_at = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reaction_counts_table ON comment_reactions;
CREATE TRIGGER trigger_update_reaction_counts_table
  AFTER INSERT OR DELETE OR UPDATE ON comment_reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_counts_table();

-- Mark comment as edited when updated
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

DROP TRIGGER IF EXISTS trigger_mark_comment_edited ON comments;
CREATE TRIGGER trigger_mark_comment_edited
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION mark_comment_edited();

-- Auto-flag comment when it receives multiple flags
CREATE OR REPLACE FUNCTION auto_flag_comment()
RETURNS TRIGGER AS $$
DECLARE
  flag_count integer;
BEGIN
  SELECT COUNT(*) INTO flag_count
  FROM comment_flags
  WHERE comment_id = NEW.comment_id;

  -- Auto-flag if 3+ unique users report it
  IF flag_count >= 3 THEN
    UPDATE comments
    SET status = 'flagged'
    WHERE id = NEW.comment_id AND status = 'visible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_flag_comment ON comment_flags;
CREATE TRIGGER trigger_auto_flag_comment
  AFTER INSERT ON comment_flags
  FOR EACH ROW EXECUTE FUNCTION auto_flag_comment();

-- ============================================================================
-- FUNCTIONS - Comment Management
-- ============================================================================

-- Add a comment to a project
CREATE OR REPLACE FUNCTION add_comment(
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
  -- Validate user can comment (has evaluated project)
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE user_id = p_user_id AND status = 'evaluated'
  ) THEN
    RAISE EXCEPTION 'User must have at least one evaluated project to comment';
  END IF;

  -- Check user community status
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id AND community_status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is not allowed to comment';
  END IF;

  -- Prevent deep nesting (max 1 level - replies to top-level comments only)
  IF p_parent_comment_id IS NOT NULL THEN
    SELECT parent_comment_id INTO parent_depth
    FROM comments
    WHERE id = p_parent_comment_id;
    
    IF parent_depth IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
  END IF;

  -- Insert comment
  INSERT INTO comments (project_id, user_id, body, parent_comment_id)
  VALUES (p_project_id, p_user_id, p_body, p_parent_comment_id)
  RETURNING id INTO new_comment_id;

  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Edit a comment (within 15 minutes)
CREATE OR REPLACE FUNCTION edit_comment(
  p_comment_id uuid,
  p_user_id uuid,
  p_new_body text
)
RETURNS boolean AS $$
DECLARE
  comment_age interval;
BEGIN
  -- Check ownership and age
  SELECT (now() - created_at) INTO comment_age
  FROM comments
  WHERE id = p_comment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or user is not the owner';
  END IF;

  IF comment_age > interval '15 minutes' THEN
    RAISE EXCEPTION 'Comments can only be edited within 15 minutes of posting';
  END IF;

  -- Update comment
  UPDATE comments
  SET body = p_new_body
  WHERE id = p_comment_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a comment (soft delete by setting status)
CREATE OR REPLACE FUNCTION delete_comment(
  p_comment_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE comments
  SET status = 'hidden', body = '[deleted]'
  WHERE id = p_comment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or user is not the owner';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS - Reaction Management
-- ============================================================================

-- Toggle reaction on a comment
CREATE OR REPLACE FUNCTION toggle_reaction(
  p_comment_id uuid,
  p_user_id uuid,
  p_reaction reaction_type DEFAULT 'like'
)
RETURNS boolean AS $$
DECLARE
  existing_reaction reaction_type;
BEGIN
  -- Check if user already reacted
  SELECT reaction INTO existing_reaction
  FROM comment_reactions
  WHERE comment_id = p_comment_id AND user_id = p_user_id;

  IF FOUND THEN
    IF existing_reaction = p_reaction THEN
      -- Remove reaction (toggle off)
      DELETE FROM comment_reactions
      WHERE comment_id = p_comment_id AND user_id = p_user_id;
      RETURN false;
    ELSE
      -- Change reaction type
      UPDATE comment_reactions
      SET reaction = p_reaction
      WHERE comment_id = p_comment_id AND user_id = p_user_id;
      RETURN true;
    END IF;
  ELSE
    -- Add new reaction
    INSERT INTO comment_reactions (comment_id, user_id, reaction)
    VALUES (p_comment_id, p_user_id, p_reaction);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's reaction on a comment
CREATE OR REPLACE FUNCTION get_user_reaction(
  p_comment_id uuid,
  p_user_id uuid
)
RETURNS reaction_type AS $$
DECLARE
  user_reaction reaction_type;
BEGIN
  SELECT reaction INTO user_reaction
  FROM comment_reactions
  WHERE comment_id = p_comment_id AND user_id = p_user_id;
  
  RETURN user_reaction;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS - Moderation
-- ============================================================================

-- Flag a comment
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

-- Admin: Update comment status
CREATE OR REPLACE FUNCTION moderate_comment(
  p_comment_id uuid,
  p_admin_id uuid,
  p_new_status comment_status
)
RETURNS boolean AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_admin_id AND is_evaluator = true
  ) THEN
    RAISE EXCEPTION 'Only evaluators can moderate comments';
  END IF;

  UPDATE comments
  SET status = p_new_status
  WHERE id = p_comment_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS - Easy data access
-- ============================================================================

-- Comments with full details (reactions, replies, user info)
CREATE OR REPLACE VIEW comments_detailed AS
SELECT 
  c.id,
  c.project_id,
  c.user_id,
  c.parent_comment_id,
  c.body,
  c.status,
  c.is_edited,
  c.edited_at,
  c.reaction_count,
  c.reply_count,
  c.created_at,
  c.updated_at,
  -- User info
  p.username,
  p.display_name,
  p.avatar_url,
  -- Reaction breakdown
  COALESCE(rc.like_count, 0) as like_count,
  COALESCE(rc.helpful_count, 0) as helpful_count,
  COALESCE(rc.insightful_count, 0) as insightful_count,
  COALESCE(rc.fire_count, 0) as fire_count,
  COALESCE(rc.celebrate_count, 0) as celebrate_count,
  -- Flag count
  (SELECT COUNT(*) FROM comment_flags WHERE comment_id = c.id) as flag_count
FROM comments c
JOIN profiles p ON c.user_id = p.id
LEFT JOIN comment_reaction_counts rc ON c.id = rc.comment_id;

-- Top-level comments only (no replies)
CREATE OR REPLACE VIEW top_level_comments AS
SELECT * FROM comments_detailed
WHERE parent_comment_id IS NULL
ORDER BY created_at DESC;

-- Flagged comments for moderation
CREATE OR REPLACE VIEW flagged_comments AS
SELECT 
  c.*,
  COUNT(cf.id) as flag_count,
  array_agg(DISTINCT cf.reason) as flag_reasons
FROM comments c
JOIN comment_flags cf ON c.id = cf.comment_id
WHERE c.status IN ('visible', 'flagged')
GROUP BY c.id
HAVING COUNT(cf.id) >= 3
ORDER BY COUNT(cf.id) DESC, c.created_at DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view visible comments" ON comments;
CREATE POLICY "Anyone can view visible comments"
  ON comments FOR SELECT
  USING (status = 'visible');

DROP POLICY IF EXISTS "Users can view own comments" ON comments;
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Evaluators can view all comments" ON comments;
CREATE POLICY "Evaluators can view all comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Reactions RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON comment_reactions;
CREATE POLICY "Anyone can view reactions"
  ON comment_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own reactions" ON comment_reactions;
CREATE POLICY "Users can manage own reactions"
  ON comment_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reaction counts RLS
ALTER TABLE comment_reaction_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reaction counts" ON comment_reaction_counts;
CREATE POLICY "Anyone can view reaction counts"
  ON comment_reaction_counts FOR SELECT
  USING (true);

-- Flags RLS
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flags" ON comment_flags;
CREATE POLICY "Users can view own flags"
  ON comment_flags FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Evaluators can view all flags" ON comment_flags;
CREATE POLICY "Evaluators can view all flags"
  ON comment_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Users can create flags" ON comment_flags;
CREATE POLICY "Users can create flags"
  ON comment_flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USAGE EXAMPLES & DOCUMENTATION
-- ============================================================================

/*
===========================================
USAGE EXAMPLES
===========================================

-- 1. Add a top-level comment to a project
SELECT add_comment(
  'project-uuid',
  'user-uuid',
  'Great project! Really impressed with the UI design.'
);

-- 2. Reply to a comment
SELECT add_comment(
  'project-uuid',
  'user-uuid',
  'Thanks! I spent a lot of time on the design.',
  'parent-comment-uuid'
);

-- 3. Edit a comment (within 15 minutes)
SELECT edit_comment(
  'comment-uuid',
  'user-uuid',
  'Updated comment text'
);

-- 4. Delete a comment
SELECT delete_comment('comment-uuid', 'user-uuid');

-- 5. Add a reaction
SELECT toggle_reaction('comment-uuid', 'user-uuid', 'like');

-- 6. Change reaction type
SELECT toggle_reaction('comment-uuid', 'user-uuid', 'fire');

-- 7. Remove reaction (toggle off)
SELECT toggle_reaction('comment-uuid', 'user-uuid', 'fire');

-- 8. Get user's reaction on a comment
SELECT get_user_reaction('comment-uuid', 'user-uuid');

-- 9. Flag a comment
SELECT flag_comment(
  'comment-uuid',
  'user-uuid',
  'spam',
  'This is clearly promotional spam'
);

-- 10. Moderate a comment (admin only)
SELECT moderate_comment('comment-uuid', 'admin-uuid', 'removed');

===========================================
QUERIES
===========================================

-- Get all comments for a project with reactions
SELECT * FROM comments_detailed
WHERE project_id = 'project-uuid'
  AND parent_comment_id IS NULL
ORDER BY created_at DESC;

-- Get replies to a comment
SELECT * FROM comments_detailed
WHERE parent_comment_id = 'comment-uuid'
ORDER BY created_at ASC;

-- Get reaction breakdown for a comment
SELECT * FROM comment_reaction_counts
WHERE comment_id = 'comment-uuid';

-- Get flagged comments for moderation
SELECT * FROM flagged_comments;

-- Get user's reactions on a project
SELECT c.id, c.body, cr.reaction
FROM comments c
JOIN comment_reactions cr ON c.id = cr.comment_id
WHERE c.project_id = 'project-uuid'
  AND cr.user_id = 'user-uuid';

===========================================
DATA STRUCTURE
===========================================

comments table stores:
- id, project_id, user_id, parent_comment_id
- body (1-2000 chars)
- status (visible/flagged/hidden/removed)
- reaction_count (auto-updated)
- reply_count (auto-updated)
- is_edited, edited_at
- created_at, updated_at

comment_reactions table stores:
- id, comment_id, user_id, reaction
- One reaction per user per comment
- Triggers auto-update comment.reaction_count

comment_reaction_counts table stores:
- comment_id (PK)
- like_count, helpful_count, insightful_count, fire_count, celebrate_count
- total_count
- Auto-updated via trigger for fast queries

comment_flags table stores:
- id, comment_id, user_id, reason, details
- Auto-flags comment after 3+ unique reports

*/
