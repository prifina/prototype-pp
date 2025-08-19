import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Whitelist of allowed environment variables
const ALLOWED_ENV_VARS = new Set([
  "NEXT_PUBLIC_APP_ID",
  "NEXT_PUBLIC_NETWORK_ID",
]);

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId) || {
    count: 0,
    windowStart: now,
  };

  // Reset window if expired
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData.count = 0;
    clientData.windowStart = now;
  }

  clientData.count++;
  rateLimitStore.set(clientId, clientData);

  return clientData.count > RATE_LIMIT_MAX_REQUESTS;
}

function validateEnvironmentVariableName(name: string[]): boolean {
  if (!name) {
    return false;
  }

  let names = name;
  if (typeof name === "string") {
    names = [name];
  }

  for (var i = 0; i < names.length; i++) {
    // Check length
    if (names[i].length > 100 || !ALLOWED_ENV_VARS.has(names[i])) {
      return false;
    }
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate authentication
    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("apikey");

    if (!authHeader && !apiKey) {
      console.warn(`Unauthorized access attempt from client: ${clientId}`);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name } = body;

    const names = Array.isArray(name) ? name : [name];

    // Validate environment variable name
    if (!validateEnvironmentVariableName(names)) {
      console.warn(
        `Invalid environment variable requested: ${names} from client: ${clientId}`
      );
      return new Response(
        JSON.stringify({ error: "Invalid environment variable name" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const objOfEnvs: object = {};

    for (var i = 0; i < names.length; i++) {
      const value = Deno.env.get(names[i]);
      // Log successful access for audit purposes
      console.log(
        `Environment variable accessed: ${names[i]} by client: ${clientId}`
      );
      objOfEnvs[names[i]] = value;
    }

    return new Response(JSON.stringify({ objOfEnvs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-env-var function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
