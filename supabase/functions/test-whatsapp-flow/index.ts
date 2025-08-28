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
    console.log("Testing WhatsApp flow step by step...");

    // Test 1: Call debug pipeline
    console.log("=== CALLING DEBUG PIPELINE ===");
    const debugResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/debug-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || ''
      }
    });

    const debugResult = await debugResponse.text();
    console.log("Debug pipeline result:", debugResult);

    // Test 2: Simulate a Twilio webhook call
    console.log("=== SIMULATING TWILIO WEBHOOK ===");
    const webhookData = new FormData();
    webhookData.append('MessageSid', 'TEST123456789');
    webhookData.append('From', 'whatsapp:+16468014054');
    webhookData.append('To', 'whatsapp:+14155238886');
    webhookData.append('Body', 'Hello, this is a test message');
    webhookData.append('AccountSid', 'AC6d2c83aa6953e57d58e7e7dcbe99ef40');

    const webhookResponse = await fetch(`${req.url.split('/functions')[0]}/functions/v1/twilio-webhook`, {
      method: 'POST',
      headers: {
        'X-Twilio-Signature': 'test-signature',
      },
      body: webhookData
    });

    const webhookResult = await webhookResponse.text();
    console.log("Webhook test result:", webhookResult);
    console.log("Webhook status:", webhookResponse.status);

    return new Response(JSON.stringify({
      debug_pipeline: {
        status: debugResponse.status,
        result: debugResult
      },
      webhook_test: {
        status: webhookResponse.status,
        result: webhookResult
      }
    }), {
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