-- ============================================================================
-- FINAL FIX: handle_new_user() trigger
-- This ensures ALL required columns are properly handled during signup
-- Run this in Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  suffix text;
  retry_count integer := 0;
  max_retries integer := 5;
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
  final_username := base_username;

  -- Retry loop for handling username conflicts
  LOOP
    BEGIN
      INSERT INTO profiles (
        id,
        username,
        display_name,
        avatar_url,
        onboarding_done,
        is_profile_public,
        community_status,
        plan,
        is_evaluator
      )
      VALUES (
        NEW.id,
        final_username,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        false,  -- onboarding_done
        false,  -- is_profile_public
        'active',  -- community_status
        'free',  -- plan
        false  -- is_evaluator
      );
      
      -- Success! Exit the loop
      RETURN NEW;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Username taken, try with a suffix
        retry_count := retry_count + 1;
        
        IF retry_count > max_retries THEN
          -- Give up and use a guaranteed unique username
          final_username := 'user_' || substr(md5(NEW.id::text || random()::text), 1, 20);
        ELSE
          -- Append random suffix and retry
          suffix := substr(md5(random()::text), 1, 6);
          final_username := base_username || '_' || suffix;
        END IF;
        
      WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE WARNING 'Error creating profile for user %: % %', NEW.id, SQLERRM, SQLSTATE;
        RAISE;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

