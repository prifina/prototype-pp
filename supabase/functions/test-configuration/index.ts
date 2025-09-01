import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`=== CONFIGURATION TEST START [${requestId}] ===`);

  try {
    const results = {
      requestId,
      timestamp: new Date().toISOString(),
      environmentVariables: {},
      middlewareApiTest: {},
      aiTwinChatTest: {},
      pipelineTest: {}
    };

    // 1. Check Environment Variables
    console.log(`1. Checking environment variables [${requestId}]`);
    const envVars = [
      'MIDDLEWARE_API_URL',
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'CORE_API_URL',
      'CORE_API_KEY'
    ];

    for (const envVar of envVars) {
      const value = Deno.env.get(envVar);
      const masked = value ? 
        (envVar.includes('KEY') ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : value) :
        'NOT_SET';
      
      results.environmentVariables[envVar] = {
        present: !!value,
        value: masked,
        length: value?.length || 0
      };
      
      console.log(`${envVar}: ${masked} (length: ${value?.length || 0})`);
    }

    // 2. Test middleware-api directly
    console.log(`2. Testing middleware-api directly [${requestId}]`);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const middlewarePayload = {
      endpoint: 'v1/generate',
      method: 'POST',
      body: {
        userId: 'test-user-123',
        knowledgebaseId: '550e8400-e29b-41d4-a716-446655440000',
        statement: 'Hello, this is a test message',
        context: 'Test context for configuration verification',
        stream: false,
        scoreLimit: 0.3,
        sessionId: 'test-session-123',
        requestId: requestId,
        userLanguage: 'en',
        msgIdx: 0,
        networkId: 'x_prifina',
        appId: 'ai-twin-template',
        localize: {
          locale: 'en-US',
          timeZone: 'America/New_York',
          offset: -5,
          currency: 'USD'
        }
      }
    };

    console.log(`Calling middleware-api with payload structure:`, {
      endpoint: middlewarePayload.endpoint,
      method: middlewarePayload.method,
      bodyKeys: Object.keys(middlewarePayload.body),
      statementLength: middlewarePayload.body.statement.length,
      contextLength: middlewarePayload.body.context.length
    });

    try {
      const { data: middlewareData, error: middlewareError } = await supabase.functions.invoke('middleware-api', {
        body: middlewarePayload
      });

      results.middlewareApiTest = {
        success: !middlewareError,
        status: middlewareError ? 'error' : 'success',
        data: middlewareData,
        error: middlewareError?.message,
        requestId: requestId
      };

      console.log(`Middleware-api response [${requestId}]:`, {
        success: !middlewareError,
        dataPreview: middlewareData ? JSON.stringify(middlewareData).substring(0, 200) : null,
        error: middlewareError?.message
      });

    } catch (middlewareErr) {
      results.middlewareApiTest = {
        success: false,
        status: 'exception',
        error: middlewareErr.message,
        requestId: requestId
      };
      console.error(`Middleware-api exception [${requestId}]:`, middlewareErr.message);
    }

    // 3. Test ai-twin-chat with minimal payload
    console.log(`3. Testing ai-twin-chat with minimal payload [${requestId}]`);
    const aiTwinPayload = {
      seat_id: 'd6b53a9e-b4f9-46de-b0c3-663aa083f228',
      message: 'Hello, this is a test message',
      channel: 'test',
      user_context: {
        name: 'Test User',
        role: 'resident',
        show_name: 'Test Show',
        tour_or_resident: 'resident',
        goals: 'Test configuration',
        sleep_env: { environment: 'home', noise_level: 'quiet' },
        food_constraints: { allergies: [], dietary_preferences: [] },
        injuries_notes: 'No injuries',
        phone_e164: '+1234567890'
      }
    };

    console.log(`Calling ai-twin-chat with payload structure:`, {
      seat_id: aiTwinPayload.seat_id,
      messageLength: aiTwinPayload.message.length,
      channel: aiTwinPayload.channel,
      userContextKeys: Object.keys(aiTwinPayload.user_context)
    });

    try {
      const { data: aiTwinData, error: aiTwinError } = await supabase.functions.invoke('ai-twin-chat', {
        body: aiTwinPayload
      });

      results.aiTwinChatTest = {
        success: !aiTwinError,
        status: aiTwinError ? 'error' : 'success',
        data: aiTwinData,
        error: aiTwinError?.message,
        requestId: requestId
      };

      console.log(`AI-twin-chat response [${requestId}]:`, {
        success: !aiTwinError,
        dataPreview: aiTwinData ? JSON.stringify(aiTwinData).substring(0, 200) : null,
        error: aiTwinError?.message
      });

    } catch (aiTwinErr) {
      results.aiTwinChatTest = {
        success: false,
        status: 'exception',
        error: aiTwinErr.message,
        requestId: requestId
      };
      console.error(`AI-twin-chat exception [${requestId}]:`, aiTwinErr.message);
    }

    // 4. Test full pipeline with second turn
    console.log(`4. Testing second turn with same sessionId [${requestId}]`);
    const secondTurnPayload = {
      ...middlewarePayload,
      body: {
        ...middlewarePayload.body,
        statement: 'This is a follow-up message to test session continuity',
        msgIdx: 1,
        requestId: `${requestId}-turn2`
      }
    };

    try {
      const { data: secondTurnData, error: secondTurnError } = await supabase.functions.invoke('middleware-api', {
        body: secondTurnPayload
      });

      results.pipelineTest = {
        success: !secondTurnError,
        status: secondTurnError ? 'error' : 'success',
        data: secondTurnData,
        error: secondTurnError?.message,
        requestId: `${requestId}-turn2`
      };

      console.log(`Second turn response [${requestId}-turn2]:`, {
        success: !secondTurnError,
        dataPreview: secondTurnData ? JSON.stringify(secondTurnData).substring(0, 200) : null,
        error: secondTurnError?.message
      });

    } catch (secondTurnErr) {
      results.pipelineTest = {
        success: false,
        status: 'exception',
        error: secondTurnErr.message,
        requestId: `${requestId}-turn2`
      };
      console.error(`Second turn exception [${requestId}-turn2]:`, secondTurnErr.message);
    }

    // Summary
    const summary = {
      environmentConfigured: results.environmentVariables.MIDDLEWARE_API_URL?.present || false,
      middlewareWorking: results.middlewareApiTest.success || false,
      aiTwinWorking: results.aiTwinChatTest.success || false,
      pipelineWorking: results.pipelineTest.success || false,
      overallStatus: 
        (results.environmentVariables.MIDDLEWARE_API_URL?.present && 
         results.middlewareApiTest.success && 
         results.aiTwinChatTest.success && 
         results.pipelineTest.success) ? 'ALL_SYSTEMS_GO' : 'ISSUES_DETECTED'
    };

    console.log(`=== CONFIGURATION TEST COMPLETE [${requestId}] ===`);
    console.log(`Summary:`, summary);

    return new Response(JSON.stringify({
      ...results,
      summary
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Configuration test failed [${requestId}]:`, error);
    return new Response(JSON.stringify({
      requestId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      status: 'CRITICAL_FAILURE'
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});