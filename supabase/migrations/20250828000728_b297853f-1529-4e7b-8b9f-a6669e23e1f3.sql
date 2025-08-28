-- Create core database schema for Production Physiotherapy AI Twin

-- Core Shows and Productions
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  passcode TEXT NOT NULL UNIQUE,
  production_house TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  seat_limit INTEGER DEFAULT 100,
  duration_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles from Onboarding
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  tour_or_resident TEXT CHECK (tour_or_resident IN ('tour', 'resident')),
  sleep_environment JSONB DEFAULT '{}'::jsonb,
  dietary_info JSONB DEFAULT '{}'::jsonb,
  health_goals JSONB DEFAULT '{}'::jsonb,
  consent_data JSONB DEFAULT '{}'::jsonb,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(show_id, phone_number)
);

-- Seats for WhatsApp Access
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seat_code TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  whatsapp_id TEXT,
  twin_id TEXT,
  profile_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  bound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message Logging for WhatsApp Communications
CREATE TABLE public.message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID REFERENCES public.seats(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  whatsapp_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_body TEXT NOT NULL,
  message_sid TEXT,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'binding', 'system', 'notification')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Log for Admin Actions
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX idx_profiles_show_phone ON public.profiles(show_id, phone_number);
CREATE INDEX idx_seats_show_status ON public.seats(show_id, status);
CREATE INDEX idx_seats_phone ON public.seats(phone_number);
CREATE INDEX idx_seats_code ON public.seats(seat_code);
CREATE INDEX idx_seats_whatsapp ON public.seats(whatsapp_id);
CREATE INDEX idx_message_log_seat ON public.message_log(seat_id);
CREATE INDEX idx_message_log_phone ON public.message_log(phone_number);
CREATE INDEX idx_message_log_whatsapp ON public.message_log(whatsapp_id);
CREATE INDEX idx_audit_log_show ON public.audit_log(show_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor);

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated At Triggers
CREATE TRIGGER update_shows_updated_at 
  BEFORE UPDATE ON public.shows 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at 
  BEFORE UPDATE ON public.seats 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role access for admin functions)
CREATE POLICY "Service role full access to shows" 
ON public.shows FOR ALL 
USING (true);

CREATE POLICY "Service role full access to profiles" 
ON public.profiles FOR ALL 
USING (true);

CREATE POLICY "Service role full access to seats" 
ON public.seats FOR ALL 
USING (true);

CREATE POLICY "Service role full access to message_log" 
ON public.message_log FOR ALL 
USING (true);

CREATE POLICY "Service role full access to audit_log" 
ON public.audit_log FOR ALL 
USING (true);

-- Insert sample data
INSERT INTO public.shows (name, passcode, production_house, contact_email, seat_limit) VALUES 
  ('Production Physio AI Twin', 'PHYSIO2024', 'Production Physiotherapy', 'admin@productionphysio.com', 100);