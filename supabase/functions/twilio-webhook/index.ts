import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { validateTwilioSignature, checkRateLimit, checkIdempotency, markProcessed, extractSeatCode } from '../_shared/twilioUtils.ts';
import { normalizePhoneNumber } from '../_shared/phoneUtils.ts';
import { getMessageTemplate, MessageType } from '../_shared/messageTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Check 24-hour session window - allows first message ever or recent activity
async function checkSessionWindow(supabase: any, seatId: string): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get the most recent inbound message for this seat
  const { data } = await supabase
    .from('message_log')
    .select('created_at')
    .eq('seat_id', seatId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1);
  
  // If no previous inbound messages, allow this one (first message ever)
  if (!data || data.length === 0) {
    console.log('No previous inbound messages found - allowing first message');
    return true;
  }
  
  // Check if last inbound message was within 24 hours
  const lastMessageTime = new Date(data[0].created_at);
  const withinWindow = lastMessageTime >= twentyFourHoursAgo;
  console.log(`Last inbound message: ${lastMessageTime.toISOString()}, within 24h window: ${withinWindow}`);
  
  return withinWindow;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Twilio webhook received: ${req.method} request`);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Initializing Supabase client...');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Parsing form data...');
    const formData = await req.formData();
    const twilioSignature = req.headers.get('X-Twilio-Signature') || '';
    const url = req.url;

    // Extract form data
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }
    console.log('Twilio form data received:', JSON.stringify(params, null, 2));

    // Validate Twilio signature
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
    console.log('Validating Twilio signature...');
    console.log('Signature header present:', !!twilioSignature);
    console.log('Auth token configured:', !!authToken);
    
    // Skip signature validation for test credentials or development
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const isTestCredentials = accountSid === 'ACabc123' || authToken === 'test_token' || 
                             accountSid?.startsWith('AC6d2c83aa6953e57d58e7e7dcbe99ef40'); // Twilio test SID
    
    if (!twilioSignature) {
      if (!isTestCredentials) {
        console.error('Missing X-Twilio-Signature header');
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      } else {
        console.log('Skipping signature validation - test credentials detected');
      }
    }
    
    if (!authToken) {
      console.error('TWILIO_AUTH_TOKEN environment variable not set');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }
    
    if (!isTestCredentials && twilioSignature) {
      const isValidSignature = await validateTwilioSignature(twilioSignature, url, params, authToken);
      console.log('Signature validation result:', isValidSignature);
      
      if (!isValidSignature) {
        console.error('Twilio signature validation failed - rejecting request'); 
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
      console.log('Signature validated successfully, processing message...');
    } else {
      console.log('Signature validation skipped (test mode)');
    }

    const messageBody = params.Body?.trim() || '';
    const fromNumber = params.From?.replace('whatsapp:', '') || '';
    const messageSid = params.MessageSid || '';
    
    console.log(`Processing message from ${fromNumber}: "${messageBody}"`);
    console.log(`Message SID: ${messageSid}`);

    // Check idempotency
    const idempotencyResult = checkIdempotency(messageSid);
    if (idempotencyResult.isProcessed) {
      return new Response('Already processed', { status: 200, headers: corsHeaders });
    }
    if (!idempotencyResult.shouldProcess) {
      return new Response('Rate limited', { status: 429, headers: corsHeaders });
    }

    // Normalize phone number with enhanced debugging
    console.log('Normalizing phone number:', fromNumber);
    const normalizedPhone = normalizePhoneNumber(fromNumber);
    console.log('Normalization result:', normalizedPhone);
    
    if (!normalizedPhone.isValid || !normalizedPhone.e164) {
      console.error('Phone normalization failed:', {
        input: fromNumber,
        result: normalizedPhone,
        error: normalizedPhone.error
      });
      return new Response('Invalid phone number', { status: 400, headers: corsHeaders });
    }

    const phoneForStorage = normalizedPhone.e164;

    // Rate limiting check
    const rateLimit = checkRateLimit(phoneForStorage);
    if (!rateLimit.allowed) {
      console.log('Rate limit exceeded for phone:', phoneForStorage);
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    // Handle Twilio sandbox activation message
    if (messageBody.toLowerCase().includes('join closer-send')) {
      // Send acknowledgment for sandbox activation
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { text: { body: 'Sandbox activated! Now send your seat code in the format: seat:YOUR_CODE' } }
      );
      return new Response('Sandbox activation acknowledged', { status: 200, headers: corsHeaders });
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
        { text: { body: template.body || template.template } }
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
        { text: { body: template.body || template.template } }
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
        { text: { body: template.body || template.template } }
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
        { text: { body: template.body || template.template } }
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
        message_type: 'binding',
        payload: {
          twilio_sid: messageSid,
          seat_code: seatCode,
          bound_successfully: true
        }
      });

      // Send success message
      const template = getMessageTemplate(MessageType.SEAT_BOUND_SUCCESS, { 
        profileName: seat.profile_name || 'AI Twin'
      });
      
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { text: { body: template.body || template.template } }
      );

      markProcessed(messageSid);
      return new Response('Seat bound successfully', { status: 200, headers: corsHeaders });
    }

    // Handle regular chat messages - find seat for this phone (demo: allow active OR pending)
    console.log('Looking for seat with phone:', phoneForStorage);
    const { data: activeSeat } = await supabase
      .from('seats')
      .select('*')
      .eq('phone_number', phoneForStorage)
      .in('status', ['active', 'pending'])  // Demo: allow both active and pending seats
      .single();

    console.log('Seat search result:', activeSeat);

    if (!activeSeat) {
      console.log('No seat found for phone, checking if seat exists with different phone...');
      // Demo: Also check if there's ANY seat for this phone number that's not bound yet
      const { data: unboundSeat } = await supabase
        .from('seats')
        .select('*')
        .is('phone_number', null)  // Not bound to any phone yet
        .in('status', ['active', 'pending'])
        .limit(1)
        .single();

      if (unboundSeat) {
        console.log('Found unbound seat, auto-binding for demo:', unboundSeat.id);
        // Auto-bind for demo purposes
        await supabase
          .from('seats')
          .update({ 
            phone_number: phoneForStorage,
            bound_at: new Date().toISOString()
          })
          .eq('id', unboundSeat.id);
        
        // Continue with this seat
        const { data: boundSeat } = await supabase
          .from('seats')
          .select('*')
          .eq('id', unboundSeat.id)
          .single();
        
        if (boundSeat) {
          console.log('Auto-bound seat successfully, continuing with chat...');
          // Set activeSeat to the bound seat for the rest of the flow
          Object.assign(activeSeat || {}, boundSeat);
        }
      }

      if (!activeSeat) {
        console.log('No active/pending seat found for phone');
        const template = getMessageTemplate(MessageType.NO_ACTIVE_SEAT);
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
          { text: { body: template.body || template.template } }
        );
        return new Response('No active seat', { status: 200, headers: corsHeaders });
      }
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
        { text: { body: template.body || template.template } }
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
        { text: { body: template.body || template.template } }
      );
      return new Response('Seat revoked', { status: 200, headers: corsHeaders });
    }

      // Log incoming message BEFORE session check to avoid catch-22
    console.log('Logging incoming message to database...');
    await supabase.from('message_log').insert({
      seat_id: activeSeat.id,
      phone_number: phoneForStorage,
      direction: 'inbound',
      message_body: messageBody,
      message_sid: messageSid,
      message_type: 'chat',
      payload: {
        twilio_sid: messageSid,
        from: fromNumber
      }
    });

    // Check 24-hour session window (now that message is logged)
    const withinSessionWindow = await checkSessionWindow(supabase, activeSeat.id);
    if (!withinSessionWindow) {
      console.log('Session expired - sending restart message');
      const template = getMessageTemplate(MessageType.SESSION_EXPIRED);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { text: { body: template.body || template.template } }
      );
      return new Response('Session expired', { status: 200, headers: corsHeaders });
    }

    // Forward to AI chat service - fetch profile data first (with demo fallbacks)
    console.log('Fetching profile data for seat:', activeSeat.id, 'profile_id:', activeSeat.profile_id);
    
    let profileData = null;
    if (activeSeat.profile_id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeSeat.profile_id)
        .single();
      profileData = data;
    }

    const { data: showData } = await supabase
      .from('shows')
      .select('name')
      .eq('id', activeSeat.show_id)
      .single();

    // Demo: Use fallback profile data when profile_id is null
    const userContext = {
      name: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'Demo User',
      role: profileData?.tour_or_resident || 'resident',
      show_name: showData?.name || 'Demo Show',
      tour_or_resident: profileData?.tour_or_resident || 'resident', 
      goals: profileData?.health_goals || { goals: 'General wellness and performance optimization' },
      sleep_env: profileData?.sleep_environment || { environment: 'hotel', noise_level: 'moderate' },
      food_constraints: profileData?.dietary_info || { allergies: [], dietary_preferences: [] },
      injuries_notes: profileData?.additional_notes || 'No specific injuries or limitations noted',
      phone_e164: phoneForStorage
    };

    console.log('Using user context:', JSON.stringify(userContext, null, 2));

    console.log('Calling AI twin chat service...');
    console.log('User context:', JSON.stringify(userContext, null, 2));
    
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

    console.log('AI chat service response status:', chatResponse.status);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('AI chat service error response:', errorText);
      const template = getMessageTemplate(MessageType.SYSTEM_ERROR);
      await sendWhatsAppMessage(
        Deno.env.get('SUPABASE_URL') ?? '',
        req.headers.get('Authorization') ?? '',
        fromNumber,
        { text: { body: template.body || template.template } }
      );
      return new Response('AI service error', { status: 500, headers: corsHeaders });
    }

    const aiResponse = await chatResponse.json();
    console.log('AI response received:', JSON.stringify(aiResponse, null, 2));
    
    // Extract the main response and any additional parts
    const mainResponse = aiResponse.response || aiResponse.message || 'Sorry, I had trouble processing your message.';
    const additionalParts = aiResponse.additional_parts || [];
    
    // Log AI response (main part)
    console.log('Logging AI response to database...');
    await supabase.from('message_log').insert({
      seat_id: activeSeat.id,
      phone_number: phoneForStorage,
      direction: 'outbound',
      message_body: mainResponse,
      message_type: 'chat'
    });

    // Send main response
    console.log('Sending AI response back to user...');
    await sendWhatsAppMessage(
      Deno.env.get('SUPABASE_URL') ?? '',
      req.headers.get('Authorization') ?? '',
      fromNumber,
      { text: { body: mainResponse } }
    );

    // Send additional parts if the message was split
    if (additionalParts.length > 0) {
      console.log(`Sending ${additionalParts.length} additional message parts...`);
      
      for (const [index, part] of additionalParts.entries()) {
        // Small delay between messages to ensure order
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Log additional part
        await supabase.from('message_log').insert({
          seat_id: activeSeat.id,
          phone_number: phoneForStorage,
          direction: 'outbound',
          message_body: part,
          message_type: 'chat'
        });
        
        // Send additional part
        await sendWhatsAppMessage(
          Deno.env.get('SUPABASE_URL') ?? '',
          req.headers.get('Authorization') ?? '',
          fromNumber,
          { text: { body: part } }
        );
        
        console.log(`Sent part ${index + 2} of ${additionalParts.length + 1}`);
      }
    }

    markProcessed(messageSid);
    return new Response('', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});