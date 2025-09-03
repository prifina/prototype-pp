-- Remove foreign key constraint that blocks onboarding with temporary user IDs
-- This allows profiles to be created during onboarding before users actually sign up
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Add a comment to document this change
COMMENT ON COLUMN public.profiles.user_id IS 'User ID - can be temporary UUID during onboarding, linked to auth.users after signup';