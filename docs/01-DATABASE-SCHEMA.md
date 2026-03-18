# 01 — Database Schema (Supabase / PostgreSQL)

> Agent scope: Create all tables, RLS policies, indexes, and TypeScript types.
> Read `00-PROJECT-OVERVIEW.md` first.

---

## Rules for This Agent

- All tables use `uuid` primary keys (default `gen_random_uuid()`)
- All tables have `created_at timestamptz DEFAULT now()` and `updated_at timestamptz DEFAULT now()`
- Enable Row Level Security (RLS) on **every** table
- Create an `updated_at` trigger for all tables that have it
- Export TypeScript types from Supabase generated types — do not hand-write them

---

## Enums

```sql
CREATE TYPE user_plan AS ENUM ('free', 'priority');
CREATE TYPE community_status AS ENUM ('active', 'warned', 'suspended', 'banned');
CREATE TYPE project_tier AS ENUM ('tier1', 'tier2', 'tier3');
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'in_queue', 'evaluating', 'evaluated', 'rejected');
CREATE TYPE moderation_action AS ENUM ('warning', 'suspension', 'ban', 'reinstatement');
CREATE TYPE badge_type AS ENUM ('project_badge', 'profile_certificate');
CREATE TYPE certificate_level AS ENUM ('provisional', 'foundational', 'maker', 'builder', 'architect');
CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'insightful', 'fire', 'celebrate');
CREATE TYPE comment_status AS ENUM ('visible', 'flagged', 'hidden', 'removed');
```

---

## Table: `profiles`

Extends Supabase `auth.users`. Created automatically on user sign up via trigger.

```sql
CREATE TABLE profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            text UNIQUE NOT NULL,           -- URL slug: /u/johndoe
  display_name        text,
  avatar_url          text,
  bio                 text CHECK (char_length(bio) <= 300),
  github_username     text,
  linkedin_url        text,
  github_data         jsonb DEFAULT '{}',             -- Cached GitHub profile
  linkedin_data       jsonb DEFAULT '{}',             -- Cached LinkedIn profile
  is_profile_public   boolean DEFAULT false,          -- Flips true after first evaluated project
  profile_rating      numeric(5,2),                   -- Null until 3+ evaluated projects
  profile_rating_at   timestamptz,
  certificate_level   certificate_level,              -- Null until rating calculated
  community_status    community_status DEFAULT 'active',
  suspension_until    timestamptz,
  plan                user_plan DEFAULT 'free',
  stripe_customer_id  text,
  onboarding_done     boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

**RLS Policies:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  USING (is_profile_public = true);

-- Users can read their own profile regardless
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything (for server-side operations)
-- Handled via SUPABASE_SERVICE_ROLE_KEY — no policy needed
```

**Trigger — auto-create profile on signup:**
```sql
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Table: `projects`

```sql
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) <= 100),
  slug            text UNIQUE NOT NULL,
  description     text NOT NULL CHECK (char_length(description) <= 1000),
  tier            project_tier NOT NULL,
  live_url        text NOT NULL,
  github_url      text,
  demo_video_url  text,
  tech_stack      text[] DEFAULT '{}',
  status          project_status DEFAULT 'draft',
  queue_position  integer,
  queue_entered_at timestamptz,
  evaluation_id   uuid,                               -- FK added after evaluations table created
  is_public       boolean DEFAULT false,
  reaction_count  integer DEFAULT 0,                  -- Auto-updated by triggers
  comment_count   integer DEFAULT 0,                  -- Auto-updated by triggers
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_public ON projects(is_public);
CREATE INDEX idx_projects_reaction_count ON projects(reaction_count DESC);
CREATE INDEX idx_projects_comment_count ON projects(comment_count DESC);
CREATE INDEX idx_projects_engagement ON projects((reaction_count + comment_count) DESC);
```

**RLS Policies:**
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects viewable by all"
  ON projects FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');
```

---

## Table: `evaluations`

