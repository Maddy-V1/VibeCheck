-- ============================================================================
-- 15. Phase 2.1 Community Additions
-- Run this AFTER migrations 04 and 14.
--
-- This migration intentionally does not rewrite the existing engagement system.
-- It only patches the remaining Phase 2.1 gaps:
-- 1. Ensures reaction_type includes 'celebrate' even if migration 02 ran first
-- 2. Extends moderation_action for content reports
-- 3. Adds comment_id linkage on moderation_log
-- 4. Adds an atomic report_comment_for_moderation() helper
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.comments') IS NULL
     OR to_regclass('public.comment_flags') IS NULL
     OR to_regclass('public.reactions') IS NULL
  THEN
    RAISE EXCEPTION
      'Migration 15 requires the engagement system from 04_complete_engagement_system.sql to be present first.';
  END IF;
END $$;

DO $$
BEGIN
  ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'celebrate';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  ALTER TYPE moderation_action ADD VALUE IF NOT EXISTS 'content_flag';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE moderation_log
  ADD COLUMN IF NOT EXISTS comment_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'moderation_log_comment_id_fkey'
  ) THEN
    ALTER TABLE moderation_log
      ADD CONSTRAINT moderation_log_comment_id_fkey
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_moderation_log_comment_id
  ON moderation_log(comment_id);

CREATE OR REPLACE FUNCTION report_comment_for_moderation(
  p_comment_id uuid,
  p_reporter_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_comment_user_id uuid;
  already_flagged boolean;
  normalized_reason text;
  normalized_details text;
BEGIN
  normalized_reason := lower(trim(coalesce(p_reason, '')));
  normalized_details := nullif(trim(coalesce(p_details, '')), '');

  IF normalized_reason NOT IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other') THEN
    RAISE EXCEPTION 'Invalid moderation reason';
  END IF;

  SELECT user_id
  INTO target_comment_user_id
  FROM comments
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  IF target_comment_user_id = p_reporter_id THEN
    RAISE EXCEPTION 'You cannot report your own comment';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM comment_flags
    WHERE comment_id = p_comment_id
      AND user_id = p_reporter_id
  )
  INTO already_flagged;

  INSERT INTO comment_flags (comment_id, user_id, reason, details)
  VALUES (p_comment_id, p_reporter_id, normalized_reason, normalized_details)
  ON CONFLICT (comment_id, user_id) DO UPDATE
  SET reason = EXCLUDED.reason,
      details = EXCLUDED.details;

  IF NOT already_flagged THEN
    INSERT INTO moderation_log (
      user_id,
      actioned_by,
      comment_id,
      action,
      reason
    )
    VALUES (
      target_comment_user_id,
      p_reporter_id,
      p_comment_id,
      'content_flag',
      CASE
        WHEN normalized_details IS NOT NULL THEN normalized_reason || ': ' || normalized_details
        ELSE 'Comment reported for ' || normalized_reason
      END
    );
  END IF;

  RETURN NOT already_flagged;
END;
$$;

GRANT EXECUTE ON FUNCTION report_comment_for_moderation(uuid, uuid, text, text)
  TO authenticated;
