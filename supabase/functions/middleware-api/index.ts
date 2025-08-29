import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { endpoint = "", method = "POST", body, headers = {} } = await req.json().catch(() => ({}));
    const base = Deno.env.get("MIDDLEWARE_API_URL") ?? "";
    const url = joinUrl(base, endpoint);

    // Add the headers your middleware expects, even if caller forgot to pass them
    const appId = Deno.env.get("NEXT_PUBLIC_APP_ID") ?? "speak-to";
    const network = Deno.env.get("NEXT_PUBLIC_NETWORK_ID") ?? "x_prifina";
    const region = Deno.env.get("MY_REGION") ?? "us-east-1";

    // Generate request ID for traceability
    const requestId = crypto.randomUUID();
    
    const mergedHeaders = {
      "content-type": "application/json",
      "accept": "application/json",
      "x-prifina-app-id": appId,
      "x-prifina-network-id": network,
      "x-region": region,
      "x-request-id": requestId,
      ...headers, // caller can override if needed
    };

    // For GET, avoid sending a body (some servers 400 on GET+body)  
    const opts: RequestInit = { 
      method, 
      headers: mergedHeaders,
      // Add timeout to prevent hanging on cold starts
      signal: AbortSignal.timeout(30000) // 30 second timeout
    };
    if (method.toUpperCase() !== "GET" && body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    // Helpful logs in Supabase function logs - including full body for discovery
    console.log(JSON.stringify({ 
      requestId,
      url, 
      method, 
      hasBody: !!opts.body, 
      headers: mergedHeaders, 
      body: opts.body ? JSON.parse(opts.body) : undefined 
    }, null, 2));

    const upstream = await fetch(url, opts);
    const text = await upstream.text();
    
    // Enhanced observability - log upstream response details
    const respHeaders = Object.fromEntries(upstream.headers.entries());
    const bodyPreview = text.slice(0, 4000); // Safe preview, avoid logging PII
    
    console.log(JSON.stringify({
      requestId,
      url,
      method,
      status: upstream.status,
      statusText: upstream.statusText,
      respHeaders,
      bodyPreview,
      timestamp: new Date().toISOString()
    }, null, 2));

    // Return upstream response with proper content-type and request ID
    const responseHeaders = {
      ...cors,
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "x-request-id": requestId
    };

    return new Response(text, { 
      status: upstream.status, 
      headers: responseHeaders 
    });
  } catch (e) {
    console.error("middleware-api error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});