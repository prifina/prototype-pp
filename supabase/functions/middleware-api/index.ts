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

    // Generate a simple AI response for physiotherapy questions
    console.log("Generating AI physiotherapy response for:", JSON.stringify(params));
    
    const { statement, knowledgebaseId, userId } = params;
    
    // Create a physiotherapy-focused response
    const aiResponse = `Thank you for your question about "${statement}". As your AI physiotherapy assistant, I recommend:

1. **Assessment First**: Always ensure proper assessment of your condition before starting any exercises
2. **Gradual Progression**: Start slowly and gradually increase intensity
3. **Listen to Your Body**: Stop if you experience sharp pain or discomfort
4. **Consistency**: Regular, gentle movement is better than sporadic intense sessions

For personalized advice specific to your condition and training goals, I recommend consulting with your physiotherapist who can provide targeted exercises based on your assessment.

Stay safe and keep moving! 💪`;

    console.log("Generated AI response");

    // Return a properly formatted streaming response
    const streamData = JSON.stringify({
      text: aiResponse,
      finish_reason: "stop"
    });

    return new Response(streamData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
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