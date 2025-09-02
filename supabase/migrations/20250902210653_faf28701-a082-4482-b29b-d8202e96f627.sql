-- Fix the profile creation policy to allow onboarding with temporary user IDs
DROP POLICY IF EXISTS "Allow profile creation during onboarding" ON public.profiles;

-- Create a more permissive policy that allows profile creation during onboarding
-- This allows either:
-- 1. Authenticated users creating their own profile (auth.uid() = user_id)
-- 2. Unauthenticated profile creation (auth.uid() IS NULL) 
-- 3. Service role operations (for admin/system operations)
CREATE POLICY "Allow profile creation during onboarding" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL) OR 
  (auth.role() = 'service_role'::text)
);