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
    console.log("=== TESTING WEBHOOK DIRECTLY ===");
    
    // Test 1: Check if webhook URL is accessible
    console.log("Testing webhook URL accessibility...");
    const baseUrl = req.url.split('/functions')[0];
    const webhookUrl = `${baseUrl}/functions/v1/twilio-webhook`;
    console.log("Webhook URL:", webhookUrl);
    
    // Test 2: Simulate Twilio webhook call exactly as Twilio would send it
    console.log("Simulating Twilio webhook call...");
    
    const formData = new FormData();
    formData.append('MessageSid', 'SM_test_123456789');
    formData.append('From', 'whatsapp:+16468014054');
    formData.append('To', 'whatsapp:+14155238886');
    formData.append('Body', 'Hello, this is a test message from the diagnostic');
    formData.append('AccountSid', 'AC6d2c83aa6953e57d58e7e7dcbe99ef40');
    formData.append('NumMedia', '0');
    formData.append('NumSegments', '1');
    formData.append('SmsStatus', 'received');
    formData.append('ApiVersion', '2010-04-01');

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'X-Twilio-Signature': 'test-signature-skip-validation',
        'User-Agent': 'TwilioProxy/1.1',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: formData
    });

    const webhookStatus = webhookResponse.status;
    const webhookResult = await webhookResponse.text();
    
    console.log("Webhook response status:", webhookStatus);
    console.log("Webhook response body:", webhookResult);

    // Test 3: Check AI twin directly
    console.log("Testing AI twin chat directly...");
    
    const aiResponse = await fetch(`${baseUrl}/functions/v1/ai-twin-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        seat_id: 'd6b53a9e-b4f9-46de-b0c3-663aa083f228', // Your seat ID
        message: 'Hello, I need help with stretching exercises',
        channel: 'whatsapp',
        user_context: {
          name: 'Markus August 4',
          role: 'resident',
          show_name: 'Wicked',
          tour_or_resident: 'resident',
          goals: { goals: 'Better energy levels' },
          sleep_env: { environment: 'home', noise_level: 'quiet' },
          food_constraints: { allergies: ['Dairy'], dietary_preferences: ['Vegetarian'] },
          injuries_notes: 'Currently training for a marathon',
          phone_e164: '+16468014054'
        }
      }),
    });

    const aiStatus = aiResponse.status;
    const aiResult = await aiResponse.text();
    
    console.log("AI twin response status:", aiStatus);
    console.log("AI twin response body:", aiResult);

    // Test 4: Check WhatsApp send
    console.log("Testing WhatsApp send...");
    
    const whatsappResponse = await fetch(`${baseUrl}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      },
      body: JSON.stringify({
        to: 'whatsapp:+16468014054',
        text: {
          body: 'This is a test message from the diagnostic system. If you receive this, WhatsApp sending works!'
        }
      }),
    });

    const whatsappStatus = whatsappResponse.status;
    const whatsappResult = await whatsappResponse.text();
    
    console.log("WhatsApp send status:", whatsappStatus);
    console.log("WhatsApp send response:", whatsappResult);

    return new Response(JSON.stringify({
      webhook_url: webhookUrl,
      tests: {
        webhook_simulation: {
          status: webhookStatus,
          success: webhookStatus === 200,
          response: webhookResult
        },
        ai_twin_chat: {
          status: aiStatus,
          success: aiStatus === 200,
          response: aiResult
        },
        whatsapp_send: {
          status: whatsappStatus,
          success: whatsappStatus === 200,
          response: whatsappResult
        }
      },
      next_steps: webhookStatus !== 200 ? 
        "❌ Webhook failed - check Twilio configuration" :
        aiStatus !== 200 ?
        "❌ AI twin failed - check Core API configuration" :
        whatsappStatus !== 200 ?
        "❌ WhatsApp send failed - check Twilio credentials" :
        "✅ All components working - check Twilio webhook URL configuration"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Direct test error:', error);
    return new Response(JSON.stringify({ 
      error: 'Direct test failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});