-- Add RLS policy to allow unauthenticated passcode verification
CREATE POLICY "Allow unauthenticated passcode verification" 
ON public.shows 
FOR SELECT 
USING (true);

-- Create a demo show for testing if it doesn't exist
INSERT INTO public.shows (name, production_house, passcode, status, seat_limit, duration_days, contact_email, contact_phone)
VALUES (
  'Demo Production',
  'Production Physiotherapy Demo',
  'demo100',
  'active',
  100,
  30,
  'support@productionphysiotherapy.com',
  '+1-555-0123'
)
ON CONFLICT DO NOTHING;