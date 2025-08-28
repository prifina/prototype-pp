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
  const message = `seat:${seatCode}`;
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

      // Step 4: In full implementation, we would:
      // - Create/update profile with form data
      // - Record consent timestamps
      // - Log opt-in events
      // - Send confirmation email/SMS

      console.log('Onboarding completed:', {
        showId,
        seatId: matchingSeat.id,
        phoneE164: phoneResult.e164,
        formData
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