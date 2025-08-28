import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Test function to debug middleware API connectivity
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Test middleware function called");

  try {
    // Check environment variables
    const middlewareApiUrl = Deno.env.get("MIDDLEWARE_API_URL");
    const coreApiUrl = Deno.env.get("CORE_API_URL");
    const coreApiKey = Deno.env.get("CORE_API_KEY");
    const myRegion = Deno.env.get("MY_REGION");
    const speakToCdn = Deno.env.get("SPEAK_TO_CDN");

    const envStatus = {
      middlewareApiUrl: middlewareApiUrl ? `Set (${middlewareApiUrl})` : "Missing",
      coreApiUrl: coreApiUrl ? `Set (${coreApiUrl})` : "Missing",
      coreApiKey: coreApiKey ? `Set (${coreApiKey.substring(0, 8)}...)` : "Missing",
      myRegion: myRegion ? `Set (${myRegion})` : "Missing",
      speakToCdn: speakToCdn ? `Set (${speakToCdn})` : "Missing"
    };

    console.log("Environment variables:", envStatus);

    // Test middleware API call
    let middlewareTest = null;
    if (middlewareApiUrl && coreApiKey) {
      try {
        console.log("Testing middleware API...");
        
        const testPayload = {
          sessionId: "test_session",
          message: "Hello, this is a test message",
          userContext: "Test User\nShow: Test Production\nType: Testing\nChannel: test",
          channel: "test",
          includeDisclaimer: false
        };

        const middlewareResponse = await fetch(`${middlewareApiUrl}v2/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "APP-REQUEST",
            "x-api-key": coreApiKey,
          },
          body: JSON.stringify(testPayload)
        });

        console.log("Middleware response status:", middlewareResponse.status);
        console.log("Middleware response headers:", Object.fromEntries(middlewareResponse.headers.entries()));

        if (middlewareResponse.ok) {
          // Try to read as text first
          const responseText = await middlewareResponse.text();
          console.log("Middleware response body:", responseText);
          middlewareTest = {
            status: "success",
            statusCode: middlewareResponse.status,
            response: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : "")
          };
        } else {
          const errorText = await middlewareResponse.text();
          console.log("Middleware error response:", errorText);
          middlewareTest = {
            status: "error",
            statusCode: middlewareResponse.status,
            error: errorText
          };
        }
      } catch (error) {
        console.error("Middleware API test failed:", error);
        middlewareTest = {
          status: "error",
          error: error.message
        };
      }
    } else {
      middlewareTest = {
        status: "skipped",
        reason: "Missing middleware URL or API key"
      };
    }

    // Test core API call
    let coreApiTest = null;
    if (coreApiUrl && coreApiKey) {
      try {
        console.log("Testing core API...");
        
        const coreResponse = await fetch(`${coreApiUrl}v1/twin/get-user?userId=test`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });

        console.log("Core API response status:", coreResponse.status);
        
        if (coreResponse.ok) {
          const responseData = await coreResponse.json();
          coreApiTest = {
            status: "success",
            statusCode: coreResponse.status,
            response: responseData
          };
        } else {
          const errorText = await coreResponse.text();
          coreApiTest = {
            status: "error",
            statusCode: coreResponse.status,
            error: errorText
          };
        }
      } catch (error) {
        console.error("Core API test failed:", error);
        coreApiTest = {
          status: "error",
          error: error.message
        };
      }
    } else {
      coreApiTest = {
        status: "skipped",
        reason: "Missing core API URL or API key"
      };
    }

    const results = {
      timestamp: new Date().toISOString(),
      environment: envStatus,
      middlewareApiTest: middlewareTest,
      coreApiTest: coreApiTest,
      recommendations: []
    };

    // Add recommendations
    if (!middlewareApiUrl) results.recommendations.push("Set MIDDLEWARE_API_URL secret");
    if (!coreApiUrl) results.recommendations.push("Set CORE_API_URL secret");
    if (!coreApiKey) results.recommendations.push("Set CORE_API_KEY secret");
    if (!myRegion) results.recommendations.push("Set MY_REGION secret");
    if (!speakToCdn) results.recommendations.push("Set SPEAK_TO_CDN secret");

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Test function error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});