-- Create demo admin credentials (simpler approach)
-- This assumes the user will be created via Supabase Dashboard first
-- Email: admin@productionphysio.com  
-- Password: Admin123!

-- First, let's create a temporary way to identify our admin user if they sign up
-- We'll create the user role assignment that will work when the admin signs up

-- Note: This will need to be run after creating the user in Supabase Dashboard
-- For now, we'll prepare the infrastructure

-- Create a function to automatically grant admin role to specific emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-assign admin role to demo admin account
  IF NEW.email = 'admin@productionphysio.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin role on user creation
DROP TRIGGER IF EXISTS auto_assign_admin_role_trigger ON auth.users;
CREATE TRIGGER auto_assign_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();