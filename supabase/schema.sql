-- VibeCheck Database Schema
-- Run this entire file in Supabase SQL Editor
-- This script is idempotent - safe to run multiple times

-- ============================================================================
-- ENUMS (with duplicate handling)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'priority');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE community_status AS ENUM ('active', 'warned', 'suspended', 'banned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_tier AS ENUM ('tier1', 'tier2', 'tier3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'in_queue', 'evaluating', 'evaluated', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_action AS ENUM ('warning', 'suspension', 'ban', 'reinstatement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_type AS ENUM ('project_badge', 'profile_certificate');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE certificate_level AS ENUM ('provisional', 'foundational', 'maker', 'builder', 'architect');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            text UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  display_name        text,
  avatar_url          text,
  bio                 text CHECK (bio IS NULL OR char_length(bio) <= 300),
  github_username     text,
  linkedin_url        text,
  github_data         jsonb DEFAULT '{}',
  linkedin_data       jsonb DEFAULT '{}',
  is_profile_public   boolean DEFAULT false,
  profile_rating      numeric(5,2) CHECK (profile_rating IS NULL OR (profile_rating >= 0 AND profile_rating <= 100)),
  profile_rating_at   timestamptz,
  certificate_level   certificate_level,
  community_status    community_status DEFAULT 'active',
  suspension_until    timestamptz,
  plan                user_plan DEFAULT 'free',
  stripe_customer_id  text,
  onboarding_done     boolean DEFAULT false,
  is_evaluator        boolean DEFAULT false,
  evaluator_role      text CHECK (evaluator_role IS NULL OR (is_evaluator = true AND evaluator_role IN ('associate', 'senior'))),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Projects table (evaluation_id added later to avoid circular dependency)
CREATE TABLE IF NOT EXISTS projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) <= 100 AND char_length(title) >= 3),
  slug            text UNIQUE NOT NULL,
  description     text NOT NULL CHECK (char_length(description) <= 1000 AND char_length(description) >= 50),
  tier            project_tier NOT NULL,
  live_url        text NOT NULL,
  github_url      text,
  demo_video_url  text,
  tech_stack      text[] DEFAULT '{}',
  status          project_status DEFAULT 'draft',
  queue_position  integer,
  queue_entered_at timestamptz,
  evaluation_id   uuid,
  is_public       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Evaluations table (UNIQUE constraint on project_id - one evaluation per project)
CREATE TABLE IF NOT EXISTS evaluations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  tier_confirmed        project_tier NOT NULL,
  score_total           numeric(5,2) NOT NULL CHECK (score_total >= 0 AND score_total <= 100),
  score_functionality   numeric(5,2) NOT NULL CHECK (score_functionality >= 0 AND score_functionality <= 25),
  score_ux              numeric(5,2) NOT NULL CHECK (score_ux >= 0 AND score_ux <= 20),
  score_complexity      numeric(5,2) NOT NULL CHECK (score_complexity >= 0 AND score_complexity <= 20),
  score_deployment      numeric(5,2) NOT NULL CHECK (score_deployment >= 0 AND score_deployment <= 10),
  score_code_quality    numeric(5,2) NOT NULL CHECK (score_code_quality >= 0 AND score_code_quality <= 10),
  score_documentation   numeric(5,2) NOT NULL CHECK (score_documentation >= 0 AND score_documentation <= 8),
  score_originality     numeric(5,2) NOT NULL CHECK (score_originality >= 0 AND score_originality <= 7),
  reviewer_note         text NOT NULL CHECK (char_length(reviewer_note) >= 50 AND char_length(reviewer_note) <= 500),
  internal_notes        text,
  community_scores      jsonb DEFAULT '[]',
  evaluated_at          timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);

-- Add foreign key constraint for projects.evaluation_id after evaluations table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_evaluation_id_fkey'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_evaluation_id_fkey 
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_evaluation_id ON projects(evaluation_id);

-- Queue table
CREATE TABLE IF NOT EXISTS queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            user_plan NOT NULL DEFAULT 'free',
  position        integer NOT NULL CHECK (position > 0),
  estimated_days  integer CHECK (estimated_days IS NULL OR estimated_days >= 0),
  assigned_to     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at     timestamptz,
  entered_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queue_position ON queue(position);
