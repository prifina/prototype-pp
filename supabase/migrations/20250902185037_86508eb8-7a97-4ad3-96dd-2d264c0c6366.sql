-- Allow unauthenticated users to create profiles during onboarding
-- This policy allows profile creation with a temporary user_id when not authenticated
CREATE POLICY "Allow profile creation during onboarding" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and matches user_id
  (auth.uid() = user_id) OR 
  -- Allow if user is not authenticated (onboarding process)
  (auth.uid() IS NULL)
);