import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// WhatsApp message sending service via Twilio
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Twilio API configuration
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'; // Sandbox number

// Message templates for business-initiated messages
const MESSAGE_TEMPLATES = {
  onboarding_help_v1: {
    category: 'UTILITY',
    template: "Hi! To start, please complete onboarding at {{1}} and then message us here."
  },
  access_denied_v1: {
    category: 'UTILITY', 
    template: "This number isn't enabled for {{1}}. Please contact {{2}} to request access."
  },
  resume_session_v1: {
    category: 'UTILITY',
    template: "Shall we continue your coaching for {{1}}?",
    buttons: ["Yes", "Later"]
  },
  seat_expiry_warn_v1: {
    category: 'UTILITY',
    template: "Your AI twin access for {{1}} expires in {{2}} days. Need help renewing?"
  },
  red_flag_escalation_v1: {
    category: 'UTILITY',
    template: "Your responses suggest a possible red flag. Please contact {{1}} immediately: {{2}}."
  }
};

// Format phone number for Twilio
function formatTwilioPhone(phone: string): string {
  // Ensure it starts with whatsapp: prefix
  const cleaned = phone.replace(/\D/g, '');
  const e164 = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${e164}`;
}

// Send message via Twilio API
async function sendTwilioMessage(to: string, body: any): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new FormData();
  formData.append('From', TWILIO_WHATSAPP_FROM!);
  formData.append('To', to);
  
  if (typeof body === 'string') {
    formData.append('Body', body);
  } else if (body.type === 'interactive') {
    // Handle interactive messages (buttons, etc.)
    formData.append('ContentSid', 'YOUR_CONTENT_SID'); // TODO: Set up content templates
    if (body.interactive.body) {
      formData.append('Body', body.interactive.body.text);
    }
  } else if (body.text) {
    formData.append('Body', body.text.body);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
    body: formData
  });

  return await response.json();
}

// Process template with variables
function processTemplate(templateKey: string, variables: string[]): string {
  const template = MESSAGE_TEMPLATES[templateKey as keyof typeof MESSAGE_TEMPLATES];
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  
  let message = template.template;
  variables.forEach((variable, index) => {
    message = message.replace(`{{${index + 1}}}`, variable);
  });
  
  return message;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, template, variables, type, text, interactive } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing recipient phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const twilioPhone = formatTwilioPhone(to);
    let messageBody: any;
    let templateUsed: string | null = null;

    if (template) {
      // Business-initiated template message
      templateUsed = template;
      const processedMessage = processTemplate(template, variables || []);
      messageBody = processedMessage;
      
      console.log(`Sending template ${template} to ${twilioPhone}`);
    } else if (type === 'interactive') {
      // Interactive message (buttons, quick replies)
      messageBody = { type, interactive };
      console.log(`Sending interactive message to ${twilioPhone}`);
    } else if (text) {
      // Regular text message (within 24h window)
      messageBody = text.body;
      console.log(`Sending text message to ${twilioPhone}`);
    } else {
      return new Response(JSON.stringify({ error: 'No message content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send via Twilio
    const twilioResponse = await sendTwilioMessage(twilioPhone, messageBody);
    
    if (twilioResponse.error_code) {
      console.error('Twilio API error:', twilioResponse);
      return new Response(JSON.stringify({ 
        error: 'Failed to send message',
        details: twilioResponse 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find seat for logging (optional, best effort)
    const phoneE164 = to.replace('whatsapp:', '').replace(/\D/g, '');
    const formattedPhone = phoneE164.startsWith('1') ? `+${phoneE164}` : `+1${phoneE164}`;
    
    const { data: seat } = await supabase
      .from('seat')
      .select('id')
      .eq('phone_e164', formattedPhone)
      .eq('status', 'active')
      .single();

    // Log the outbound message
    if (seat) {
      await supabase.from('message_log').insert({
        seat_id: seat.id,
        direction: 'out',
        channel: 'whatsapp',
        payload: {
          to: twilioPhone,
          body: messageBody,
          twilio_response: twilioResponse
        },
        template_used: templateUsed,
        within_24h: !templateUsed, // Templates are for out-of-window, text is within window
        provider_message_id: twilioResponse.sid
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message_id: twilioResponse.sid,
      status: twilioResponse.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});