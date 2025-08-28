import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Simple test function called!");
  
  return new Response(JSON.stringify({
    message: "Hello from Supabase Edge Functions!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});