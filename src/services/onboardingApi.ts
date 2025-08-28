// Onboarding API service for Production Physio system
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFormData, OnboardingResponse } from '@/types/database';
import { showApi } from './showApi';
import { seatApi } from './seatApi';
import { normalizePhoneNumber } from '@/utils/phoneNormalization';

// Generate QR code for WhatsApp link
function generateQRCodeURL(waLink: string): string {
  // Use a QR code service (in production, you might want to use your own)
  const encodedLink = encodeURIComponent(waLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodedLink}`;
}

// Generate WhatsApp link with prefilled message to Twilio sandbox
function generateWhatsAppLink(seatCode: string): string {
  const message = `join closer-send`;
  const encodedMessage = encodeURIComponent(message);
  
  // Direct link to Twilio WhatsApp sandbox number
  // This is the same number used in the Twilio integration
  const twilioSandboxNumber = '14155238886'; // Twilio sandbox number without + or spaces
  return `https://wa.me/${twilioSandboxNumber}?text=${encodedMessage}`;
}

export const onboardingApi = {
  /**
   * Verify show passcode - Updated to use new Show model
   */
  async verifyPasscode(passcode: string): Promise<{ id: string; name: string }> {
    try {
      const show = await showApi.verifyPasscode(passcode);
      return { id: show.id, name: show.show_name };
    } catch (error) {
      console.error('Passcode verification error:', error);
      throw new Error('Invalid passcode');
    }
  },

  /**
   * Submit onboarding form with phone validation against pre-loaded seats
   */
  async submitOnboarding(
    showId: string, 
    formData: OnboardingFormData
  ): Promise<OnboardingResponse> {
    try {
      // Step 1: Validate phone number format
      const phoneResult = normalizePhoneNumber(formData.phone_number);
      if (!phoneResult.isValid) {
        throw new Error('Invalid phone number format. Please enter a valid UK mobile number.');
      }

      // Step 2: Find matching seat for this phone in this show
      const matchingSeat = await seatApi.findSeatByPhone(showId, formData.phone_number);
      if (!matchingSeat) {
        throw new Error(`This number isn't on the access list for this show. Please check with your company manager or email support@productionphysio.com.`);
      }

      // Step 3: Generate WhatsApp link and QR code pointing to Twilio sandbox
      const waLink = generateWhatsAppLink(matchingSeat.seat_code);
      const qrUrl = generateQRCodeURL(waLink);

      // Step 4: Create profile with form data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
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
        throw new Error('Failed to create profile. Please try again.');
      }

      // Step 5: Update seat to bind it to the profile and activate it
      const { error: seatUpdateError } = await supabase
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
        throw new Error('Failed to activate seat. Please contact support.');
      }

      console.log('Onboarding completed successfully:', {
        showId,
        seatId: matchingSeat.id,
        profileId: profile.id,
        phoneE164: phoneResult.e164,
        seatCode: matchingSeat.seat_code
      });

      return {
        seat_id: matchingSeat.id,
        wa_link: waLink,
        qr_url: qrUrl
      };

    } catch (error) {
      console.error('Onboarding submission error:', error);
      throw error;
    }
  },

  /**
   * Get seat QR code
   */
  async getSeatQR(seatId: string): Promise<string> {
    try {
      // In full implementation, we would fetch actual seat code from database
      const mockQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodeURIComponent('seat:SC-DEMO-12345678-X')}`;
      return mockQRUrl;
    } catch (error) {
      console.error('QR code retrieval error:', error);
      throw error;
    }
  },

  /**
   * Get seat WhatsApp link
   */
  async getSeatLink(seatId: string): Promise<{ wa_link: string }> {
    try {
      // In full implementation, we would fetch actual seat code from database
      const waLink = generateWhatsAppLink('SC-DEMO-12345678-X');
      return { wa_link: waLink };
    } catch (error) {
      console.error('WhatsApp link retrieval error:', error);
      throw error;
    }
  }
};