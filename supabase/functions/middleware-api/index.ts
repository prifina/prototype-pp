import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// Production logging configuration
const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "info";
const IS_DEBUG = LOG_LEVEL === "debug";

// Request validation schema
interface MiddlewareRequest {
  endpoint?: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

// Safe logging utilities
function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = { ...obj };
  
  // Redact sensitive fields
  if (redacted.messages) {
    redacted.messages = redacted.messages.map((msg: any) => ({
      role: msg.role,
      contentLength: msg.content?.length || 0,
      contentPreview: IS_DEBUG ? msg.content?.substring(0, 100) + '...' : '[REDACTED]'
    }));
  }
  
  if (redacted.body?.messages) {
    redacted.body.messages = redacted.body.messages.map((msg: any) => ({
      role: msg.role,
      contentLength: msg.content?.length || 0,
      contentPreview: IS_DEBUG ? msg.content?.substring(0, 100) + '...' : '[REDACTED]'
    }));
  }
  
  return redacted;
}

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // Success or client error (don't retry)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // Handle rate limiting with backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const backoffMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        if (attempt < maxRetries) {
          console.log(`Rate limited, retrying after ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          attempt++;
          continue;
        }
      }
      
      // Server error - retry with jittered backoff
      if (response.status >= 500 && attempt < maxRetries) {
        const jitter = Math.random() * 1000;
        const backoffMs = Math.pow(2, attempt) * 1000 + jitter;
        
        console.log(`Server error ${response.status}, retrying after ${backoffMs.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        attempt++;
        continue;
      }
      
      return response;
      
    } catch (error) {
      if (attempt < maxRetries && (error instanceof TypeError || error.name === 'TimeoutError')) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`Network error, retrying after ${backoffMs.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        attempt++;
        continue;
      }
      throw error;
    }
  }
  
  throw new Error(`Max retries (${maxRetries}) exceeded`);
}

function joinUrl(base: string, endpoint: string) {
  const b = base.endsWith("/") ? base : base + "/";
  const e = (endpoint || "").replace(/^\/+/, ""); // strip leading slashes defensively
  return new URL(e, b).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const requestData: MiddlewareRequest = await req.json().catch(() => ({}));
    const { endpoint = "", method = "POST", body, headers = {} } = requestData;
    
    // ECHO mode for debugging - return payload without calling Amplify
    if ((headers?.["x-debug"] as string) === "echo") {
      const base = Deno.env.get("MIDDLEWARE_API_URL") ?? "";
      const url = joinUrl(base, endpoint);
      
      // Build merged headers for echo
      const appId = Deno.env.get("NEXT_PUBLIC_APP_ID") ?? "speak-to";
      const network = Deno.env.get("NEXT_PUBLIC_NETWORK_ID") ?? "x_prifina";
      const region = Deno.env.get("MY_REGION") ?? "us-east-1";
      const requestId = crypto.randomUUID();
      
      const mergedHeaders = {
        "content-type": "application/json",
        "accept": "application/json",
        "x-prifina-app-id": appId,
        "x-prifina-network-id": network,
        "x-region": region,
        "x-request-id": requestId,
        ...headers,
      };
      
      return new Response(JSON.stringify({ base, url, method, headers: mergedHeaders, body }, null, 2), {
        status: 200,
        headers: { ...cors, "content-type": "application/json" }
      });
    }
    
    // Validate request
    if (!endpoint && method !== "GET") {
      return new Response(JSON.stringify({ error: "endpoint is required for non-GET requests" }), {
        status: 400,
        headers: cors
      });
    }
    
    const base = Deno.env.get("MIDDLEWARE_API_URL") ?? "";
    if (!base) {
      return new Response(JSON.stringify({ error: "MIDDLEWARE_API_URL not configured" }), {
        status: 500,
        headers: cors
      });
    }
    
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
      // Increase timeout for AI processing
      signal: AbortSignal.timeout(45000) // 45 second timeout
    };
    if (method.toUpperCase() !== "GET" && body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    // Secure logging - redact sensitive data in production
    const logData = {
      requestId,
      url: url.replace(/\/\/[^/]+/, '//[REDACTED]'), // Hide domain in logs
      method,
      hasBody: !!opts.body,
      headers: { ...mergedHeaders, "x-prifina-app-id": "[REDACTED]" },
      bodyStructure: body ? Object.keys(body) : undefined,
      ...(IS_DEBUG ? { body: redactSensitiveData(body) } : {})
    };
    
    console.log(JSON.stringify(logData, null, 2));

    // Log outbound request details
    console.log(JSON.stringify({ 
      outKeys: Object.keys(body ?? {}), 
      url, 
      method 
    }, null, 2));

    const upstream = await fetchWithRetry(url, opts);
    
    // Log upstream response details  
    const text = await upstream.text();
    console.log(JSON.stringify({
      url,
      status: upstream.status,
      bodyPreview: text.slice(0, 800)
    }, null, 2));
    
    return new Response(text, {
      status: upstream.status,
      headers: { ...cors, "content-type": upstream.headers.get("content-type") ?? "application/json" }
    });

  } catch (e) {
    const errorId = crypto.randomUUID();
    console.error(`middleware-api error [${errorId}]:`, e.message);
    console.error(`Full error details [${errorId}]:`, e);
    
    return new Response(JSON.stringify({ 
      error: "Internal proxy error",
      errorId,
      details: IS_DEBUG ? e.message : "Contact support with error ID"
    }), { 
      status: 500, 
      headers: { ...cors, "x-error-id": errorId }
    });
  }
});