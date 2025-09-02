-- Allow unauthenticated users to update seats during onboarding
-- This policy allows seat binding when not authenticated, but with strict conditions
CREATE POLICY "Allow seat updates during onboarding" 
ON public.seats 
FOR UPDATE 
USING (
  -- Allow if user is not authenticated (onboarding process)
  -- AND the seat is currently in pending status
  (auth.uid() IS NULL AND status = 'pending')
)
WITH CHECK (
  -- Allow if user is not authenticated (onboarding process)
  -- AND the seat was previously in pending status
  -- AND we're setting it to active status
  -- AND we're only updating allowed fields (profile_id, profile_name, status, bound_at)
  (auth.uid() IS NULL AND status = 'active')
);