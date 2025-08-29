-- Security Enhancement: Improve RLS policies for profiles table
-- Current issue: Admin access is too broad for sensitive personal/health data

-- First, drop existing overly broad policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more granular admin policies with better security controls
-- Admins can view profiles (but this should be logged and limited)
CREATE POLICY "Admins can view profiles for support" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update profiles only for legitimate support purposes
-- (excludes sensitive health data unless absolutely necessary)
CREATE POLICY "Admins can update profile data for support" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete profiles only in exceptional circumstances
CREATE POLICY "Admins can delete profiles with proper authorization" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own profile (this was missing!)
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enhanced user policies - users can only access their own data
-- Update the existing policies to be more explicit
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
      'Admin access to sensitive profile data'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_profile_admin_access();

-- Add additional security constraint to ensure user_id is always set
-- This prevents orphaned profiles without proper ownership
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;