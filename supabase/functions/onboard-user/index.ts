import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizePhoneNumber, formatTwilioPhone } from "../_shared/phoneUtils.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { showId, formData } = await req.json();

    console.log('Onboarding request received:', { showId, phoneNumber: formData.phone_number });

    // Normalize the phone number
    const phoneResult = normalizePhoneNumber(formData.phone_number);
    console.log('Phone normalization result:', phoneResult);

    if (!phoneResult.isValid) {
      return new Response(
        JSON.stringify({ error: `Invalid phone number format: ${phoneResult.error}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Try multiple phone number formats to find matching seat
    const phoneFormatsToTry = [
      phoneResult.e164,              // +14153732865
      formData.phone_number,         // Original input
      phoneResult.e164!.substring(1), // 14153732865 (without +)
    ];
    
    console.log('Trying phone formats:', phoneFormatsToTry);

    let matchingSeat = null;
    let seatError = null;

    for (const phoneFormat of phoneFormatsToTry) {
      const { data: seats, error } = await supabaseAdmin
        .from('seats')
        .select('*')
        .eq('show_id', showId)
        .eq('phone_number', phoneFormat);

      if (error) {
        seatError = error;
        continue;
      }

      if (seats && seats.length > 0) {
        matchingSeat = seats[0];
        console.log(`Found matching seat with format "${phoneFormat}":`, matchingSeat.id);
        break;
      } else {
        console.log(`No seat found with format "${phoneFormat}"`);
      }
    }

    if (seatError) {
      console.error('Seat lookup error:', seatError);
      return new Response(
        JSON.stringify({ error: 'Database error during seat lookup' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!matchingSeat) {
      console.log('No matching seat found for any phone format. Tried:', phoneFormatsToTry);
      
      // For debugging, let's see what seats exist for this show
      const { data: allSeats } = await supabaseAdmin
        .from('seats')
        .select('phone_number')
        .eq('show_id', showId)
        .limit(5);
      
      console.log('Sample seats in database for this show:', allSeats?.map(s => s.phone_number));
      
      return new Response(
        JSON.stringify({ 
          error: "This number isn't on the access list for this show. Please check with your company manager.",
          debug: {
            originalPhone: formData.phone_number,
            normalizedPhone: phoneResult.e164,
            triedFormats: phoneFormatsToTry,
            sampleSeats: allSeats?.map(s => s.phone_number)
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Found matching seat:', matchingSeat.id);

    // Generate temporary user ID for future linking
    const tempUserId = crypto.randomUUID();

    // Create profile with service role permissions (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: tempUserId,
        first_name: formData.name.split(' ')[0] || formData.name,
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        phone_number: phoneResult.e164,
        show_id: showId,
        tour_or_resident: formData.tour_or_resident,
        sleep_environment: {
          environment: formData.sleep_environment,
          noise_level: formData.noise_level,
          light_control: formData.light_control,
          notes: formData.sleep_notes
        },
        dietary_info: {
          allergies: formData.allergies || [],
          intolerances: formData.intolerances || [],
          dietary_preferences: formData.dietary_preferences || [],
          notes: formData.food_notes
        },
        additional_notes: formData.injuries_notes,
        health_goals: formData.goals ? { goals: formData.goals } : {},
        consent_data: {
          privacy_policy: formData.privacy_policy,
          terms_of_service: formData.terms_of_service,
          whatsapp_opt_in: formData.whatsapp_opt_in,
          data_processing: formData.data_processing,
          consented_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Profile created successfully:', profile.id);

    // Update seat to bind it to the profile
    const { error: seatUpdateError } = await supabaseAdmin
      .from('seats')
      .update({
        profile_id: profile.id,
        profile_name: formData.name,
        status: 'active',
        bound_at: new Date().toISOString()
      })
      .eq('id', matchingSeat.id);

    if (seatUpdateError) {
      console.error('Seat update error:', seatUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to activate seat' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Seat updated successfully:', matchingSeat.id);

    // Generate WhatsApp link and QR code
    const waLink = `https://wa.me/14155238886?text=${encodeURIComponent('join closer-send')}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodeURIComponent(waLink)}`;

    console.log('Onboarding completed successfully');

    return new Response(
      JSON.stringify({
        seat_id: matchingSeat.id,
        wa_link: waLink,
        qr_url: qrUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Onboarding function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});