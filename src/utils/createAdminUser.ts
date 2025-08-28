import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to grant admin access to a user
 * This should be called by a system administrator after a user signs up
 */
export const grantAdminAccess = async (userEmail: string): Promise<void> => {
  try {
    // First, find the user by email
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', userEmail)
      .limit(1);

    if (userError) {
      throw new Error(`Failed to find user: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    const userId = users[0].user_id;

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      console.log(`User ${userEmail} already has admin access`);
      return;
    }

    // Grant admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });

    if (roleError) {
      throw new Error(`Failed to grant admin access: ${roleError.message}`);
    }

    console.log(`Successfully granted admin access to ${userEmail}`);
  } catch (error) {
    console.error('Error granting admin access:', error);
    throw error;
  }
};

/**
 * ADMIN ACCOUNT SETUP INSTRUCTIONS
 * 
 * Demo Admin Credentials (Ready to use):
 * Email: admin@productionphysio.com
 * Password: Admin123!
 * 
 * The system is pre-configured with auto-assignment of admin roles for specific emails.
 * 
 * To Create Additional Admin Accounts:
 * 
 * METHOD 1 - Via Supabase Dashboard (Recommended):
 * 1. Go to Supabase Dashboard > Authentication > Users
 * 2. Click "Invite a user" or "Add user"
 * 3. Enter the admin's email and a password
 * 4. The auto-assignment trigger will check if the email is in the approved list
 * 5. To add a new email to auto-assignment, update the trigger function:
 * 
 * UPDATE the auto_assign_admin_role() function in Supabase SQL Editor:
 * 
 * CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
 * RETURNS trigger
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = 'public'
 * AS $$
 * BEGIN
 *   -- Add your admin emails here
 *   IF NEW.email IN ('admin@productionphysio.com', 'your-new-admin@domain.com') THEN
 *     INSERT INTO public.user_roles (user_id, role)
 *     VALUES (NEW.id, 'admin'::app_role)
 *     ON CONFLICT (user_id, role) DO NOTHING;
 *   END IF;
 *   
 *   RETURN NEW;
 * END;
 * $$;
 * 
 * METHOD 2 - Manual Role Assignment:
 * 1. Create user via Dashboard
 * 2. Run SQL to grant admin role:
 * 
 * INSERT INTO public.user_roles (user_id, role)
 * SELECT id, 'admin'::app_role 
 * FROM auth.users 
 * WHERE email = 'new-admin@domain.com';
 * 
 * METHOD 3 - Complete SQL Creation:
 * 
 * -- Create user and grant admin role in one step
 * INSERT INTO auth.users (
 *   instance_id, id, aud, role, email, encrypted_password,
 *   email_confirmed_at, created_at, updated_at
 * ) VALUES (
 *   '00000000-0000-0000-0000-000000000000',
 *   gen_random_uuid(), 'authenticated', 'authenticated',
 *   'admin@yourcompany.com', crypt('SecurePassword123!', gen_salt('bf')),
 *   NOW(), NOW(), NOW()
 * );
 * 
 * -- Then grant admin role (if not using auto-assignment)
 * INSERT INTO public.user_roles (user_id, role)
 * SELECT id, 'admin'::app_role 
 * FROM auth.users 
 * WHERE email = 'admin@yourcompany.com';
 */