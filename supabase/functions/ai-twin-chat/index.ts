import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// AI Twin chat processor with guardrails for WhatsApp channel
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", 
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Red flag keywords that trigger immediate escalation
const RED_FLAG_KEYWORDS = [
  'concussion', 'head injury', 'severe pain', 'can\'t move', 'chest pain',
  'difficulty breathing', 'heart palpitations', 'dizziness', 'fainting',
  'vomiting', 'fever', 'emergency', 'urgent', 'hospital'
];

// Daily disclaimer text
const DAILY_DISCLAIMER = "I don't diagnose or prescribe. I share general guidance and when to escalate to your physio/medical lead.";

// Check if user needs daily disclaimer
async function needsDailyDisclaimer(supabase: any, seatId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('message_log')
    .select('created_at')
    .eq('seat_id', seatId)
    .eq('direction', 'out')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)
    .limit(1);
    
  return !data || data.length === 0;
}

// Check for red flag patterns
function hasRedFlags(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return RED_FLAG_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

// Build context for AI Twin
function buildAIContext(userContext: any, channel: string): string {
  const context = [
    `User: ${userContext.name} (${userContext.role})`,
    `Show: ${userContext.show_name}`,
    `Type: ${userContext.tour_or_resident === 'tour' ? 'Touring performer' : 'Resident performer'}`,
    `Channel: ${channel}`,
  ];
  
  if (userContext.goals) {
    // Properly serialize goals object
    const goalsText = typeof userContext.goals === 'object' 
      ? JSON.stringify(userContext.goals).replace(/[{}]/g, '').replace(/"/g, '')
      : userContext.goals;
    context.push(`Goals: ${goalsText}`);
  }
  
  if (userContext.sleep_env) {
    const sleep = userContext.sleep_env;
    const sleepParts = [`${sleep.environment || 'unknown'} environment`];
    if (sleep.noise_level) sleepParts.push(`${sleep.noise_level} noise`);
    if (sleep.light_control) sleepParts.push(`${sleep.light_control} light control`);
    context.push(`Sleep: ${sleepParts.join(', ')}`);
  }
  
  if (userContext.food_constraints) {
    const food = userContext.food_constraints;
    const constraints = [];
    if (food.allergies?.length) constraints.push(`allergies: ${food.allergies.join(', ')}`);
    if (food.intolerances?.length) constraints.push(`intolerances: ${food.intolerances.join(', ')}`);
    if (food.dietary_preferences?.length) constraints.push(`preferences: ${food.dietary_preferences.join(', ')}`);
    if (constraints.length) context.push(`Food: ${constraints.join('; ')}`);
  }
  
  if (userContext.injuries_notes) {
    context.push(`Past injuries: ${userContext.injuries_notes}`);
  }
  
  return context.join('\n');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== AI TWIN CHAT FUNCTION START ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { seat_id, message, channel, user_context } = await req.json();
    console.log('Request parsed successfully:', { seat_id, message, channel });

    if (!seat_id || !message) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing AI chat for seat ${seat_id}:`, message);

    // Check for red flags first
    if (hasRedFlags(message)) {
      console.log('Red flag detected, sending escalation template');
      
      // Send red flag escalation template using Supabase client
      const { data: escalationData, error: escalationError } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to: user_context.phone_e164,
          template: 'red_flag_escalation_v1',
          variables: ['support@productionphysio.com', 'support@productionphysio.com']
        }
      });
      
      return new Response(JSON.stringify({ 
        response: 'Red flag escalation sent',
        escalated: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if daily disclaimer is needed
    console.log('Checking disclaimer requirement...');
    const needsDisclaimer = await needsDailyDisclaimer(supabase, seat_id);
    console.log('Needs disclaimer:', needsDisclaimer);
    
    // Build AI context
    const systemContext = buildAIContext(user_context, channel);
    console.log('System context built');
    
    // Call the core API directly since middleware API seems to have configuration issues
    const CORE_API_URL = Deno.env.get('CORE_API_URL');
    const CORE_API_KEY = Deno.env.get('CORE_API_KEY');
    
    // Debug environment variables
    console.log('=== ENVIRONMENT VARIABLES CHECK ===');
    console.log('CORE_API_URL available:', !!CORE_API_URL);
    console.log('CORE_API_KEY available:', !!CORE_API_KEY);
    console.log('MIDDLEWARE_API_URL available:', !!Deno.env.get('MIDDLEWARE_API_URL'));
    console.log('CORE_API_URL value:', CORE_API_URL ? CORE_API_URL.substring(0, 50) + '...' : 'NOT SET');
    
    if (!CORE_API_URL || !CORE_API_KEY) {
      console.error('Missing core API configuration - returning fallback');
      // Fallback response
      const fallbackResponse = needsDisclaimer 
        ? `${DAILY_DISCLAIMER}\n\nI'm having technical difficulties right now. Please contact support@productionphysio.com for immediate assistance.`
        : "I'm having technical difficulties right now. Please contact support@productionphysio.com for immediate assistance.";
        
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        disclaimer_added: needsDisclaimer,
        error: 'API configuration missing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get required environment variables for proper API call
    console.log('Getting environment variables...');
    const { data: envData, error: envError } = await supabase.functions.invoke('get-env-var', {
      body: {
        name: ['NEXT_PUBLIC_NETWORK_ID', 'NEXT_PUBLIC_APP_ID']
      }
    });

    if (envError || envData.error) {
      console.error('Failed to get environment variables:', envError || envData.error);
      throw new Error('Failed to load configuration');
    }

    // Build proper payload with all required parameters
    const now = new Date();
    const january = new Date(now.getFullYear(), 0, 1);
    const dst = now.getTimezoneOffset() < january.getTimezoneOffset();
    const offsetMinutes = now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes > 0 ? "-" : "+";
    const gmtOffset = `GMT${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Generate unique request ID
    const requestId = crypto.randomUUID();

    const payload = {
      stream: false,
      statement: `${systemContext}\n\nUser message: ${message}`,
      knowledgebaseId: 'production-physio',
      scoreLimit: 0.3,
      userId: user_context.phone_e164 || 'anonymous',
      requestId: requestId,
      debug: true,
      userLanguage: 'English',
      msgIdx: 0,
      sessionId: `seat_${seat_id}`,
      networkId: envData.objOfEnvs.NEXT_PUBLIC_NETWORK_ID,
      appId: envData.objOfEnvs.NEXT_PUBLIC_APP_ID,
      localize: {
        locale: 'en-US',
        timeZone: 'America/New_York',
        offset: offsetMinutes,
        currentTime: now.toISOString(),
        dst,
        gmtOffset,
      }
    };

    console.log('Calling middleware API with proper payload...');
    console.log('Payload keys:', Object.keys(payload));
    
    // Use Supabase client method instead of direct HTTP call
    const { data: middlewareData, error: middlewareError } = await supabase.functions.invoke('middleware-api', {
      body: payload
    });

    if (middlewareError) {
      console.error('Middleware API error:', middlewareError);
      throw new Error(`Middleware API error: ${middlewareError.message || 'Unknown error'}`);
    }

    // Process response from middleware API
    const responseData = middlewareData;
    console.log('Middleware API response:', responseData);
    
    let aiResponse = '';
    
    // Extract response based on core API response format
    if (responseData.answer) {
      aiResponse = responseData.answer;
    } else if (responseData.response) {
      aiResponse = responseData.response;
    } else if (responseData.text) {
      aiResponse = responseData.text;
    } else if (responseData.body && typeof responseData.body === 'string') {
      // Try to parse body if it's a string
      try {
        const bodyData = JSON.parse(responseData.body);
        aiResponse = bodyData.answer || bodyData.response || bodyData.text || '';
      } catch (e) {
        aiResponse = responseData.body;
      }
    }
    
    // Fallback if no response received
    if (!aiResponse) {
      console.error('No AI response received from middleware API:', responseData);
      aiResponse = 'Sorry, I had trouble processing your message. Please try again.';
    }

    // Add disclaimer if needed
    let finalResponse = aiResponse;
    if (needsDisclaimer && finalResponse) {
      finalResponse = `${DAILY_DISCLAIMER}\n\n${finalResponse}`;
    }

    // Ensure response isn't too long for WhatsApp (max 4096 characters)
    if (finalResponse.length > 4000) {
      finalResponse = finalResponse.substring(0, 3950) + '... (message truncated)';
    }

    return new Response(JSON.stringify({ 
      response: finalResponse,
      disclaimer_added: needsDisclaimer 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing AI twin chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});