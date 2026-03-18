-- Queue position assignment trigger
-- This trigger automatically assigns queue positions when a new entry is inserted
-- Priority plan entries are placed before free plan entries

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

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS before_queue_insert ON queue;
CREATE TRIGGER before_queue_insert
  BEFORE INSERT ON queue
  FOR EACH ROW EXECUTE FUNCTION assign_queue_position();

-- Queue position shift trigger
-- When a project is removed from queue, shift remaining positions up

CREATE OR REPLACE FUNCTION shift_queue_positions()
RETURNS trigger AS $$
BEGIN
  UPDATE queue
  SET position = position - 1
  WHERE position > OLD.position;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS after_queue_delete ON queue;
CREATE TRIGGER after_queue_delete
  AFTER DELETE ON queue
  FOR EACH ROW EXECUTE FUNCTION shift_queue_positions();

-- Enable realtime for queue table (safe to run multiple times)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE queue;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
