import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { showId, formData } = await req.json();

    console.log('Onboarding request received:', { showId, phoneNumber: formData.phone_number });

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

    // Find matching seat
    const { data: seats, error: seatError } = await supabaseAdmin
      .from('seats')
      .select('*')
      .eq('show_id', showId)
      .eq('phone_number', formData.phone_number);

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

    if (!seats || seats.length === 0) {
      console.log('No matching seat found for phone:', formData.phone_number);
      return new Response(
        JSON.stringify({ 
          error: "This number isn't on the access list for this show. Please check with your company manager." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const matchingSeat = seats[0];
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
        phone_number: formData.phone_number,
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