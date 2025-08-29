-- Fix security warning: Function Search Path Mutable
-- Update the audit function to have a secure search path

CREATE OR REPLACE FUNCTION audit_profile_admin_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only audit admin actions, not user actions on their own profiles
  IF has_role(auth.uid(), 'admin'::app_role) AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    INSERT INTO public.audit_log (
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
$$;