CREATE INDEX IF NOT EXISTS idx_queue_plan ON queue(plan);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_plan_position ON queue(plan, position);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id       uuid REFERENCES projects(id) ON DELETE CASCADE,
  type             badge_type NOT NULL,
  tier             project_tier,
  score            numeric(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  certificate_level certificate_level,
  certificate_url  text,
  pdf_url          text,
  shareable_link   text UNIQUE,
  verification_id  uuid UNIQUE DEFAULT gen_random_uuid(),
  is_valid         boolean DEFAULT true,
  issued_at        timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT badge_project_check CHECK (
    (type = 'project_badge' AND project_id IS NOT NULL) OR
    (type = 'profile_certificate' AND project_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_project_id ON badges(project_id);
CREATE INDEX IF NOT EXISTS idx_badges_verification_id ON badges(verification_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(type);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id          uuid REFERENCES projects(id) ON DELETE CASCADE,
  parent_id           uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  body                text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  is_deleted          boolean DEFAULT false,
  moderation_status   text DEFAULT 'visible' CHECK (moderation_status IN ('visible', 'flagged', 'removed')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON community_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_project_id ON community_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON community_posts(moderation_status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_feed ON community_posts(moderation_status, is_deleted, created_at DESC) WHERE moderation_status = 'visible' AND is_deleted = false;

-- Moderation log table
CREATE TABLE IF NOT EXISTS moderation_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actioned_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action       moderation_action NOT NULL,
  reason       text NOT NULL CHECK (char_length(reason) >= 10),
  duration_days integer CHECK (duration_days IS NULL OR duration_days > 0),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_user_id ON moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created_at ON moderation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON moderation_log(action);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  link        text,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-create profile on user signup (with duplicate username handling)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'user_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_')),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle duplicate username by appending random suffix
    INSERT INTO profiles (id, username, display_name, avatar_url)
    VALUES (
      NEW.id,
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'user_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_')) || '_' || substr(md5(random()::text), 1, 6),
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Queue position assignment
CREATE OR REPLACE FUNCTION assign_queue_position()
RETURNS trigger AS $$
DECLARE
  max_priority_pos integer;
  new_pos integer;
BEGIN
  -- Lock the queue table to prevent race conditions during position assignment
  LOCK TABLE queue IN SHARE ROW EXCLUSIVE MODE;
  
  IF NEW.plan = 'priority' THEN
    SELECT COALESCE(MAX(position), 0) INTO max_priority_pos
    FROM queue WHERE plan = 'priority';
    new_pos := max_priority_pos + 1;
    UPDATE queue SET position = position + 1 WHERE plan = 'free';
  ELSE
    SELECT COALESCE(MAX(position), 0) INTO new_pos FROM queue;
    new_pos := new_pos + 1;
  END IF;
  NEW.position := new_pos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_queue_insert ON queue;
CREATE TRIGGER before_queue_insert
  BEFORE INSERT ON queue
  FOR EACH ROW EXECUTE FUNCTION assign_queue_position();

-- Shift queue positions after deletion
CREATE OR REPLACE FUNCTION shift_queue_positions()
RETURNS trigger AS $$
BEGIN
  UPDATE queue
  SET position = position - 1
  WHERE position > OLD.position;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_queue_delete ON queue;
CREATE TRIGGER after_queue_delete
  AFTER DELETE ON queue
  FOR EACH ROW EXECUTE FUNCTION shift_queue_positions();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Validate evaluation score totals match sum of components
CREATE OR REPLACE FUNCTION validate_evaluation_scores()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total numeric(5,2);
BEGIN
  calculated_total := NEW.score_functionality + NEW.score_ux + NEW.score_complexity + 
                      NEW.score_deployment + NEW.score_code_quality + NEW.score_documentation + 
                      NEW.score_originality;
  
  IF ABS(calculated_total - NEW.score_total) > 0.01 THEN
    RAISE EXCEPTION 'Score total (%) does not match sum of components (%)', NEW.score_total, calculated_total;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_evaluation_scores_trigger ON evaluations;
CREATE TRIGGER validate_evaluation_scores_trigger
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION validate_evaluation_scores();

-- Prevent self-referencing or deeply nested community posts
CREATE OR REPLACE FUNCTION validate_community_post_parent()
RETURNS TRIGGER AS $$
DECLARE
  parent_parent_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Check if parent exists and get its parent_id
    SELECT parent_id INTO parent_parent_id
    FROM community_posts
    WHERE id = NEW.parent_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent post does not exist';
    END IF;
    
    -- Prevent replies to replies (only 1 level deep)
    IF parent_parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot reply to a reply. Only one level of nesting allowed.';
    END IF;
    
    -- Prevent self-reference
    IF NEW.id = NEW.parent_id THEN
      RAISE EXCEPTION 'Post cannot be its own parent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_community_post_parent_trigger ON community_posts;
CREATE TRIGGER validate_community_post_parent_trigger
  BEFORE INSERT OR UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION validate_community_post_parent();

-- Auto-reinstate suspended users when suspension expires
CREATE OR REPLACE FUNCTION check_suspension_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.suspension_until IS NOT NULL AND NEW.suspension_until <= now() THEN
    NEW.community_status := 'active';
    NEW.suspension_until := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_suspension_expiry_trigger ON profiles;
CREATE TRIGGER check_suspension_expiry_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.community_status = 'suspended')
  EXECUTE FUNCTION check_suspension_expiry();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  USING (is_profile_public = true);

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public projects viewable by all" ON projects;
CREATE POLICY "Public projects viewable by all"
  ON projects FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own draft projects" ON projects;
CREATE POLICY "Users can update own draft projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Evaluations RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own evaluations" ON evaluations;
CREATE POLICY "Users can read own evaluations"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evaluations.project_id
      AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public evaluations readable" ON evaluations;
CREATE POLICY "Public evaluations readable"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evaluations.project_id
      AND projects.is_public = true
    )
  );

-- Queue RLS
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queue entry" ON queue;
CREATE POLICY "Users can view own queue entry"
  ON queue FOR SELECT
  USING (auth.uid() = user_id);

-- Badges RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are publicly readable" ON badges;
CREATE POLICY "Badges are publicly readable"
  ON badges FOR SELECT
  USING (is_valid = true);

-- Community posts RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible posts readable by authenticated users" ON community_posts;
CREATE POLICY "Visible posts readable by authenticated users"
  ON community_posts FOR SELECT
  TO authenticated
  USING (is_deleted = false AND moderation_status = 'visible');

DROP POLICY IF EXISTS "Users can read own posts" ON community_posts;
CREATE POLICY "Users can read own posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users with evaluated projects can post" ON community_posts;
CREATE POLICY "Users with evaluated projects can post"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.user_id = auth.uid()
      AND projects.status = 'evaluated'
    ) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.community_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update own posts within 15 minutes" ON community_posts;
CREATE POLICY "Users can update own posts within 15 minutes"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    is_deleted = false AND
    created_at > (now() - interval '15 minutes')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    is_deleted = false
  );

DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Moderation log RLS (admin only via service role)
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for queue and notifications
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE queue;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