```sql
CREATE TABLE evaluations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id          uuid NOT NULL REFERENCES profiles(id),
  tier_confirmed        project_tier NOT NULL,
  score_total           numeric(5,2) NOT NULL,
  score_functionality   numeric(5,2) NOT NULL,    -- max 25
  score_ux              numeric(5,2) NOT NULL,    -- max 20
  score_complexity      numeric(5,2) NOT NULL,    -- max 20
  score_deployment      numeric(5,2) NOT NULL,    -- max 10
  score_code_quality    numeric(5,2) NOT NULL,    -- max 10
  score_documentation   numeric(5,2) NOT NULL,    -- max 8
  score_originality     numeric(5,2) NOT NULL,    -- max 7
  reviewer_note         text NOT NULL CHECK (char_length(reviewer_note) <= 500),
  internal_notes        text,                     -- Not shown to user
  community_scores      jsonb DEFAULT '[]',        -- Phase 3
  evaluated_at          timestamptz DEFAULT now(),
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_evaluations_project_id ON evaluations(project_id);
```

**RLS Policies:**
```sql
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Users can read evaluations for their own projects
CREATE POLICY "Users can read own evaluations"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evaluations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Anyone can read evaluations for public projects
CREATE POLICY "Public evaluations readable"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evaluations.project_id
      AND projects.is_public = true
    )
  );
```

---

## Table: `queue`

```sql
CREATE TABLE queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            user_plan NOT NULL DEFAULT 'free',
  position        integer NOT NULL,
  estimated_days  integer,
  assigned_to     uuid REFERENCES profiles(id),   -- Evaluator assigned
  assigned_at     timestamptz,
  entered_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_queue_position ON queue(position);
CREATE INDEX idx_queue_plan ON queue(plan);
```

**Queue Ordering Rule:** Priority plan always before free. Within same plan: FIFO (`entered_at ASC`).

```sql
-- Function to assign queue positions on insert
CREATE OR REPLACE FUNCTION assign_queue_position()
RETURNS trigger AS $$
DECLARE
  max_priority_pos integer;
  new_pos integer;
BEGIN
  IF NEW.plan = 'priority' THEN
    -- Priority goes after all other priority entries
    SELECT COALESCE(MAX(position), 0) INTO max_priority_pos
    FROM queue WHERE plan = 'priority';
    new_pos := max_priority_pos + 1;
    -- Shift free tier down
    UPDATE queue SET position = position + 1 WHERE plan = 'free';
  ELSE
    -- Free goes at the end
    SELECT COALESCE(MAX(position), 0) INTO new_pos FROM queue;
    new_pos := new_pos + 1;
  END IF;
  NEW.position := new_pos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_queue_insert
  BEFORE INSERT ON queue
  FOR EACH ROW EXECUTE FUNCTION assign_queue_position();
```

**RLS Policies:**
```sql
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue entry"
  ON queue FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Table: `badges`

```sql
CREATE TABLE badges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id       uuid REFERENCES projects(id),   -- Null for profile certificates
  type             badge_type NOT NULL,
  tier             project_tier,
  score            numeric(5,2),
  certificate_level certificate_level,
  certificate_url  text,                            -- PNG URL (Supabase Storage)
  pdf_url          text,                            -- PDF URL (Supabase Storage)
  shareable_link   text UNIQUE,                     -- Short public link
  verification_id  uuid UNIQUE DEFAULT gen_random_uuid(),
  is_valid         boolean DEFAULT true,
  issued_at        timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_badges_user_id ON badges(user_id);
CREATE INDEX idx_badges_verification_id ON badges(verification_id);
```

**RLS Policies:**
```sql
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are publicly readable"
  ON badges FOR SELECT
  USING (is_valid = true);
```

---

## Table: `community_posts`

```sql
CREATE TABLE community_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id          uuid REFERENCES projects(id),  -- Optional: post about a project
  parent_id           uuid REFERENCES community_posts(id), -- For replies
  body                text NOT NULL CHECK (char_length(body) <= 2000),
  is_deleted          boolean DEFAULT false,
  moderation_status   text DEFAULT 'visible' CHECK (moderation_status IN ('visible', 'flagged', 'removed')),
  reaction_count      integer DEFAULT 0,              -- Auto-updated by triggers
  comment_count       integer DEFAULT 0,              -- Auto-updated by triggers
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_posts_parent_id ON community_posts(parent_id);
CREATE INDEX idx_posts_project_id ON community_posts(project_id);
CREATE INDEX idx_community_posts_reaction_count ON community_posts(reaction_count DESC);
CREATE INDEX idx_community_posts_comment_count ON community_posts(comment_count DESC);
CREATE INDEX idx_community_posts_engagement ON community_posts((reaction_count + comment_count) DESC);
```

**RLS Policies:**
```sql
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible posts readable by authenticated users"
  ON community_posts FOR SELECT
  TO authenticated
  USING (is_deleted = false AND moderation_status = 'visible');

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
```

---

## Table: `reactions`

**Unified reactions for both community posts AND projects.**

```sql
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
CREATE INDEX idx_reactions_community_post_id ON reactions(community_post_id);
CREATE INDEX idx_reactions_project_id ON reactions(project_id);
```

**Usage:**
```typescript
// React to a community post
SELECT toggle_community_post_reaction('post-uuid', 'user-uuid', 'like');

