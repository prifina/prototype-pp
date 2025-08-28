import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log("Simple test function called!");
  
  return new Response(JSON.stringify({
    message: "Hello from Supabase Edge Functions!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});