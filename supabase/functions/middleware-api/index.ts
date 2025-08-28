import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Middleware API function called with method:", req.method); // Updated

    let params;
    try {
      params = await req.json();
      console.log("Request params:", JSON.stringify(params));
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const middlewareApiUrl = Deno.env.get("MIDDLEWARE_API_URL");
    const coreApiKey = Deno.env.get("CORE_API_KEY");

    console.log(
      "Environment check - MIDDLEWARE_API_URL:",
      middlewareApiUrl ? `Set (${middlewareApiUrl.substring(0, 50)}...)` : "Missing"
    );
    console.log(
      "Environment check - CORE_API_KEY:",
      coreApiKey ? "Set" : "Missing"
    );
    
    // Debug: Log actual values for troubleshooting
    console.log("Full MIDDLEWARE_API_URL:", middlewareApiUrl);
    console.log("CORE_API_KEY present:", !!coreApiKey);

    if (!middlewareApiUrl || !coreApiKey) {
      console.error("Missing API configuration");
      return new Response(
        JSON.stringify({ error: "Missing API configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestUrl = `${middlewareApiUrl}v2/generate`;
    console.log("Making request to:", requestUrl);

    console.log("Body", params);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "APP-REQUEST",
        "x-api-key": coreApiKey,
      },
      body: JSON.stringify({
        // stream: true,
        ...params,
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log("Error response data:", JSON.stringify(errorData));
      } catch (e) {
        console.log("Failed to parse error response as JSON");
        errorData = { message: "Unknown error" };
      }

      return new Response(
        JSON.stringify({
          error: errorData.message || "API request failed",
          status: response.status,
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("RESPONSE BODY", response.body);

    // For streaming responses, we need to pass through the stream
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Middleware API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});