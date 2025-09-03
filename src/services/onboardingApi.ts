// Onboarding API service for Production Physio system
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFormData, OnboardingResponse } from '@/types/database';
import { showApi } from './showApi';

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
   * Verify show passcode
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
   * Submit onboarding form via Edge Function with service role permissions
   */
  async submitOnboarding(
    showId: string, 
    formData: OnboardingFormData
  ): Promise<OnboardingResponse> {
    try {
      console.log('Starting onboarding via edge function for phone:', formData.phone_number);
      
      // Call the edge function instead of direct database access
      const { data, error } = await supabase.functions.invoke('onboard-user', {
        body: { showId, formData }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to submit onboarding');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Onboarding completed successfully via edge function');
      return data;
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
      const waLink = generateWhatsAppLink('SC-DEMO-12345678-X');
      return { wa_link: waLink };
    } catch (error) {
      console.error('WhatsApp link retrieval error:', error);
      throw error;
    }
  }
};