// React to a project
SELECT toggle_project_reaction('project-uuid', 'user-uuid', 'fire');
```

**RLS Policies:**
```sql
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON reactions FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions"
  ON reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Table: `comments`

**Unified comments for both community posts AND projects.**

```sql
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
CREATE INDEX idx_comments_community_post_id ON comments(community_post_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

**Usage:**
```typescript
// Comment on a community post
SELECT add_community_post_comment('post-uuid', 'user-uuid', 'Great post!');

// Comment on a project
SELECT add_project_comment('project-uuid', 'user-uuid', 'Amazing work!');

// Reply to a comment
SELECT add_project_comment('project-uuid', 'user-uuid', 'Thanks!', 'parent-comment-uuid');
```

**RLS Policies:**
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible comments"
  ON comments FOR SELECT USING (status = 'visible');

CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Evaluators can view all comments"
  ON comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_evaluator = true));
```

---

## Table: `comment_reactions`

```sql
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
```

**Usage:**
```typescript
// React to a comment
SELECT toggle_comment_reaction('comment-uuid', 'user-uuid', 'helpful');
```

**RLS Policies:**
```sql
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment reactions"
  ON comment_reactions FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment reactions"
  ON comment_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Table: `comment_flags`

```sql
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
```

**Auto-flagging:** Comments with 3+ unique flags are automatically set to `status = 'flagged'`.

**RLS Policies:**
```sql
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flags"
  ON comment_flags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Evaluators can view all flags"
  ON comment_flags FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_evaluator = true));

CREATE POLICY "Users can create flags"
  ON comment_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Table: `moderation_log`

```sql
CREATE TABLE moderation_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id),
  actioned_by  uuid NOT NULL REFERENCES profiles(id),
  action       moderation_action NOT NULL,
  reason       text NOT NULL,
  duration_days integer,                -- Null = permanent (for bans)
  created_at   timestamptz DEFAULT now()
);
```

**RLS:** Admin-only via service role key. No public policies.

---

## Table: `notifications`

```sql
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,           -- 'evaluation_complete', 'queue_update', 'profile_unlocked', etc.
  title       text NOT NULL,
  body        text,
  link        text,                    -- In-app link to navigate to
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

**RLS Policies:**
```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Supabase Realtime — Enable for These Tables

```sql
-- Enable realtime on queue (for live position updates)
ALTER PUBLICATION supabase_realtime ADD TABLE queue;

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## TypeScript Types

Generate via Supabase CLI after all tables are created:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts
```

Then create a convenience types file at `lib/types/index.ts`:

```typescript
import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type Queue = Database['public']['Tables']['queue']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type CommunityPost = Database['public']['Tables']['community_posts']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentReaction = Database['public']['Tables']['comment_reactions']['Row']
export type CommentFlag = Database['public']['Tables']['comment_flags']['Row']

// Enums
export type ProjectTier = 'tier1' | 'tier2' | 'tier3'
export type ProjectStatus = 'draft' | 'submitted' | 'in_queue' | 'evaluating' | 'evaluated' | 'rejected'
export type CertificateLevel = 'provisional' | 'foundational' | 'maker' | 'builder' | 'architect'
export type CommunityStatus = 'active' | 'warned' | 'suspended' | 'banned'
export type ReactionType = 'like' | 'helpful' | 'insightful' | 'fire' | 'celebrate'
export type CommentStatus = 'visible' | 'flagged' | 'hidden' | 'removed'
```
