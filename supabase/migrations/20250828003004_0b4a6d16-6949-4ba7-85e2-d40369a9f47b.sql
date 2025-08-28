-- Create demo admin credentials
-- Email: admin@productionphysio.com
-- Password: Admin123!

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@productionphysio.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Grant admin role to the demo user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@productionphysio.com';

-- Create profile for admin user
INSERT INTO public.profiles (
  user_id, 
  first_name, 
  last_name, 
  phone_number,
  email
)
SELECT 
  id, 
  'System', 
  'Administrator', 
  '+1-555-0123',
  'admin@productionphysio.com'
FROM auth.users 
WHERE email = 'admin@productionphysio.com';