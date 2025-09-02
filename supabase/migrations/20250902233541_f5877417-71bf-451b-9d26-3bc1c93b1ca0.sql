-- Fix the NULL comparison bug in the profiles INSERT policy
-- The issue: NULL = NULL evaluates to UNKNOWN in SQL, not TRUE
-- This was causing onboarding to fail even with proper unauthenticated client

-- Drop the broken policy
DROP POLICY IF EXISTS "Allow unauthenticated onboarding profile creation" ON public.profiles;

-- Create the fixed policy with proper NULL handling
CREATE POLICY "Allow unauthenticated onboarding profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Case 1: Unauthenticated onboarding (both must be NULL)
  (auth.uid() IS NULL AND user_id IS NULL) OR 
  
  -- Case 2: Authenticated user creating their own profile (neither can be NULL)
  (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id) OR 
  
  -- Case 3: Service role can do anything
  (auth.role() = 'service_role'::text)
);

-- Add a comment explaining the fix for future reference
COMMENT ON POLICY "Allow unauthenticated onboarding profile creation" ON public.profiles IS 
'Fixed NULL comparison bug. Explicitly checks (auth.uid() IS NULL AND user_id IS NULL) for onboarding flow, avoiding SQL NULL = NULL comparison issue.';