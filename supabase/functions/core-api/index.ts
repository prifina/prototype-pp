import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/std@0.203.0/dotenv/load.ts";

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

  let requestBody;
  try {
    requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
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

  const { action, ...params } = requestBody;

  try {
    const coreApiUrl = Deno.env.get("CORE_API_URL");
    const coreApiKey = Deno.env.get("CORE_API_KEY");
    if (!coreApiUrl || !coreApiKey) {
      console.error("Missing API configuration");
      return new Response(
        JSON.stringify({ error: "Missing API configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let response;
    let requestUrl;

    if (action === "getTwinProfile") {
      const { userId } = params;
      requestUrl = `${coreApiUrl}v1/twin/get-user?userId=${encodeURIComponent(
        userId
      )}`;
      console.log("Making request to:", requestUrl);

      response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          // "x-api-key": coreApiKey,
          "Content-Type": "application/json",
        },
      });
    } else if (action === "initSession") {
      requestUrl = `${coreApiUrl}v1/twin/init`;
      console.log("Making request to:", requestUrl);
      console.log("Session init params:", JSON.stringify(params));

      response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "x-api-key": coreApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
    } else {
      console.error("Invalid action:", action);
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log("Error response data:", JSON.stringify(errorData));
      } catch (e) {
        console.log("Failed to parse error response as JSON");
        errorData = { message: "Unknown error" };
      }

      return new Response(
        JSON.stringify({
          error: errorData.message || "API request failed",
          status: response.status,
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Success response data:", JSON.stringify(data));

    // Handle the response structure properly
    // If the response has a 'response' wrapper, return the inner data
    // Otherwise return the data as-is
    const responseData = data.response || data;

    if (action === "getTwinProfile") {
      let data = {};
      const { userId } = params;

      data = responseData;

      const fileExtension = data.mimeType.split("/")[1];
      const avatarUrl = `https://s3.${Deno.env.get(
        "MY_REGION"
      )}.amazonaws.com/${Deno.env.get(
        "SPEAK_TO_CDN"
      )}/avatars/${userId}.${fileExtension}`;
      // const response = await fetch(avatarUrl); // Fetch the image data from the public URL
      data["avatar-url"] = avatarUrl;
      // data['avatar'] = base64Image;

      if (data?.addBadge === undefined) {
        data["addBadge"] = false;
      }

      if (data?.twinStatus === undefined) {
        data["twinStatus"] = 0;
      }

      if (data?.footer === undefined) {
        data["footer"] = {
          text: "Get your own AI twin.",
          link: "https://www.prifina.com/",
        };
      }
      if (data?.hideFooter === undefined) {
        data["hideFooter"] = false;
      }
      if (data?.authRequired === undefined) {
        data["authRequired"] = false;
      }

      if (data?.authRequired === true) {
        throw new Error("The desired twin requires authentication");
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "initSession") {
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Core API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
