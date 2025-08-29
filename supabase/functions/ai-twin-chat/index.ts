import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
const MAX_CONTEXT_LENGTH = 3000; // Characters
const MAX_MESSAGE_LENGTH = 1000; // Characters
const AI_GENERATION_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

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
  
  // Goals with length limit - fix the typo
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

// Validate payload before sending to Amplify
function validateAmplifyPayload(userId: string, knowledgebaseId: string, messages: any[]): string[] {
  const errors: string[] = [];
  
  if (!userId || userId.trim().length === 0) {
    errors.push("userId must be non-empty");
  }
  
  // Validate UUID format for knowledgebaseId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(knowledgebaseId)) {
    errors.push("knowledgebaseId must be a valid UUID");
  }
  
  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    errors.push("messages must be a non-empty array");
  } else {
    const hasUserMessage = messages.some(m => m.role === "user");
    if (!hasUserMessage) {
      errors.push("messages must include at least one user turn");
    }
  }
  
  return errors;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Success or non-retryable error
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        if (attempt < maxRetries) {
          await sleep(delay);
          continue;
        }
      }
      
      // Handle 5xx errors with exponential backoff
      if (response.status >= 500 && attempt < maxRetries) {
        const jitter = Math.random() * 1000;
        const delay = Math.pow(2, attempt) * 1000 + jitter;
        await sleep(delay);
        continue;
      }
      
      return response;
      
    } catch (error) {
      lastError = error as Error;
      
      // Network timeout or connection error - retry once
      if (attempt < Math.min(1, maxRetries)) {
        const jitter = Math.random() * 1000;
        const delay = 1000 + jitter;
        await sleep(delay);
        continue;
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    console.log(`=== AI TWIN CHAT START [${requestId}] ===`);

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
    
    if (IS_DEBUG) {
      console.log(`Processing AI chat [${requestId}] for seat ${seat_id}: "${message}"`);
    } else {
      console.log(`Processing AI chat [${requestId}] for seat ${seat_id}: [${message.length} chars]`);
    }

    // Check for red flags first
    if (hasRedFlags(message)) {
      console.log('Red flag detected, sending escalation template');
      
      // Call WhatsApp send function directly via fetch to avoid supabase-js dependency
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && serviceKey && user_context.phone_e164) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: user_context.phone_e164,
              template: 'red_flag_escalation_v1',
              variables: ['support@productionphysio.com', 'support@productionphysio.com']
            })
          });
        } catch (e) {
          console.error('Failed to send escalation template:', e);
        }
      }
      
      return new Response(JSON.stringify({ 
        response: 'Red flag escalation sent',
        escalated: true,
        requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    // Build AI context
    const systemContext = buildAIContext(user_context, channel);
    console.log(`System context built [${requestId}]: ${systemContext.length} chars`);
    
    // Get required environment variables
    const middlewareApiUrl = Deno.env.get('MIDDLEWARE_API_URL');
    const appId = Deno.env.get('NEXT_PUBLIC_APP_ID') || "speak-to";
    const networkId = Deno.env.get('NEXT_PUBLIC_NETWORK_ID') || "x_prifina";
    const region = Deno.env.get('MY_REGION') || "us-east-1";
    
    if (!middlewareApiUrl) {
      console.error('MIDDLEWARE_API_URL not configured - returning fallback');
      const fallbackResponse = "I'm having technical difficulties right now. Please contact support@productionphysio.com for immediate assistance.";
        
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        error: 'API configuration missing',
        requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    // Validation guards
    const userId = "production-physiotherapy";
    const knowledgebaseId = "3b5e8136-2945-4cb9-b611-fff01f9708e8";
    
    const messages = [
      {
        role: "system", 
        content: systemContext
      },
      {
        role: "user", 
        content: message // Clean user message only - no prefix
      }
    ];
    
    // Validate payload before sending
    const validationErrors = validateAmplifyPayload(userId, knowledgebaseId, messages);
    if (validationErrors.length > 0) {
      console.error(`Payload validation failed [${requestId}]:`, validationErrors);
      return new Response(JSON.stringify({ 
        error: 'Invalid payload', 
        details: validationErrors,
        requestId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId }
      });
    }

    // Build payload with single source of context
    const payload = {
      userId,
      knowledgebaseId,
      messages,
      temperature: 0.3,
      max_tokens: 512,
      metadata: {
        appId,
        networkId,
        channel: channel || "whatsapp",
        sessionId: `seat_${seat_id}`,
        requestId
        // NO userContext here - context is in system message only
      }
    };
    
    // Assert single source of context
    const hasSystemMessage = payload.messages.some(m => m.role === "system");
    const hasMetadataContext = !!payload.metadata.userContext;
    if (hasSystemMessage && hasMetadataContext) {
      throw new Error("Cannot send both system message and metadata.userContext - use single source of context");
    }

    if (IS_DEBUG) {
      console.log(`Calling Amplify API [${requestId}] with payload:`, {
        userId: payload.userId,
        knowledgebaseId: payload.knowledgebaseId,
        messages: payload.messages.map(m => ({ role: m.role, length: m.content.length })),
        metadata: payload.metadata
      });
    } else {
      console.log(`Calling Amplify API [${requestId}] with:`, {
        userId: !!payload.userId,
        knowledgebaseId: !!payload.knowledgebaseId,
        messageCount: payload.messages.length,
        systemContextLength: payload.messages[0]?.content?.length || 0,
        userMessageLength: payload.messages[1]?.content?.length || 0
      });
    }

    // Call Amplify middleware directly with retry logic
    const amplifyUrl = `${middlewareApiUrl.replace(/\/$/, '')}/v1/generate`;
    
    const response = await fetchWithRetry(amplifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-prifina-app-id': appId,
        'x-prifina-network-id': networkId,
        'x-region': region,
        'x-request-id': requestId
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    const bodyPreview = responseText.substring(0, IS_DEBUG ? 4000 : 1000);
    
    console.log(`Amplify API response [${requestId}]:`, {
      status: response.status,
      contentType: response.headers.get('content-type'),
      bodyLength: responseText.length,
      bodyPreview: IS_DEBUG ? bodyPreview : `${bodyPreview.substring(0, 200)}...`
    });

    if (!response.ok) {
      console.error(`Amplify API error [${requestId}]: ${response.status} ${response.statusText}`);
      console.error(`Response body [${requestId}]:`, bodyPreview);
      
      const fallbackResponse = "I'm experiencing technical difficulties. Please contact support@productionphysio.com for assistance.";
      
      return new Response(JSON.stringify({ 
        error: 'Upstream API error',
        details: `${response.status} ${response.statusText}`,
        fallback_response: fallbackResponse,
        requestId
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'x-request-id': requestId
        }
      });
    }

    // Parse response
    let aiResponse = '';
    try {
      const responseData = JSON.parse(responseText);
      aiResponse = responseData.answer || responseData.response || responseData.text || '';
    } catch (e) {
      // Handle streaming or plain text response
      if (responseText.includes('data: ')) {
        const lines = responseText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.text) aiResponse += data.text;
              if (data.finish_reason) break;
            } catch (parseError) {
              console.log('Failed to parse streaming line:', line);
            }
          }
        }
      } else {
        aiResponse = responseText;
      }
    }
    
    // Fallback if no response received
    if (!aiResponse) {
      console.error(`No AI response received [${requestId}]`);
      aiResponse = 'Sorry, I had trouble processing your message. Please try again.';
    }
    
    console.log(`Final AI response [${requestId}]: ${aiResponse.length} chars`);

    // Add daily disclaimer if needed (simplified check)
    const today = new Date().toISOString().split('T')[0];
    const needsDisclaimer = true; // For now, always add disclaimer to be safe
    
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
        'Content-Type': response.headers.get('content-type') || 'application/json',
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
    const fallbackResponse = `I'm experiencing technical difficulties. Please contact support@productionphysio.com with error ID: ${errorId}`;
    
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