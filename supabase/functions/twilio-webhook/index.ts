import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// Twilio webhook handler for WhatsApp messages
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Twilio signature validation
function validateTwilioSignature(signature: string, url: string, params: Record<string, string>, authToken: string): boolean {
  // TODO: Implement proper Twilio signature validation
  // For now, return true for development
  console.log('Validating Twilio signature:', { signature, url });
  return true;
}

// Extract seat code from message body
function extractSeatCode(message: string): string | null {
  const seatCodePattern = /seat:([A-Z0-9-]+)/i;
  const match = message.match(seatCodePattern);
  return match ? match[1] : null;
}

// Format phone number to E164
function formatPhoneE164(phone: string): string {
  // Remove whatsapp: prefix and ensure + prefix
  const cleaned = phone.replace('whatsapp:', '').replace(/\D/g, '');
  return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
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

    // Parse Twilio webhook payload
    const formData = await req.formData();
    const twilioData = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    console.log('Received Twilio webhook:', twilioData);

    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature') || '';
    const url = req.url;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
    
    if (!validateTwilioSignature(signature, url, twilioData, authToken)) {
      console.warn('Invalid Twilio signature');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const {
      From: fromPhone,
      WaId: waId,
      Body: messageBody,
      ButtonText: buttonText,
      MessageSid: messageSid,
      NumMedia: numMedia
    } = twilioData;

    const phoneE164 = formatPhoneE164(fromPhone);
    const actualMessage = buttonText || messageBody || '';

    // Log the inbound message
    const messageLogEntry = {
      direction: 'in',
      channel: 'whatsapp',
      payload: twilioData,
      within_24h: true, // Will be updated based on session logic
      provider_message_id: messageSid
    };

    // Check if this is a seat binding message
    const seatCode = extractSeatCode(actualMessage);
    
    if (seatCode) {
      // Handle seat binding
      console.log('Processing seat binding for code:', seatCode);
      
      // Find pending seat with this code
      const { data: seat, error: seatError } = await supabase
        .from('seat')
        .select('*')
        .eq('seat_code', seatCode)
        .eq('status', 'pending')
        .single();

      if (seatError || !seat) {
        console.warn('Seat not found or not pending:', seatCode);
        
        // Send onboarding help template
        const helpResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('authorization') || ''
          },
          body: JSON.stringify({
            to: phoneE164,
            template: 'onboarding_help_v1',
            variables: [Deno.env.get('ONBOARDING_URL') || 'https://example.com/onboarding']
          })
        });

        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Bind the seat to this phone number
      const { error: updateError } = await supabase
        .from('seat')
        .update({
          phone_e164: phoneE164,
          phone_hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(phoneE164)).then(
            buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
          ),
          status: 'active',
          start_at: new Date().toISOString()
        })
        .eq('id', seat.id);

      if (updateError) {
        console.error('Failed to bind seat:', updateError);
        return new Response('Internal Error', { status: 500, headers: corsHeaders });
      }

      // Log the binding
      await supabase.from('message_log').insert({
        seat_id: seat.id,
        ...messageLogEntry
      });

      // Send welcome message with quick replies
      const welcomeResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          to: phoneE164,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: "Hi! I'm your Production Physio AI twin. I can help with sleep, nutrition on the road, warm-ups, recovery, and the quirks of show life. I'm a work in progress—no diagnosis or medication advice—but I'll offer practical suggestions and tell you when to escalate.\n\nWhat would you like help with today?"
            },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'sleep', title: 'Sleep' } },
                { type: 'reply', reply: { id: 'nutrition', title: 'Nutrition' } },
                { type: 'reply', reply: { id: 'warmups', title: 'Warm-ups' } },
                { type: 'reply', reply: { id: 'recovery', title: 'Recovery' } }
              ]
            }
          }
        })
      });

      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle regular conversation messages
    // Find seat by phone number
    const { data: seat, error: seatError } = await supabase
      .from('seat')
      .select('*, profile(*)')
      .eq('phone_e164', phoneE164)
      .eq('status', 'active')
      .single();

    if (seatError || !seat) {
      console.warn('No active seat found for phone:', phoneE164);
      
      // Send access denied template
      const accessDeniedResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          to: phoneE164,
          template: 'access_denied_v1',
          variables: ['Production', 'stage management']
        })
      });

      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Check 24-hour session window
    const { data: lastMessage } = await supabase
      .from('message_log')
      .select('created_at')
      .eq('seat_id', seat.id)
      .eq('direction', 'in')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const within24Hours = lastMessage 
      ? (now.getTime() - new Date(lastMessage.created_at).getTime()) < 24 * 60 * 60 * 1000
      : true;

    if (!within24Hours) {
      // Send resume session template
      const resumeResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          to: phoneE164,
          template: 'resume_session_v1',
          variables: [seat.profile?.show_name || 'your production']
        })
      });

      // Wait for user to respond before continuing conversation
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Log the message
    await supabase.from('message_log').insert({
      seat_id: seat.id,
      within_24h: within24Hours,
      ...messageLogEntry
    });

    // Process with AI Twin
    const aiResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/ai-twin-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || ''
      },
      body: JSON.stringify({
        seat_id: seat.id,
        message: actualMessage,
        channel: 'whatsapp',
        user_context: {
          name: seat.profile?.name,
          role: seat.profile?.role,
          show_name: seat.profile?.show_name,
          tour_or_resident: seat.profile?.tour_or_resident,
          goals: seat.profile?.goals,
          sleep_env: seat.profile?.sleep_env,
          food_constraints: seat.profile?.food_constraints,
          injuries_notes: seat.profile?.injuries_notes
        }
      })
    });

    const aiResult = await aiResponse.json();

    // Send AI response back to user
    const sendResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || ''
      },
      body: JSON.stringify({
        to: phoneE164,
        type: 'text',
        text: { body: aiResult.response }
      })
    });

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});