import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { corsHeaders, validateTwilioSignature, checkRateLimit, checkIdempotency, markProcessed, extractSeatCode } from '../_shared/twilioUtils.ts';
import { normalizePhoneNumber, formatPhoneForStorage } from '../_shared/phoneUtils.ts';
import { getMessageTemplate, MessageType } from '../_shared/messageTemplates.ts';

// Helper function to send WhatsApp messages
async function sendWhatsAppMessage(baseUrl: string, authorization: string, to: string, payload: any): Promise<Response> {
  return fetch(`${baseUrl}/functions/v1/whatsapp-send`, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, ...payload }),
  });
}

// Check if seat is expired
function isSeatExpired(seat: any): boolean {
  if (!seat.expires_at) return false;
  return new Date(seat.expires_at) < new Date();
}

// Check 24-hour session window
async function checkSessionWindow(supabase: any, seatId: string): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('message_log')
    .select('created_at')
    .eq('seat_id', seatId)
    .eq('direction', 'inbound')
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);
    
  return data && data.length > 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const formData = await req.formData();
    const twilioSignature = req.headers.get('X-Twilio-Signature') || '';
    const url = req.url;

    // Extract form data
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Validate Twilio signature
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
    const isValidSignature = await validateTwilioSignature(twilioSignature, url, params, authToken);
    
    if (!isValidSignature) {
      console.error('Invalid Twilio signature');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const messageBody = params.Body?.trim() || '';
    const fromNumber = params.From?.replace('whatsapp:', '') || '';
    const messageSid = params.MessageSid || '';

    // Check idempotency
    const idempotencyResult = checkIdempotency(messageSid);
    if (idempotencyResult.isProcessed) {
      return new Response('Already processed', { status: 200, headers: corsHeaders });
    }
    if (!idempotencyResult.shouldProcess) {
      return new Response('Rate limited', { status: 429, headers: corsHeaders });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(fromNumber);
    if (!normalizedPhone) {
      console.error('Invalid phone number format:', fromNumber);
      return new Response('Invalid phone number', { status: 400, headers: corsHeaders });
    }

    const phoneForStorage = formatPhoneForStorage(normalizedPhone);

    // Rate limiting check
    const rateLimit = checkRateLimit(phoneForStorage);
    if (!rateLimit.allowed) {
      console.log('Rate limit exceeded for phone:', phoneForStorage);
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    // Extract seat binding code
    const seatCode = extractSeatCode(messageBody);
    
    if (seatCode) {
      console.log('Processing seat binding for code:', seatCode);
      
      // Find the seat by code
      const { data: seat } = await supabase
        .from('seats')
        .select('*')
        .eq('seat_code', seatCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (!seat) {
        const template = getMessageTemplate(MessageType.SEAT_NOT_FOUND);
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
        { message: template.body || template.template }
        );
        return new Response('Seat not found', { status: 200, headers: corsHeaders });
      }

      // Check if seat is expired
      if (isSeatExpired(seat)) {
        const template = getMessageTemplate(MessageType.SEAT_EXPIRED);
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
        { message: template.body || template.template }
        );
        return new Response('Seat expired', { status: 200, headers: corsHeaders });
      }

      // Check if seat already bound to different phone
      if (seat.phone_number && seat.phone_number !== phoneForStorage) {
        const template = getMessageTemplate(MessageType.SEAT_ALREADY_BOUND);
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
        { message: template.body || template.template }
        );
        return new Response('Seat already bound', { status: 200, headers: corsHeaders });
      }

      // Bind seat to phone number
      const { error: updateError } = await supabase
        .from('seats')
        .update({ 
          phone_number: phoneForStorage,
          bound_at: new Date().toISOString()
        })
        .eq('id', seat.id);

      if (updateError) {
        console.error('Error binding seat:', updateError);
        const template = getMessageTemplate(MessageType.SYSTEM_ERROR);
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
        { message: template.body || template.template }
        );
        return new Response('Database error', { status: 500, headers: corsHeaders });
      }

      // Log the binding
      await supabase.from('message_log').insert({
        seat_id: seat.id,
        phone_number: phoneForStorage,
        direction: 'inbound',
        message_body: messageBody,
        message_sid: messageSid,
        message_type: 'binding'
      });

      // Send success message
      const template = getMessageTemplate(MessageType.SEAT_BOUND_SUCCESS, { 
        profileName: seat.profile_name || 'AI Twin'
      });
      
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );

      markProcessed(messageSid);
      return new Response('Seat bound successfully', { status: 200, headers: corsHeaders });
    }

    // Handle regular chat messages - find active seat for this phone
    const { data: activeSeat } = await supabase
      .from('seats')
      .select('*')
      .eq('phone_number', phoneForStorage)
      .eq('status', 'active')
      .single();

    if (!activeSeat) {
      const template = getMessageTemplate(MessageType.NO_ACTIVE_SEAT);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );
      return new Response('No active seat', { status: 200, headers: corsHeaders });
    }

    // Check if seat is expired
    if (isSeatExpired(activeSeat)) {
      // Update seat status to expired
      await supabase
        .from('seats')
        .update({ status: 'expired' })
        .eq('id', activeSeat.id);

      const template = getMessageTemplate(MessageType.SEAT_EXPIRED);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );
      return new Response('Seat expired', { status: 200, headers: corsHeaders });
    }

    // Check if seat is revoked
    if (activeSeat.status === 'revoked') {
      const template = getMessageTemplate(MessageType.SEAT_REVOKED);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );
      return new Response('Seat revoked', { status: 200, headers: corsHeaders });
    }

    // Check 24-hour session window
    const withinSessionWindow = await checkSessionWindow(supabase, activeSeat.id);
    if (!withinSessionWindow) {
      const template = getMessageTemplate(MessageType.SESSION_EXPIRED);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );
      return new Response('Session expired', { status: 200, headers: corsHeaders });
    }

    // Log incoming message
    await supabase.from('message_log').insert({
      seat_id: activeSeat.id,
      phone_number: phoneForStorage,
      direction: 'inbound',
      message_body: messageBody,
      message_sid: messageSid,
      message_type: 'chat'
    });

    // Forward to AI chat service - fetch profile data first
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeSeat.profile_id)
      .single();

    const { data: showData } = await supabase
      .from('shows')
      .select('name')
      .eq('id', activeSeat.show_id)
      .single();

    const userContext = {
      name: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'User',
      role: profileData?.tour_or_resident || 'performer',
      show_name: showData?.name || 'Unknown Show',
      tour_or_resident: profileData?.tour_or_resident || 'resident',
      goals: profileData?.health_goals || {},
      sleep_env: profileData?.sleep_environment || {},
      food_constraints: profileData?.dietary_info || {},
      injuries_notes: profileData?.additional_notes || '',
      phone_e164: phoneForStorage
    };

    const chatResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-twin-chat`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seat_id: activeSeat.id,
        message: messageBody,
        channel: 'whatsapp',
        user_context: userContext
      }),
    });

    if (!chatResponse.ok) {
      console.error('AI chat service error:', await chatResponse.text());
      const template = getMessageTemplate(MessageType.SYSTEM_ERROR);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { message: template.body || template.template }
      );
      return new Response('AI service error', { status: 500, headers: corsHeaders });
    }

    const aiResponse = await chatResponse.json();
    
    // Log AI response
    await supabase.from('message_log').insert({
      seat_id: activeSeat.id,
      phone_number: phoneForStorage,
      direction: 'outbound',
      message_body: aiResponse.message,
      message_type: 'chat'
    });

    // Send AI response back to user
    await sendWhatsAppMessage(
      Deno.env.get('SUPABASE_URL') ?? '',
      req.headers.get('Authorization') ?? '',
      fromNumber,
      { message: aiResponse.message }
    );

    markProcessed(messageSid);
    return new Response('Message processed', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});