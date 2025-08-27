import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// Import shared utilities
import { normalizePhoneNumber, hashPhoneNumber, formatTwilioPhone } from "../_shared/phoneUtils.ts";
import { 
  validateTwilioSignature, 
  checkRateLimit, 
  checkIdempotency, 
  markProcessed,
  extractSeatCode 
} from "../_shared/twilioUtils.ts";
import { processTemplate, isValidTemplate } from "../_shared/messageTemplates.ts";

// Enhanced Twilio webhook handler implementing "defense in depth" binding
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Send WhatsApp message via our whatsapp-send function
 */
async function sendWhatsAppMessage(
  baseUrl: string,
  authorization: string,
  to: string,
  payload: any
): Promise<Response> {
  return await fetch(`${baseUrl}/functions/v1/whatsapp-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization
    },
    body: JSON.stringify({ to, ...payload })
  });
}

/**
 * Check if seat has expired
 */
function isSeatExpired(seat: any): boolean {
  if (!seat.expires_at) return false;
  return new Date() > new Date(seat.expires_at);
}

/**
 * Check if user is within 24-hour session window
 */
async function checkSessionWindow(supabase: any, seatId: string): Promise<boolean> {
  const { data: lastMessage } = await supabase
    .from('message_log')
    .select('created_at')
    .eq('seat_id', seatId)
    .eq('direction', 'in')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastMessage) return true; // First message always allowed

  const now = new Date();
  const lastMessageTime = new Date(lastMessage.created_at);
  const timeDiffHours = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
  
  return timeDiffHours < 24;
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
    
    console.log('Received Twilio webhook:', { 
      from: twilioData.From, 
      body: twilioData.Body?.substring(0, 50) + '...' 
    });

    // Validate Twilio signature for security
    const signature = req.headers.get('x-twilio-signature') || '';
    const url = req.url;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
    
    const isValidSignature = await validateTwilioSignature(signature, url, twilioData, authToken);
    if (!isValidSignature) {
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

    // Normalize phone number using our robust utility
    const phoneResult = normalizePhoneNumber(fromPhone);
    if (!phoneResult.isValid) {
      console.warn('Invalid phone number format:', fromPhone);
      return new Response('Bad Request', { status: 400, headers: corsHeaders });
    }
    
    const phoneE164 = phoneResult.e164!;
    const actualMessage = buttonText || messageBody || '';

    // Check rate limiting
    const rateLimitResult = checkRateLimit(phoneE164, 10, 60000); // 10 per minute
    if (!rateLimitResult.allowed) {
      console.warn('Rate limit exceeded for:', phoneE164);
      
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          template: 'rate_limited_v1',
          variables: []
        }
      );
      
      return new Response('Rate Limited', { status: 429, headers: corsHeaders });
    }

    // Check idempotency
    const idempotencyResult = checkIdempotency(messageSid);
    if (idempotencyResult.isProcessed) {
      console.log('Message already processed:', messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
    
    if (!idempotencyResult.shouldProcess) {
      console.log('Message processing skipped:', messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Log the inbound message structure
    const baseMessageLog = {
      direction: 'in' as const,
      channel: 'whatsapp' as const,
      payload: twilioData,
      provider_message_id: messageSid,
      created_at: new Date().toISOString()
    };

    // Check if this is a seat binding message
    const seatCode = extractSeatCode(actualMessage);
    
    if (seatCode) {
      console.log('Processing seat binding for code:', seatCode);
      
      // DEFENSE IN DEPTH: Find pending seat with this code
      const { data: seat, error: seatError } = await supabase
        .from('seats')
        .select('*')
        .eq('seat_code', seatCode)
        .eq('status', 'pending')
        .single();

      if (seatError || !seat) {
        console.warn('Seat not found or not pending:', seatCode, seatError?.message);
        
        // Send seat not found template
        await sendWhatsAppMessage(
          req.url.split('/functions')[0],
          req.headers.get('authorization') || '',
          phoneE164,
          {
            template: 'seat_not_found_v1',
            variables: [Deno.env.get('ONBOARDING_URL') || 'https://your-domain.com/onboarding']
          }
        );

        markProcessed(messageSid);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // CRITICAL SECURITY CHECK: Phone must match pre-loaded phone for this seat
      if (seat.phone_e164 !== phoneE164) {
        console.warn('Phone mismatch for seat binding:', {
          seatCode,
          expected: seat.phone_e164,
          actual: phoneE164,
          originalInput: seat.phone_original_input
        });
        
        // Send phone mismatch template - keep seat pending
        await sendWhatsAppMessage(
          req.url.split('/functions')[0],
          req.headers.get('authorization') || '',
          phoneE164,
          {
            template: 'seat_mismatch_v1',
            variables: []
          }
        );

        markProcessed(messageSid);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // SUCCESSFUL BINDING: Both seat code and phone match
      const bindingTime = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('seats')
        .update({
          wa_id: waId,
          status: 'active',
          binding_completed_at: bindingTime,
          start_at: bindingTime,
          updated_at: bindingTime
        })
        .eq('id', seat.id);

      if (updateError) {
        console.error('Failed to bind seat:', updateError);
        
        await sendWhatsAppMessage(
          req.url.split('/functions')[0],
          req.headers.get('authorization') || '',
          phoneE164,
          {
            template: 'service_unavailable_v1',
            variables: []
          }
        );

        return new Response('Internal Error', { status: 500, headers: corsHeaders });
      }

      // Log the successful binding
      await supabase.from('message_log').insert({
        seat_id: seat.id,
        within_24h: true,
        ...baseMessageLog
      });

      console.log('Seat successfully bound:', { seatId: seat.id, seatCode, phoneE164 });

      // Send welcome message with interactive buttons
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: "🎭 Hi! I'm your Production Physio AI twin. I can help with sleep, nutrition on the road, warm-ups, recovery, and the quirks of show life.\n\n⚠️ I'm a work in progress—no diagnosis or medication advice—but I'll offer practical suggestions and tell you when to escalate.\n\nWhat would you like help with today?"
            },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'sleep', title: '😴 Sleep' } },
                { type: 'reply', reply: { id: 'nutrition', title: '🍎 Nutrition' } },
                { type: 'reply', reply: { id: 'warmups', title: '🏃 Warm-ups' } }
              ]
            }
          }
        }
      );

      markProcessed(messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle regular conversation messages - find active seat by phone
    const { data: seat, error: seatError } = await supabase
      .from('seats')
      .select(`
        *,
        profiles (*)
      `)
      .eq('phone_e164', phoneE164)
      .eq('status', 'active')
      .single();

    if (seatError || !seat) {
      console.warn('No active seat found for phone:', phoneE164);
      
      // Send access denied template
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          template: 'access_denied_v1',
          variables: ['your production', 'your company manager']
        }
      );

      markProcessed(messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Check if seat has expired
    if (isSeatExpired(seat)) {
      console.warn('Seat expired for phone:', phoneE164);
      
      // Send expiry notice (only once)
      const { data: existingExpiryMessage } = await supabase
        .from('message_log')
        .select('id')
        .eq('seat_id', seat.id)
        .eq('template_used', 'seat_expiry_notice_v1')
        .single();

      if (!existingExpiryMessage) {
        await sendWhatsAppMessage(
          req.url.split('/functions')[0],
          req.headers.get('authorization') || '',
          phoneE164,
          {
            template: 'seat_expiry_notice_v1',
            variables: []
          }
        );
        
        // Log the expiry notice
        await supabase.from('message_log').insert({
          seat_id: seat.id,
          direction: 'out',
          channel: 'whatsapp',
          template_used: 'seat_expiry_notice_v1',
          within_24h: false,
          ...baseMessageLog
        });
      }

      markProcessed(messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Check if seat has been revoked
    if (seat.status === 'revoked') {
      console.warn('Seat revoked for phone:', phoneE164);
      
      // Send revoked notice (only once)
      const { data: existingRevokedMessage } = await supabase
        .from('message_log')
        .select('id')
        .eq('seat_id', seat.id)
        .eq('template_used', 'seat_revoked_v1')
        .single();

      if (!existingRevokedMessage) {
        await sendWhatsAppMessage(
          req.url.split('/functions')[0],
          req.headers.get('authorization') || '',
          phoneE164,
          {
            template: 'seat_revoked_v1',
            variables: []
          }
        );
      }

      markProcessed(messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Check 24-hour session window
    const within24Hours = await checkSessionWindow(supabase, seat.id);
    
    if (!within24Hours) {
      console.log('Outside 24-hour window, sending resume session template');
      
      // Send resume session template
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          template: 'resume_session_v1',
          variables: [seat.profiles?.[0]?.show_name || 'your production']
        }
      );

      markProcessed(messageSid);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Log the regular message
    await supabase.from('message_log').insert({
      seat_id: seat.id,
      within_24h: within24Hours,
      ...baseMessageLog
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
          name: seat.profiles?.[0]?.name,
          role: seat.profiles?.[0]?.role,
          show_name: seat.profiles?.[0]?.show_name,
          tour_or_resident: seat.profiles?.[0]?.tour_or_resident,
          goals: seat.profiles?.[0]?.goals,
          sleep_env: seat.profiles?.[0]?.sleep_env,
          food_constraints: seat.profiles?.[0]?.food_constraints,
          injuries_notes: seat.profiles?.[0]?.injuries_notes
        }
      })
    });

    const aiResult = await aiResponse.json();

    // Check for red flag escalation in AI response
    if (aiResult.red_flag) {
      console.warn('Red flag detected for seat:', seat.id);
      
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          template: 'red_flag_escalation_v1',
          variables: ['medical emergency services', '999 (UK) or 911 (US)']
        }
      );
    } else {
      // Send AI response back to user
      await sendWhatsAppMessage(
        req.url.split('/functions')[0],
        req.headers.get('authorization') || '',
        phoneE164,
        {
          type: 'text',
          text: { body: aiResult.response }
        }
      );
    }

    markProcessed(messageSid);
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});
