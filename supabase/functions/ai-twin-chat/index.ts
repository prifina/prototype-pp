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
    context.push(`Goals: ${userContext.goals}`);
  }
  
  if (userContext.sleep_env) {
    const sleep = userContext.sleep_env;
    context.push(`Sleep: ${sleep.environment} environment, ${sleep.noise_level} noise, ${sleep.light_control} light control`);
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { seat_id, message, channel, user_context } = await req.json();

    if (!seat_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing AI chat for seat ${seat_id}:`, message);

    // Check for red flags first
    if (hasRedFlags(message)) {
      console.log('Red flag detected, sending escalation template');
      
      // Send red flag escalation template
      const escalationResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('authorization') || ''
        },
        body: JSON.stringify({
          to: user_context.phone_e164,
          template: 'red_flag_escalation_v1',
          variables: ['your physio/medical lead', '+44 123 456 7890'] // TODO: Get from production settings
        })
      });
      
      return new Response(JSON.stringify({ 
        response: 'Red flag escalation sent',
        escalated: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if daily disclaimer is needed
    const needsDisclaimer = await needsDailyDisclaimer(supabase, seat_id);
    
    // Build AI context
    const systemContext = buildAIContext(user_context, channel);
    
    // Call the existing middleware API for AI response
    const aiPayload = {
      sessionId: `seat_${seat_id}`,
      message: message,
      userContext: systemContext,
      channel: channel,
      includeDisclaimer: needsDisclaimer
    };

    const middlewareResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/middleware-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || ''
      },
      body: JSON.stringify(aiPayload)
    });

    if (!middlewareResponse.ok) {
      throw new Error(`Middleware API error: ${middlewareResponse.status}`);
    }

    // Process streaming response
    const reader = middlewareResponse.body?.getReader();
    let aiResponse = '';
    
    if (reader) {
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                aiResponse += data.text;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
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