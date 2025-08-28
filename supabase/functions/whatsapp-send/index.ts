import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// Import shared utilities
import { formatTwilioPhone } from "../_shared/phoneUtils.ts";
import { processTemplate, isValidTemplate, MESSAGE_TEMPLATES } from "../_shared/messageTemplates.ts";

// Enhanced WhatsApp message sending service via Twilio
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
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';

// Debug logging for Twilio configuration
console.log('=== TWILIO CONFIG DEBUG ===');
console.log('TWILIO_ACCOUNT_SID:', TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
console.log('TWILIO_AUTH_TOKEN:', TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING'); 
console.log('TWILIO_WHATSAPP_FROM:', TWILIO_WHATSAPP_FROM);
console.log('TWILIO_WHATSAPP_FROM source:', Deno.env.get('TWILIO_WHATSAPP_FROM') ? 'environment' : 'fallback');

/**
 * Send message via Twilio API with enhanced error handling
 */
async function sendTwilioMessage(to: string, body: any): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new FormData();
  formData.append('From', TWILIO_WHATSAPP_FROM);
  formData.append('To', to);
  
  if (typeof body === 'string') {
    // Plain text message
    formData.append('Body', body);
  } else if (body.type === 'interactive') {
    // Interactive message (buttons, etc.)
    // For now, fall back to text with button labels
    let textContent = body.interactive.body?.text || '';
    
    if (body.interactive.action?.buttons) {
      textContent += '\n\nOptions:';
      body.interactive.action.buttons.forEach((button: any, index: number) => {
        textContent += `\n${index + 1}. ${button.reply?.title || button.title}`;
      });
    }
    
    formData.append('Body', textContent);
  } else if (body.text) {
    // Regular text message (within 24h window)
    formData.append('Body', body.text.body);
  } else {
    throw new Error('Invalid message body format');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
    body: formData
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Twilio API error:', result);
    throw new Error(`Twilio API error: ${result.message || 'Unknown error'}`);
  }
  
  return result;
}

/**
 * Find seat for message logging (best effort)
 */
async function findSeatByPhone(supabase: any, phoneE164: string): Promise<any> {
  const { data: seat } = await supabase
    .from('seats')
    .select('id, status')
    .eq('phone_number', phoneE164) // Fixed: use phone_number field, not phone_e164
    .in('status', ['active', 'pending'])
    .single();
    
  return seat;
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

    const requestBody = await req.json();
    const { to, template, variables, type, text, interactive } = requestBody;

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing recipient phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format phone number for Twilio
    let twilioPhone: string;
    try {
      twilioPhone = formatTwilioPhone(to);
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone number format',
        details: error.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let messageBody: any;
    let templateUsed: string | null = null;

    // Determine message type and content
    if (template) {
      // Business-initiated template message
      if (!isValidTemplate(template)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid template',
          available_templates: Object.keys(MESSAGE_TEMPLATES)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      templateUsed = template;
      try {
        const processedMessage = processTemplate(template, variables || []);
        messageBody = processedMessage;
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Template processing failed',
          details: error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
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
    let twilioResponse;
    try {
      twilioResponse = await sendTwilioMessage(twilioPhone, messageBody);
    } catch (error) {
      console.error('Failed to send via Twilio:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to send message',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find seat for logging (best effort - don't fail if not found)
    const cleanPhone = to.replace('whatsapp:', '');
    const seat = await findSeatByPhone(supabase, cleanPhone);

    // Log the outbound message
    if (seat) {
      try {
        await supabase.from('message_log').insert({
          seat_id: seat.id,
          direction: 'out',
          channel: 'whatsapp',
          payload: {
            to: twilioPhone,
            body: messageBody,
            template_used: templateUsed,
            twilio_response: {
              sid: twilioResponse.sid,
              status: twilioResponse.status
            }
          },
          template_used: templateUsed,
          within_24h: !templateUsed, // Templates are for out-of-window, text is within window
          provider_message_id: twilioResponse.sid,
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('Failed to log outbound message:', logError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message_id: twilioResponse.sid,
      status: twilioResponse.status,
      template_used: templateUsed,
      to: twilioPhone
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