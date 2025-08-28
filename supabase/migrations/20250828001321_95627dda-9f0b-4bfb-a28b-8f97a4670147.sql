-- CRITICAL SECURITY FIX: Remove public access and implement proper RLS policies

-- Drop the existing insecure policies
DROP POLICY IF EXISTS "Service role full access to shows" ON public.shows;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to seats" ON public.seats;
DROP POLICY IF EXISTS "Service role full access to message_log" ON public.message_log;
DROP POLICY IF EXISTS "Service role full access to audit_log" ON public.audit_log;

-- Create secure RLS policies that require authentication
-- Shows: Only authenticated users can access (for admin functionality)
CREATE POLICY "Authenticated users can view shows" 
ON public.shows FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage shows" 
ON public.shows FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Profiles: HIGHLY RESTRICTED - only authenticated users can access
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage profiles" 
ON public.profiles FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Seats: Only authenticated users can access
CREATE POLICY "Authenticated users can view seats" 
ON public.seats FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage seats" 
ON public.seats FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Message Log: Only authenticated users can access
CREATE POLICY "Authenticated users can view message logs" 
ON public.message_log FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage message logs" 
ON public.message_log FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Audit Log: Only authenticated users can access
CREATE POLICY "Authenticated users can view audit logs" 
ON public.audit_log FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage audit logs" 
ON public.audit_log FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');