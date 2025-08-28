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
 * Instructions for creating the first admin user:
 * 
 * 1. Sign up a user through the /auth page
 * 2. In the Supabase SQL editor, run this query to grant admin access:
 * 
 * INSERT INTO public.user_roles (user_id, role)
 * SELECT id, 'admin'::app_role
 * FROM auth.users 
 * WHERE email = 'your-admin-email@example.com';
 * 
 * 3. The user will now have admin access to the system
 */