-- Add RLS policy to allow unauthenticated seat lookup for onboarding
CREATE POLICY "Allow unauthenticated onboarding seat lookup"
ON public.seats
FOR SELECT
USING (
  -- Allow unauthenticated users to view pending seats in active shows
  auth.uid() IS NULL 
  AND status = 'pending'
  AND show_id IN (
    SELECT id FROM public.shows WHERE status = 'active'
  )
);