import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

// Twilio status callback handler for message delivery receipts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse Twilio status callback
    const formData = await req.formData();
    const statusData = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    console.log('Received Twilio status callback:', statusData);

    const {
      MessageSid: messageSid,
      MessageStatus: messageStatus,
      To: to,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage
    } = statusData;

    if (!messageSid) {
      return new Response('Missing MessageSid', { status: 400, headers: corsHeaders });
    }

    // Update message log with delivery status
    const updateData: any = {
      payload: {
        ...statusData,
        status_updated_at: new Date().toISOString()
      }
    };

    // Add error information if present
    if (errorCode || errorMessage) {
      updateData.payload.delivery_error = {
        code: errorCode,
        message: errorMessage
      };
    }

    const { error } = await supabase
      .from('message_log')
      .update({
        status: messageStatus,
        payload: updateData.payload
      })
      .eq('message_sid', messageSid);

    if (error) {
      console.error('Failed to update message status:', error);
      // Don't return error to Twilio, just log it
    }

    // Log delivery failures for monitoring
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      console.warn(`Message delivery failed:`, {
        messageSid,
        to,
        status: messageStatus,
        errorCode,
        errorMessage
      });
      
      // Could trigger alerts here in production
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing status callback:', error);
    return new Response('OK', { status: 200, headers: corsHeaders }); // Always return OK to Twilio
  }
});