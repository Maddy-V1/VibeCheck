-- ============================================================================
-- ROLLBACK SCRIPT - Remove File 10 Changes
-- This removes all evaluator-specific policies added by 10_evaluator_rls_policies.sql
-- Keeps everything from schema.sql and migrations 02-09
-- ============================================================================

-- ============================================================================
-- DROP EVALUATOR POLICIES
-- ============================================================================

-- Projects table
DROP POLICY IF EXISTS "Evaluators can read all projects" ON projects;
DROP POLICY IF EXISTS "Evaluators can update any project" ON projects;

-- Queue table
DROP POLICY IF EXISTS "Evaluators can read entire queue" ON queue;
DROP POLICY IF EXISTS "Evaluators can update queue entries" ON queue;
DROP POLICY IF EXISTS "Evaluators can delete from queue" ON queue;

-- Evaluations table
DROP POLICY IF EXISTS "Evaluators can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Evaluators can read all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Evaluators can update evaluations" ON evaluations;

-- Profiles table
DROP POLICY IF EXISTS "Evaluators can read all profiles" ON profiles;

-- Badges table
DROP POLICY IF EXISTS "Evaluators can create badges" ON badges;
DROP POLICY IF EXISTS "Evaluators can update badges" ON badges;
DROP POLICY IF EXISTS "Evaluators can read all badges" ON badges;

-- Notifications table
DROP POLICY IF EXISTS "Evaluators can create notifications" ON notifications;

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS make_evaluator(text, text);
DROP FUNCTION IF EXISTS remove_evaluator(text);
DROP FUNCTION IF EXISTS get_evaluator_stats(uuid);
DROP FUNCTION IF EXISTS list_evaluators();

-- ============================================================================
-- VERIFY ROLLBACK
-- ============================================================================

-- Check remaining policies (should only show policies from schema.sql)
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('projects', 'queue', 'evaluations', 'profiles', 'badges', 'notifications')
ORDER BY tablename, policyname;

-- Check remaining functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%evaluator%';

-- ============================================================================
-- DONE
-- ============================================================================

-- After running this, your database will be in the state it was after running
-- schema.sql and migrations 02-09, with NO evaluator-specific changes.
