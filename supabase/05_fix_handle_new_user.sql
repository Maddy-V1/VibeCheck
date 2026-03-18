-- FIX: More robust handle_new_user() trigger
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  suffix text;
BEGIN
  -- Build a safe base username: strip non-alphanumeric chars, ensure min 3 chars
  base_username := LOWER(
    REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'preferred_username',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      '[^a-zA-Z0-9_]', '', 'g'
    )
  );

  -- Ensure minimum 3 characters
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(NEW.id::text), 1, 8);
  END IF;

  -- Truncate to 24 chars to leave room for suffix
  base_username := substr(base_username, 1, 24);

  -- Try inserting with the base username
  BEGIN
    INSERT INTO profiles (id, username, display_name, avatar_url)
    VALUES (
      NEW.id,
      base_username,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
  EXCEPTION
    WHEN unique_violation THEN
      -- Username taken, append random suffix
      suffix := substr(md5(random()::text), 1, 6);
      final_username := base_username || '_' || suffix;

      INSERT INTO profiles (id, username, display_name, avatar_url)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url'
      );
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
