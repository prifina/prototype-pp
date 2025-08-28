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
 * To create admin accounts for this system, follow these steps:
 * 
 * 1. Go to Supabase Dashboard > Authentication > Users
 * 2. Click "Invite a user" or "Add user"
 * 3. Enter the admin's email and a temporary password
 * 4. After creating the user, note their User ID
 * 5. Go to SQL Editor and run this query to grant admin access:
 * 
 * INSERT INTO public.user_roles (user_id, role)
 * VALUES ('[USER_ID_FROM_STEP_4]', 'admin'::app_role);
 * 
 * 6. The user can now sign in at /auth with admin privileges
 * 
 * ALTERNATIVE: Create user via SQL Editor:
 * This creates both the auth user and grants admin role in one step:
 * 
 * -- First, insert the auth user (replace email/password)
 * INSERT INTO auth.users (
 *   instance_id,
 *   id,
 *   aud,
 *   role,
 *   email,
 *   encrypted_password,
 *   email_confirmed_at,
 *   created_at,
 *   updated_at,
 *   confirmation_token,
 *   email_change,
 *   email_change_token,
 *   recovery_token
 * ) VALUES (
 *   '00000000-0000-0000-0000-000000000000',
 *   gen_random_uuid(),
 *   'authenticated',
 *   'authenticated',
 *   'admin@example.com',
 *   crypt('your-password', gen_salt('bf')),
 *   NOW(),
 *   NOW(),
 *   NOW(),
 *   '',
 *   '',
 *   '',
 *   ''
 * );
 * 
 * -- Then grant admin role
 * INSERT INTO public.user_roles (user_id, role)
 * SELECT id, 'admin'::app_role 
 * FROM auth.users 
 * WHERE email = 'admin@example.com';
 */