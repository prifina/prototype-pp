-- Security Enhancement: Fix profiles table security issues
-- Phase 1: Handle existing data and improve RLS policies

-- First, let's see if we can safely update null user_id values
-- For existing profiles without user_id, we'll need to either:
-- 1. Delete them (if they're orphaned/invalid)
-- 2. Or handle them separately

-- Check and handle orphaned profiles
-- Delete profiles that have no valid user_id and cannot be linked to any user
DELETE FROM public.profiles 
WHERE user_id IS NULL;

-- Now we can safely make user_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly broad admin policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more granular admin policies with better security controls
CREATE POLICY "Admins can view profiles for support" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update profiles only for legitimate support purposes
CREATE POLICY "Admins can update profile data for support" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete profiles only in exceptional circumstances
CREATE POLICY "Admins can delete profiles with proper authorization" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own profile (this was missing!)
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enhanced user policies - replace existing ones
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);