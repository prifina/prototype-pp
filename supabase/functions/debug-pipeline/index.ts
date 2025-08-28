import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== DEBUGGING WHATSAPP PIPELINE ===");
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Check if seat exists and is active
    console.log("Step 1: Checking seat for +16468014054");
    const { data: seat, error: seatError } = await supabase
      .from('seats')
      .select('*')
      .eq('phone_number', '+16468014054')
      .eq('status', 'active')
      .single();

    if (seatError || !seat) {
      console.error("Seat check failed:", seatError);
      return new Response(JSON.stringify({
        error: "No active seat found",
        details: seatError?.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("✅ Seat found:", seat.id);

    // Step 2: Get profile data
    console.log("Step 2: Getting profile data");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', seat.profile_id)
      .single();

    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('name')
      .eq('id', seat.show_id)  
      .single();

    if (!profile) {
      console.error("Profile not found:", profileError);
    }
    
    console.log("✅ Profile loaded:", profile ? `${profile.first_name} ${profile.last_name}` : 'None');
    console.log("✅ Show loaded:", show?.name || 'Unknown');

    // Step 3: Test AI twin chat directly
    console.log("Step 3: Testing AI twin chat");
    
    const userContext = {
      name: profile ? `${profile.first_name} ${profile.last_name}` : 'Test User',
      role: profile?.tour_or_resident || 'performer',
      show_name: show?.name || 'Test Show',
      tour_or_resident: profile?.tour_or_resident || 'resident',
      goals: profile?.health_goals || {},
      sleep_env: profile?.sleep_environment || {},
      food_constraints: profile?.dietary_info || {},
      injuries_notes: profile?.additional_notes || '',
      phone_e164: '+16468014054'
    };

    console.log("User context:", JSON.stringify(userContext, null, 2));

    const aiResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-twin-chat`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seat_id: seat.id,
        message: "Hello, I'm testing the AI twin system. Can you hear me?",
        channel: 'whatsapp',
        user_context: userContext
      }),
    });

    console.log("AI twin response status:", aiResponse.status);
    const aiResponseText = await aiResponse.text();
    console.log("AI twin response body:", aiResponseText);

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({
        error: "AI twin chat failed",
        status: aiResponse.status,
        response: aiResponseText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Test WhatsApp send
    console.log("Step 4: Testing WhatsApp send");
    
    let aiData;
    try {
      aiData = JSON.parse(aiResponseText);
    } catch (e) {
      aiData = { response: aiResponseText };
    }

    const whatsappResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'whatsapp:+16468014054',
        text: {
          body: aiData.response || "Test message from debug pipeline"
        }
      }),
    });

    console.log("WhatsApp send status:", whatsappResponse.status);
    const whatsappResponseText = await whatsappResponse.text();
    console.log("WhatsApp send response:", whatsappResponseText);

    return new Response(JSON.stringify({
      success: true,
      steps: {
        seat_check: "✅ PASS",
        profile_check: profile ? "✅ PASS" : "⚠️ WARN - No profile",
        ai_twin_status: aiResponse.ok ? "✅ PASS" : "❌ FAIL",
        ai_twin_response: aiData,
        whatsapp_status: whatsappResponse.ok ? "✅ PASS" : "❌ FAIL",
        whatsapp_response: whatsappResponseText
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug pipeline error:', error);
    return new Response(JSON.stringify({ 
      error: 'Debug failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});