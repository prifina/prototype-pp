// Onboarding API service for Production Physio system
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFormData, OnboardingResponse } from '@/types/database';

// Generate QR code for WhatsApp link
function generateQRCodeURL(waLink: string): string {
  // Use a QR code service (in production, you might want to use your own)
  const encodedLink = encodeURIComponent(waLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodedLink}`;
}

// Generate WhatsApp link with prefilled message
function generateWhatsAppLink(seatCode: string, phoneNumber?: string): string {
  const message = `seat:${seatCode}`;
  const encodedMessage = encodeURIComponent(message);
  
  if (phoneNumber) {
    // Direct link to specific WhatsApp number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  } else {
    // Generic WhatsApp link (will open user's WhatsApp)
    return `https://wa.me/?text=${encodedMessage}`;
  }
}

export const onboardingApi = {
  // Verify production passcode
  async verifyPasscode(passcode: string): Promise<{ id: string; name: string }> {
    try {
      // For demo purposes, accept DEMO123 passcode
      if (passcode === 'DEMO123') {
        return { id: 'demo-production-id', name: 'Demo Production' };
      }
      
      // In production, this would hash and verify against database
      // const hashedPasscode = await crypto.subtle.digest(
      //   'SHA-256', 
      //   new TextEncoder().encode(passcode)
      // ).then(buffer => 
      //   Array.from(new Uint8Array(buffer))
      //     .map(b => b.toString(16).padStart(2, '0'))
      //     .join('')
      // );

      throw new Error('Invalid passcode');
    } catch (error) {
      console.error('Passcode verification error:', error);
      throw new Error('Invalid passcode');
    }
  },

  // Submit onboarding form and create seat
  async submitOnboarding(
    productionId: string, 
    formData: OnboardingFormData
  ): Promise<OnboardingResponse> {
    try {
      // For demo purposes, generate mock data
      const seatId = `seat-${Date.now()}`;
      const seatCode = `SC-DEMO-${Math.random().toString(36).substring(2, 10).toUpperCase()}-X`;
      
      const waLink = generateWhatsAppLink(seatCode);
      const qrUrl = generateQRCodeURL(waLink);

      // In production, this would:
      // 1. Create seat in database
      // 2. Create profile with form data
      // 3. Record opt-in events
      // 4. Generate proper seat codes with validation

      console.log('Mock onboarding data:', {
        productionId,
        formData,
        seatCode,
        waLink
      });

      return {
        seat_id: seatId,
        wa_link: waLink,
        qr_url: qrUrl
      };

    } catch (error) {
      console.error('Onboarding submission error:', error);
      throw error;
    }
  },

  // Get seat QR code
  async getSeatQR(seatId: string): Promise<string> {
    try {
      // Mock QR code URL
      const mockQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodeURIComponent('seat:SC-DEMO-12345678-X')}`;
      return mockQRUrl;
    } catch (error) {
      console.error('QR code retrieval error:', error);
      throw error;
    }
  },

  // Get seat WhatsApp link
  async getSeatLink(seatId: string): Promise<{ wa_link: string }> {
    try {
      // Mock WhatsApp link
      const waLink = generateWhatsAppLink('SC-DEMO-12345678-X');
      return { wa_link: waLink };
    } catch (error) {
      console.error('WhatsApp link retrieval error:', error);
      throw error;
    }
  }
};