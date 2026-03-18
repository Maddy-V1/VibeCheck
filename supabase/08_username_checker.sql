-- Function to check if a username is available
-- This function runs with SECURITY DEFINER to bypass RLS policies
-- so it can check all usernames in the database

CREATE OR REPLACE FUNCTION check_username_available(
  p_username text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id uuid;
BEGIN
  -- Normalize the username (lowercase and trim)
  p_username := lower(trim(p_username));
  
  -- Check if username exists
  SELECT id INTO v_existing_user_id
  FROM profiles
  WHERE username = p_username
  LIMIT 1;
  
  -- Username is available if:
  -- 1. No user found with this username (v_existing_user_id IS NULL)
  -- 2. OR the found user is the current user (v_existing_user_id = p_user_id)
  RETURN v_existing_user_id IS NULL OR v_existing_user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_username_available(text, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION check_username_available IS 'Check if a username is available. Returns true if available or if it belongs to the specified user.';
