-- ============================================================================
-- EVALUATOR SYSTEM - RLS POLICIES & HELPER FUNCTIONS
-- Run this AFTER schema.sql (and optionally 02-09)
-- ============================================================================

-- ============================================================================
-- PROJECTS TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can read all projects" ON projects;
CREATE POLICY "Evaluators can read all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can update any project" ON projects;
CREATE POLICY "Evaluators can update any project"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

-- ============================================================================
-- QUEUE TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can read entire queue" ON queue;
CREATE POLICY "Evaluators can read entire queue"
  ON queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can update queue entries" ON queue;
CREATE POLICY "Evaluators can update queue entries"
  ON queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can delete from queue" ON queue;
CREATE POLICY "Evaluators can delete from queue"
  ON queue FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

-- ============================================================================
-- EVALUATIONS TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can create evaluations" ON evaluations;
CREATE POLICY "Evaluators can create evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = evaluator_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can read all evaluations" ON evaluations;
CREATE POLICY "Evaluators can read all evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can update evaluations" ON evaluations;
CREATE POLICY "Evaluators can update evaluations"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

-- ============================================================================
-- PROFILES TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can read all profiles" ON profiles;
CREATE POLICY "Evaluators can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_evaluator = true
    )
  );

-- ============================================================================
-- BADGES TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can create badges" ON badges;
CREATE POLICY "Evaluators can create badges"
  ON badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can update badges" ON badges;
CREATE POLICY "Evaluators can update badges"
  ON badges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

DROP POLICY IF EXISTS "Evaluators can read all badges" ON badges;
CREATE POLICY "Evaluators can read all badges"
  ON badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE - Evaluator Policies
-- ============================================================================

DROP POLICY IF EXISTS "Evaluators can create notifications" ON notifications;
CREATE POLICY "Evaluators can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_evaluator = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION make_evaluator(
  user_email text,
  role text DEFAULT 'associate'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF role NOT IN ('associate', 'senior') THEN
    RAISE EXCEPTION 'Role must be either "associate" or "senior"';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  UPDATE profiles
  SET 
    is_evaluator = true,
    evaluator_role = role
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', user_email;
  END IF;

  RAISE NOTICE 'User % is now a % evaluator', user_email, role;
END;
$$;

CREATE OR REPLACE FUNCTION remove_evaluator(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  UPDATE profiles
  SET 
    is_evaluator = false,
    evaluator_role = null
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', user_email;
  END IF;

  RAISE NOTICE 'Evaluator status removed from user %', user_email;
END;
$$;

CREATE OR REPLACE FUNCTION get_evaluator_stats(evaluator_id uuid)
RETURNS TABLE(
  total_evaluations bigint,
  avg_score numeric,
  evaluations_this_month bigint,
  current_active_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_evaluations,
    ROUND(AVG(score_total), 2) as avg_score,
    COUNT(*) FILTER (WHERE evaluated_at >= date_trunc('month', now()))::bigint as evaluations_this_month,
    (SELECT COUNT(*)::bigint FROM queue WHERE assigned_to = evaluator_id) as current_active_count
  FROM evaluations
  WHERE evaluator_id = get_evaluator_stats.evaluator_id;
END;
$$;

CREATE OR REPLACE FUNCTION list_evaluators()
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  evaluator_role text,
  total_evaluations bigint,
  avg_score numeric,
  current_active bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.evaluator_role,
    COUNT(e.id)::bigint as total_evaluations,
    ROUND(AVG(e.score_total), 2) as avg_score,
    (SELECT COUNT(*)::bigint FROM queue WHERE assigned_to = p.id) as current_active
  FROM profiles p
  LEFT JOIN evaluations e ON e.evaluator_id = p.id
  WHERE p.is_evaluator = true
  GROUP BY p.id, p.username, p.display_name, p.evaluator_role
  ORDER BY p.evaluator_role DESC, total_evaluations DESC;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION make_evaluator(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION remove_evaluator(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_evaluator_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION list_evaluators() TO authenticated;
