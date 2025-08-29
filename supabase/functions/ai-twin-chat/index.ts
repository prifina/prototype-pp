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

// Production configuration
const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "info";
const IS_DEBUG = LOG_LEVEL === "debug";
const MAX_CONTEXT_LENGTH = 2500; // Characters
const MAX_MESSAGE_LENGTH = 1000; // Characters
const AI_GENERATION_TIMEOUT = 30000; // 30 seconds

// Request validation interface
interface ChatRequest {
  seat_id: string;
  message: string;
  channel?: string;
  user_context?: any;
}

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

// Build context for AI Twin with size limits and normalization
function buildAIContext(userContext: any, channel: string): string {
  const context = [
    `User: ${userContext.name || 'Unknown'} (${userContext.role || 'performer'})`,
    `Show: ${userContext.show_name || 'N/A'}`,
    `Type: ${userContext.tour_or_resident === 'tour' ? 'Touring performer' : 'Resident performer'}`,
    `Channel: ${channel}`,
  ];
  
  // Goals with length limit
  if (userContext.goals) {
    const goalsText = typeof userContext.goals === 'object' 
      ? JSON.stringify(userContext.goals).replace(/[{}]/g, '').replace(/"/g, '').replace(/^goals:/, '')
      : userContext.goals.toString().replace(/^goals:/, '');
    const trimmedGoals = goalsText.trim().substring(0, 200);
    if (trimmedGoals) context.push(`Goals: ${trimmedGoals}`);
  }
  
  // Sleep environment with validation
  if (userContext.sleep_env && typeof userContext.sleep_env === 'object') {
    const sleep = userContext.sleep_env;
    const sleepParts = [`${sleep.environment || 'unknown'} environment`];
    if (sleep.noise_level) sleepParts.push(`${sleep.noise_level} noise`);
    if (sleep.light_control) sleepParts.push(`${sleep.light_control} light control`);
    context.push(`Sleep: ${sleepParts.join(', ')}`);
  }
  
  // Food constraints with array validation
  if (userContext.food_constraints && typeof userContext.food_constraints === 'object') {
    const food = userContext.food_constraints;
    const constraints = [];
    if (Array.isArray(food.allergies) && food.allergies.length) {
      constraints.push(`allergies: ${food.allergies.slice(0, 5).join(', ')}`);
    }
    if (Array.isArray(food.intolerances) && food.intolerances.length) {
      constraints.push(`intolerances: ${food.intolerances.slice(0, 5).join(', ')}`);
    }
    if (Array.isArray(food.dietary_preferences) && food.dietary_preferences.length) {
      constraints.push(`preferences: ${food.dietary_preferences.slice(0, 5).join(', ')}`);
    }
    if (constraints.length) context.push(`Food: ${constraints.join('; ')}`);
  }
  
  // Injuries with length limit
  if (userContext.injuries_notes && typeof userContext.injuries_notes === 'string') {
    const injuries = userContext.injuries_notes.substring(0, 300).trim();
    if (injuries) context.push(`Past injuries: ${injuries}`);
  }
  
  // Join and normalize whitespace
  let contextString = context.join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
  
  // Apply hard cap and truncate gracefully
  if (contextString.length > MAX_CONTEXT_LENGTH) {
    contextString = contextString.substring(0, MAX_CONTEXT_LENGTH - 20) + '... [truncated]';
  }
  
  return contextString;
}

// Validate and sanitize chat request
function validateChatRequest(data: any): { valid: boolean; errors: string[]; sanitized?: ChatRequest } {
  const errors: string[] = [];
  
  if (!data.seat_id || typeof data.seat_id !== 'string') {
    errors.push('seat_id is required and must be a string');
  }
  
  if (!data.message || typeof data.message !== 'string') {
    errors.push('message is required and must be a string');
  } else if (data.message.trim().length === 0) {
    errors.push('message cannot be empty');
  } else if (data.message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }
  
  if (data.channel && typeof data.channel !== 'string') {
    errors.push('channel must be a string');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    sanitized: {
      seat_id: data.seat_id.trim(),
      message: data.message.trim(),
      channel: data.channel?.trim() || 'whatsapp',
      user_context: data.user_context || {}
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    console.log(`=== AI TWIN CHAT START [${requestId}] ===`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate and sanitize request
    const requestData = await req.json();
    const validation = validateChatRequest(requestData);
    
    if (!validation.valid) {
      console.log(`Validation failed [${requestId}]:`, validation.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.errors,
        requestId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    const { seat_id, message, channel, user_context } = validation.sanitized!;
    console.log(`Processing AI chat [${requestId}] for seat ${seat_id}:`, 
      IS_DEBUG ? message : `[${message.length} chars]`);

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

    // Validation guards
    const userId = "production-physiotherapy";
    const knowledgebaseId = "3b5e8136-2945-4cb9-b611-fff01f9708e8";
    
    if (!userId || userId.trim().length === 0) {
      throw new Error("userId must be non-empty");
    }
    
    // Validate UUID format for knowledgebaseId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(knowledgebaseId)) {
      throw new Error("knowledgebaseId must be a valid UUID");
    }
    
    if (!message || message.trim().length === 0) {
      throw new Error("User message cannot be empty");
    }

    // Use system+user pattern - single source of context (NO duplication)
    const payload = {
      userId,
      knowledgebaseId,
      messages: [
        {
          role: "system", 
          content: systemContext
        },
        {
          role: "user", 
          content: message // Clean user message only - no "User message:" prefix
        }
      ],
      // Add conservative generation parameters
      temperature: 0.3,
      max_tokens: 512,
      metadata: {
        appId: envData.objOfEnvs.NEXT_PUBLIC_APP_ID || "speak-to",
        networkId: envData.objOfEnvs.NEXT_PUBLIC_NETWORK_ID || "x_prifina",
        channel: channel || "whatsapp",
        sessionId: `seat_${seat_id}`,
        requestId: requestId
        // NO userContext here - context is in system message only
      }
    };
    
    // Assert single source of context
    const hasSystemMessage = payload.messages.some(m => m.role === "system");
    const hasMetadataContext = !!payload.metadata.userContext;
    if (hasSystemMessage && hasMetadataContext) {
      throw new Error("Cannot send both system message and metadata.userContext - use single source of context");
    }

    console.log(`Calling middleware API [${requestId}] with payload structure:`, {
      userId: !!payload.userId,
      knowledgebaseId: !!payload.knowledgebaseId,
      messageCount: payload.messages.length,
      systemContextLength: payload.messages[0]?.content?.length || 0,
      userMessageLength: payload.messages[1]?.content?.length || 0,
      hasMetadata: !!payload.metadata
    });

    // Add timeout wrapper for AI generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI generation timeout')), AI_GENERATION_TIMEOUT);
    });

    const apiPromise = supabase.functions.invoke('middleware-api', {
      body: {
        endpoint: "v1/generate",
        method: "POST", 
        body: payload
      }
    });

    const { data: middlewareData, error: middlewareError } = await Promise.race([
      apiPromise,
      timeoutPromise
    ]) as any;

    if (middlewareError) {
      console.error(`Middleware API error [${requestId}]:`, middlewareError.message);
      if (IS_DEBUG) {
        console.error(`Full error details [${requestId}]:`, JSON.stringify(middlewareError, null, 2));
      }
      throw new Error(`Middleware API error: ${middlewareError.message || 'Unknown error'}`);
    }

    console.log('Middleware API response received');
    
    let aiResponse = '';
    
    // Handle streaming response - the middleware API should return the complete response
    if (typeof middlewareData === 'string') {
      // Handle raw streaming response
      const lines = middlewareData.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.text) {
              aiResponse += data.text;
            }
            if (data.finish_reason) {
              break;
            }
          } catch (e) {
            console.log('Failed to parse streaming line:', line);
          }
        }
      }
    } else if (middlewareData && typeof middlewareData === 'object') {
      // Handle direct response object
      if (middlewareData.answer) {
        aiResponse = middlewareData.answer;
      } else if (middlewareData.response) {
        aiResponse = middlewareData.response;
      } else if (middlewareData.text) {
        aiResponse = middlewareData.text;
      } else if (middlewareData.body && typeof middlewareData.body === 'string') {
        try {
          const bodyData = JSON.parse(middlewareData.body);
          aiResponse = bodyData.answer || bodyData.response || bodyData.text || '';
        } catch (e) {
          aiResponse = middlewareData.body;
        }
      }
    }
    
    // Fallback if no response received
    if (!aiResponse) {
      console.error('No AI response received from middleware API');
      console.error('Raw response data:', JSON.stringify(middlewareData));
      aiResponse = 'Sorry, I had trouble processing your message. Please try again.';
    }
    
    console.log('Final AI response length:', aiResponse.length);

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
      disclaimer_added: needsDisclaimer,
      requestId 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-request-id': requestId
      }
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Error processing AI twin chat [${errorId}]:`, error.message);
    if (IS_DEBUG) {
      console.error(`Full error stack [${errorId}]:`, error);
    }
    
    // Provide helpful fallback response
    const fallbackResponse = needsDisclaimer 
      ? `${DAILY_DISCLAIMER}\n\nI'm experiencing technical difficulties. Please contact support@productionphysio.com with error ID: ${errorId}`
      : `I'm experiencing technical difficulties. Please contact support@productionphysio.com with error ID: ${errorId}`;
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat',
      details: IS_DEBUG ? error.message : 'Internal error - contact support',
      errorId,
      fallback_response: fallbackResponse
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'x-error-id': errorId
      }
    });
  }
});