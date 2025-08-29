import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function joinUrl(base: string, endpoint: string) {
  const b = base.endsWith("/") ? base : base + "/";
  const e = (endpoint || "").replace(/^\/+/, ""); // strip leading slashes defensively
  return new URL(e, b).toString();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { endpoint = "v2/generate", method = "POST", body, headers = {} } = await req.json().catch(() => ({}));
    
    console.log("Middleware API function called with:", { endpoint, method, hasBody: !!body });

    const middlewareApiUrl = Deno.env.get("MIDDLEWARE_API_URL") ?? "";
    const coreApiKey = Deno.env.get("CORE_API_KEY") ?? "";
    
    // Build the complete URL using safe joinUrl function
    const requestUrl = joinUrl(middlewareApiUrl, endpoint);

    // Add required headers that middleware expects
    const appId = Deno.env.get("NEXT_PUBLIC_APP_ID") ?? "ai-twin-template";
    const networkId = Deno.env.get("NEXT_PUBLIC_NETWORK_ID") ?? "default";
    const region = Deno.env.get("MY_REGION") ?? "us-east-1";

    const mergedHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": "APP-REQUEST",
      "x-api-key": coreApiKey,
      "x-prifina-app-id": appId,
      "x-prifina-network-id": networkId,
      "x-region": region,
      ...headers, // caller can override if needed
    };

    // Debug: Log what we're about to send
    console.log("Request details:", JSON.stringify({
      url: requestUrl,
      method,
      hasBody: !!body,
      headers: mergedHeaders,
      middlewareApiUrl,
      endpoint,
      bodyPreview: body ? JSON.stringify(body).substring(0, 200) + "..." : "none"
    }, null, 2));

    // Additional debug logging
    console.log("MIDDLEWARE_API_URL value:", middlewareApiUrl);
    console.log("Constructed URL:", requestUrl);
    console.log("Request method:", method);
    console.log("Headers being sent:", JSON.stringify(mergedHeaders, null, 2));
    console.log("Body being sent:", JSON.stringify(body, null, 2));

    // Check for debug echo mode
    if ((headers.debug as string) === "echo") {
      return new Response(JSON.stringify({ 
        url: requestUrl, 
        method, 
        headers: mergedHeaders, 
        body 
      }, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

    // For GET, avoid sending a body (some servers 400 on GET+body)
    const opts: RequestInit = { method, headers: mergedHeaders };
    if (method.toUpperCase() !== "GET" && body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    const response = await fetch(requestUrl, opts);

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      let errorData;
      let errorText = '';
      try {
        errorText = await response.text();
        console.log("Raw error response text:", errorText);
        
        // Try to parse as JSON
        try {
          errorData = JSON.parse(errorText);
          console.log("Parsed error response:", JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          console.log("Error response is not JSON, using raw text");
          errorData = { message: errorText };
        }
      } catch (e) {
        console.log("Failed to read error response:", e);
        errorData = { message: "Failed to read error response" };
      }

      console.log("Returning error response with status:", response.status);
      return new Response(
        JSON.stringify({
          error: errorData.message || "API request failed",
          status: response.status,
          details: errorData,
          rawResponse: errorText,
          requestUrl: requestUrl,
          requestHeaders: mergedHeaders
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