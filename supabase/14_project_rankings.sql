DO $$ BEGIN
  CREATE TYPE ranking_period AS ENUM ('weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS project_rankings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type   ranking_period NOT NULL,
  period_start  timestamptz NOT NULL,
  period_end    timestamptz NOT NULL,
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  selected_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  selected_at   timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT project_rankings_unique_selection UNIQUE (period_type, period_start, project_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_period_score
  ON evaluations(evaluated_at DESC, score_total DESC);

CREATE INDEX IF NOT EXISTS idx_project_rankings_period
  ON project_rankings(period_type, period_start);

CREATE INDEX IF NOT EXISTS idx_project_rankings_project_id
  ON project_rankings(project_id);

CREATE INDEX IF NOT EXISTS idx_project_rankings_evaluation_id
  ON project_rankings(evaluation_id);

ALTER TABLE project_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published rankings are readable" ON project_rankings;
CREATE POLICY "Published rankings are readable"
  ON project_rankings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM projects
      WHERE projects.id = project_rankings.project_id
        AND projects.is_public = true
        AND projects.status = 'evaluated'
    )
  );
