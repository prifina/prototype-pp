-- Function to link onboarded profiles to authenticated users
CREATE OR REPLACE FUNCTION public.link_profile_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- When a user signs up, try to link them to an existing onboarded profile
  -- Match by phone number
  UPDATE public.profiles 
  SET user_id = NEW.id
  WHERE user_id IS NULL 
    AND phone_number = COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone')
    AND phone_number IS NOT NULL;
  
  -- If no existing profile was linked, the existing trigger will create a new one
  RETURN NEW;
END;
$$;

-- Update the existing auth trigger to use the new linking function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_profile_to_user();