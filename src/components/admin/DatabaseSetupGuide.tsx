import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Database, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DatabaseSetupGuide = () => {
  const [copiedStep, setCopiedStep] = useState<string>('');
  const { toast } = useToast();

  const copyToClipboard = async (text: string, stepName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepName);
      setTimeout(() => setCopiedStep(''), 2000);
      toast({
        title: "Copied!",
        description: `${stepName} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the text manually",
        variant: "destructive",
      });
    }
  };

  const dbSchema = `-- Core Shows and Productions
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  passcode TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  settings JSONB DEFAULT '{}'::jsonb
);

-- User Profiles from Onboarding
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  sleep_environment JSONB,
  dietary_info JSONB,
  health_goals JSONB,
  consent_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(show_id, phone_number)
);

-- Seats for WhatsApp Access
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  twin_id TEXT,
  profile_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  bound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message Logging for WhatsApp
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_body TEXT NOT NULL,
  message_sid TEXT,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'binding', 'system')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Log for Admin Actions
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  admin_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX idx_profiles_show_phone ON profiles(show_id, phone_number);
CREATE INDEX idx_seats_show_status ON seats(show_id, status);
CREATE INDEX idx_seats_phone ON seats(phone_number);
CREATE INDEX idx_seats_code ON seats(seat_code);
CREATE INDEX idx_message_log_seat ON message_log(seat_id);
CREATE INDEX idx_message_log_phone ON message_log(phone_number);
CREATE INDEX idx_audit_log_show ON audit_log(show_id);

-- Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

  const rlsPolicies = `-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Shows
CREATE POLICY "Shows are viewable by service role" ON shows FOR ALL USING (true);

-- RLS Policies for Profiles
CREATE POLICY "Profiles are viewable by service role" ON profiles FOR ALL USING (true);

-- RLS Policies for Seats
CREATE POLICY "Seats are viewable by service role" ON seats FOR ALL USING (true);

-- RLS Policies for Message Log
CREATE POLICY "Message log is viewable by service role" ON message_log FOR ALL USING (true);

-- RLS Policies for Audit Log
CREATE POLICY "Audit log is viewable by service role" ON audit_log FOR ALL USING (true);`;

  const sampleData = `-- Sample Show Data
INSERT INTO shows (name, passcode) VALUES 
  ('Production Physio AI', 'PHYSIO2024'),
  ('Demo Show', 'DEMO123');

-- Sample Profile Data (Replace with actual data)
INSERT INTO profiles (show_id, phone_number, first_name, last_name, email) VALUES
  ((SELECT id FROM shows WHERE name = 'Production Physio AI'), '+1234567890', 'John', 'Doe', 'john@example.com');`;

  const secretsSetup = `TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number
OPENAI_API_KEY=your_openai_api_key
PRODUCTION_API_BASE_URL=your_production_api_url
PRODUCTION_API_KEY=your_production_api_key`;

  const steps = [
    {
      title: "Database Schema",
      description: "Create the core tables and indexes",
      code: dbSchema,
      status: "required"
    },
    {
      title: "RLS Policies", 
      description: "Set up Row Level Security policies",
      code: rlsPolicies,
      status: "required"
    },
    {
      title: "Sample Data",
      description: "Insert initial test data (optional)",
      code: sampleData,
      status: "optional"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete this setup in your Supabase project before using the admin features.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="schema" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schema">Database Schema</TabsTrigger>
              <TabsTrigger value="secrets">Environment Setup</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="space-y-4">
              {steps.map((step, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Step {index + 1}: {step.title}
                        <Badge variant={step.status === 'required' ? 'default' : 'secondary'}>
                          {step.status}
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(step.code, step.title)}
                      >
                        {copiedStep === step.title ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 w-full rounded border">
                      <pre className="p-4 text-xs">
                        <code>{step.code}</code>
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="secrets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Variables</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add these secrets to your Supabase project
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Required Secrets</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(secretsSetup, 'Environment Variables')}
                      >
                        {copiedStep === 'Environment Variables' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-32 w-full rounded border">
                      <pre className="p-4 text-xs">
                        <code>{secretsSetup}</code>
                      </pre>
                    </ScrollArea>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Go to your Supabase project settings → Edge Functions → Environment variables to add these.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Verify Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Checklist:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="tables" />
                        <label htmlFor="tables" className="text-sm">Database tables created</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="rls" />
                        <label htmlFor="rls" className="text-sm">RLS policies enabled</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="secrets" />
                        <label htmlFor="secrets" className="text-sm">Environment variables configured</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="functions" />
                        <label htmlFor="functions" className="text-sm">Edge functions deployed</label>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Once setup is complete, you can use the admin features to manage shows, seats, and monitor activity.
                    </AlertDescription>
                  </Alert>

                  <Button className="w-full" asChild>
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Open Supabase Dashboard
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSetupGuide;