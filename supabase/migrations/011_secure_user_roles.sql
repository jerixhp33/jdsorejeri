-- ============================================================
-- Fix Privilege Escalation in user_profiles
-- ============================================================

-- Prevent users from updating their own role
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- If the user executing is not an admin, and they are trying to change the role
  IF (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) NOT IN ('admin', 'super_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You do not have permission to change your role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON user_profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();
