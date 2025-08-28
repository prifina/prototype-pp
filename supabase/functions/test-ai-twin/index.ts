import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Testing AI Twin Middleware ===");
    
    // Test environment variables first
    const requiredEnvs = [
      'CORE_API_URL',
      'CORE_API_KEY', 
      'MIDDLEWARE_API_URL',
      'NEXT_PUBLIC_APP_ID',
      'NEXT_PUBLIC_NETWORK_ID'
    ];
    
    const envStatus: any = {};
    for (const env of requiredEnvs) {
      envStatus[env] = Deno.env.get(env) ? 'SET' : 'MISSING';
    }
    
    console.log("Environment status:", envStatus);
    
    // Test core API health check
    let coreApiStatus = 'ERROR';
    try {
      const coreResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/core-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check' })
      });
      coreApiStatus = coreResponse.ok ? 'OK' : `ERROR ${coreResponse.status}`;
    } catch (e) {
      coreApiStatus = `ERROR: ${e.message}`;
    }
    
    // Test middleware API
    let middlewareStatus = 'ERROR';
    try {
      const middlewareResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/middleware-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: false,
          statement: "Hello, this is a test message",
          knowledgebaseId: "production-physio",
          userId: "test-user",
          sessionId: "test-session"
        })
      });
      middlewareStatus = middlewareResponse.ok ? 'OK' : `ERROR ${middlewareResponse.status}`;
      
      if (!middlewareResponse.ok) {
        const errorText = await middlewareResponse.text();
        console.log("Middleware error response:", errorText);
      }
    } catch (e) {
      middlewareStatus = `ERROR: ${e.message}`;
    }
    
    // Test a simple AI twin chat call
    let aiChatStatus = 'ERROR';
    try {
      const aiChatResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/ai-twin-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_id: "test-seat-123",
          message: "Hello, I have a question about stretching",
          channel: "whatsapp",
          user_context: {
            name: "Test User",
            role: "performer",
            show_name: "Test Show",
            phone_e164: "+1234567890",
            tour_or_resident: "resident"
          }
        })
      });
      aiChatStatus = aiChatResponse.ok ? 'OK' : `ERROR ${aiChatResponse.status}`;
      
      if (!aiChatResponse.ok) {
        const errorText = await aiChatResponse.text();
        console.log("AI Chat error response:", errorText);
      }
    } catch (e) {
      aiChatStatus = `ERROR: ${e.message}`;
    }

    const results = {
      timestamp: new Date().toISOString(),
      environment_variables: envStatus,
      core_api_status: coreApiStatus,
      middleware_api_status: middlewareStatus,
      ai_twin_chat_status: aiChatStatus
    };

    console.log("Test results:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});