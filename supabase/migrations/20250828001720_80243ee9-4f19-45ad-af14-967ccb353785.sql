-- COMPREHENSIVE SECURITY FIX: Implement user roles and proper RLS policies

-- 1. Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Add user_id column to profiles table and link to auth.users
ALTER TABLE public.profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Create trigger to auto-create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, phone_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', new.phone, '')
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view shows" ON public.shows;
DROP POLICY IF EXISTS "Authenticated users can manage shows" ON public.shows;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view seats" ON public.seats;
DROP POLICY IF EXISTS "Authenticated users can manage seats" ON public.seats;
DROP POLICY IF EXISTS "Authenticated users can view message logs" ON public.message_log;
DROP POLICY IF EXISTS "Authenticated users can manage message logs" ON public.message_log;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Authenticated users can manage audit logs" ON public.audit_log;

-- 6. Create secure user-scoped RLS policies

-- PROFILES: Users can only access their own profile data
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- MESSAGE_LOG: Users can only see messages for their own seats/profiles
CREATE POLICY "Users can view own messages" 
ON public.message_log FOR SELECT 
USING (
  seat_id IN (
    SELECT s.id FROM public.seats s 
    JOIN public.profiles p ON s.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all messages" 
ON public.message_log FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage messages" 
ON public.message_log FOR ALL 
USING (auth.role() = 'service_role');

-- SEATS: Users can only access seats linked to their profile
CREATE POLICY "Users can view own seats" 
ON public.seats FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all seats" 
ON public.seats FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all seats" 
ON public.seats FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- SHOWS: Only admins and staff can access shows
CREATE POLICY "Admins can view shows" 
ON public.shows FOR SELECT 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can manage shows" 
ON public.shows FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOG: Only admins can access audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_log FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage audit logs" 
ON public.audit_log FOR ALL 
USING (auth.role() = 'service_role');

-- USER_ROLES: Users can view their own roles, admins can manage all
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));