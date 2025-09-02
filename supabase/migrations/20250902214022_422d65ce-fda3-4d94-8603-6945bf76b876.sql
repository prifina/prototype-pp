-- Final fix for onboarding RLS policy
-- Allow unauthenticated profile creation during onboarding (user_id can be NULL)
DROP POLICY IF EXISTS "Allow profile creation during onboarding" ON public.profiles;

-- Create the definitive onboarding policy
CREATE POLICY "Allow unauthenticated onboarding profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow if no authentication (onboarding flow)
  (auth.uid() IS NULL) OR 
  -- Allow if authenticated user creating their own profile
  (auth.uid() = user_id) OR 
  -- Allow service role operations
  (auth.role() = 'service_role'::text)
);

-- Also allow the profiles table to have NULL user_id temporarily during onboarding
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add a constraint to ensure either user_id is set OR phone_number is unique per show
-- This prevents duplicate onboarding for the same phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_show_phone_unique 
ON public.profiles(show_id, phone_number) 
WHERE user_id IS NULL;