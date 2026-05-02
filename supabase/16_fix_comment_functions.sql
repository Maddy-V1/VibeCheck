-- ============================================================================
-- 16. Fix Comment Helper Functions
-- Run this AFTER 15_phase_2_1_community.sql
--
-- Fixes a sequence bug from older engagement migrations where parent_depth was
-- declared as integer even though comments.parent_comment_id is uuid.
-- Also backfills legacy NULL community_status values so comment access works
-- consistently for older profile rows.
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.comments') IS NULL
     OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION
      'Migration 16 requires the comments and profiles tables to already exist.';
  END IF;
END $$;

UPDATE profiles
SET community_status = 'active'
WHERE community_status IS NULL;

ALTER TABLE profiles
  ALTER COLUMN community_status SET DEFAULT 'active';

ALTER TABLE profiles
  ALTER COLUMN community_status SET NOT NULL;

CREATE OR REPLACE FUNCTION add_community_post_comment(
  p_post_id uuid,
  p_user_id uuid,
  p_body text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comment_id uuid;
  parent_depth uuid;
  parent_post_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM projects
    WHERE user_id = p_user_id
      AND status = 'evaluated'
  ) THEN
    RAISE EXCEPTION 'User must have at least one evaluated project to comment';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_user_id
      AND community_status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is not allowed to comment';
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT parent_comment_id, community_post_id
    INTO parent_depth, parent_post_id
    FROM comments
    WHERE id = p_parent_comment_id;

    IF NOT FOUND OR parent_post_id IS DISTINCT FROM p_post_id THEN
      RAISE EXCEPTION 'Parent comment not found on this community post';
    END IF;

    IF parent_depth IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
  END IF;

  INSERT INTO comments (community_post_id, user_id, body, parent_comment_id)
  VALUES (p_post_id, p_user_id, p_body, p_parent_comment_id)
  RETURNING id INTO new_comment_id;

  RETURN new_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION add_project_comment(
  p_project_id uuid,
  p_user_id uuid,
  p_body text,
  p_parent_comment_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comment_id uuid;
  parent_depth uuid;
  parent_project_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM projects
    WHERE user_id = p_user_id
      AND status = 'evaluated'
  ) THEN
    RAISE EXCEPTION 'User must have at least one evaluated project to comment';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_user_id
      AND community_status = 'active'
  ) THEN
    RAISE EXCEPTION 'User is not allowed to comment';
  END IF;

  IF p_parent_comment_id IS NOT NULL THEN
    SELECT parent_comment_id, project_id
    INTO parent_depth, parent_project_id
    FROM comments
    WHERE id = p_parent_comment_id;

    IF NOT FOUND OR parent_project_id IS DISTINCT FROM p_project_id THEN
      RAISE EXCEPTION 'Parent comment not found on this project';
    END IF;

    IF parent_depth IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
  END IF;

  INSERT INTO comments (project_id, user_id, body, parent_comment_id)
  VALUES (p_project_id, p_user_id, p_body, p_parent_comment_id)
  RETURNING id INTO new_comment_id;

  RETURN new_comment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_community_post_comment(uuid, uuid, text, uuid)
  TO authenticated;

GRANT EXECUTE ON FUNCTION add_project_comment(uuid, uuid, text, uuid)
  TO authenticated;
