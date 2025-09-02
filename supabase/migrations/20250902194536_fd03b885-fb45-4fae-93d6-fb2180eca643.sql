-- Fix RLS policy conflict on profiles table
-- Remove the conflicting "Users can create their own profile" policy
-- Keep the flexible "Allow profile creation during onboarding" policy that handles both cases

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;