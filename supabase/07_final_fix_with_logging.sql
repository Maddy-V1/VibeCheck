-- ============================================================================
-- FINAL FIX: handle_new_user() with comprehensive error handling and logging
-- This will help us see exactly what's failing
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's create a logging table to capture errors
CREATE TABLE IF NOT EXISTS auth_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  error_message text,
  error_detail text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create the robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  display_name_value text;
  avatar_url_value text;
  attempt_count integer := 0;
  max_attempts integer := 10;
BEGIN
  -- Log the attempt
  INSERT INTO auth_trigger_logs (user_id, email, metadata)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data);

  -- Extract display name
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  -- Extract avatar URL
  avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';

  -- Extract and clean base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user'
  );

  -- Remove all non-alphanumeric characters except underscore
  base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'gi'));

  -- Ensure it's not empty
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || '_' || SUBSTRING(MD5(NEW.id::text), 1, 6);
  END IF;

  -- Truncate to 24 chars max (leaving room for suffix)
  base_username := SUBSTRING(base_username, 1, 24);
  final_username := base_username;

  -- Retry loop for username conflicts
  WHILE attempt_count < max_attempts LOOP
    BEGIN
      -- Attempt to insert the profile
      INSERT INTO public.profiles (
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
        display_name_value,
        avatar_url_value,
        false,
        false,
        'active',
        'free',
        false
      );
      
      -- Success! Log it and return
      UPDATE auth_trigger_logs
      SET error_message = 'SUCCESS', error_detail = 'Profile created with username: ' || final_username
      WHERE user_id = NEW.id AND error_message IS NULL;
      
      RETURN NEW;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Username already exists, try with a suffix
        attempt_count := attempt_count + 1;
        
        IF attempt_count >= max_attempts THEN
          -- Last resort: UUID-based username
          final_username := 'u_' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 20);
        ELSE
          -- Add random suffix
          final_username := SUBSTRING(base_username, 1, 20) || '_' || LPAD(attempt_count::text, 2, '0') || SUBSTRING(MD5(RANDOM()::text), 1, 4);
        END IF;
        
      WHEN check_violation THEN
        -- CHECK constraint failed (username length, etc.)
        UPDATE auth_trigger_logs
        SET error_message = 'CHECK_VIOLATION', error_detail = SQLERRM
        WHERE user_id = NEW.id AND error_message IS NULL;
        
        -- Try a completely safe username
        final_username := 'user_' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 18);
        attempt_count := attempt_count + 1;
        
      WHEN OTHERS THEN
        -- Log the unexpected error
        UPDATE auth_trigger_logs
        SET error_message = 'UNEXPECTED_ERROR', error_detail = SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')'
        WHERE user_id = NEW.id AND error_message IS NULL;
        
        -- Re-raise the error
        RAISE;
    END;
  END LOOP;

  -- If we exhausted all attempts, log and raise error
  UPDATE auth_trigger_logs
  SET error_message = 'MAX_ATTEMPTS_EXCEEDED', error_detail = 'Failed after ' || max_attempts || ' attempts'
  WHERE user_id = NEW.id AND error_message IS NULL;
  
  RAISE EXCEPTION 'Failed to create profile for user % after % attempts. Last username tried: %', NEW.id, max_attempts, final_username;
  
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions (just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- View to check logs (for debugging)
CREATE OR REPLACE VIEW auth_trigger_errors AS
SELECT * FROM auth_trigger_logs
WHERE error_message != 'SUCCESS'
ORDER BY created_at DESC;

