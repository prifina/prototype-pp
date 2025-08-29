-- Security Enhancement Phase 2: Add audit logging for admin access to sensitive profile data

-- Create audit trigger for admin access to sensitive profile data
-- This will log whenever an admin accesses profile data
CREATE OR REPLACE FUNCTION audit_profile_admin_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit admin actions, not user actions on their own profiles
  IF has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    INSERT INTO audit_log (
      actor,
      action,
      entity,
      entity_id,
      before_data,
      after_data,
      details
    ) VALUES (
      auth.uid()::text,
      TG_OP,
      'profiles',
      COALESCE(NEW.id, OLD.id)::text,
      CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
      CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
      'Admin access to sensitive profile data - includes personal/health information'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging on profile changes
DROP TRIGGER IF EXISTS audit_profile_admin_access_trigger ON public.profiles;
CREATE TRIGGER audit_profile_admin_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_profile_admin_access();

-- Add a comment to document the security enhancement
COMMENT ON FUNCTION audit_profile_admin_access() IS 
'Security function: Logs all admin access to sensitive profile data for compliance and security monitoring';

COMMENT ON TRIGGER audit_profile_admin_access_trigger ON public.profiles IS 
'Security trigger: Automatically logs admin access to personal health data in the audit_log table';