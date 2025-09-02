/**
 * Shared phone number utilities for Supabase Edge Functions
 * Matches the client-side phone normalization logic
 */

interface PhoneValidationResult {
  isValid: boolean;
  e164?: string;
  originalInput: string;
  error?: string;
}

/**
 * Super simple phone normalization - matches client-side logic exactly
 */
export function normalizePhoneNumber(input: string): PhoneValidationResult {
  const originalInput = input.trim();
  
  if (!originalInput) {
    return {
      isValid: false,
      originalInput,
      error: 'Phone number is required'
    };
  }

  // Strip everything except digits and + sign (including whatsapp: prefix)
  let digitsOnly = originalInput.replace(/^whatsapp:/, '').replace(/[^\d+]/g, '');

  // If it already starts with +, validate and return
  if (digitsOnly.startsWith('+')) {
    return {
      isValid: true,
      e164: digitsOnly,
      originalInput
    };
  }

  // Remove any + signs that aren't at the start
  digitsOnly = digitsOnly.replace(/\+/g, '');
  
  // Handle different number lengths
  if (digitsOnly.length === 10) {
    // 10 digits - assume US
    return {
      isValid: true,
      e164: `+1${digitsOnly}`,
      originalInput
    };
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits starting with 1 - US with country code
    return {
      isValid: true,
      e164: `+${digitsOnly}`,
      originalInput
    };
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    // 11 digits starting with 0 - likely UK
    const withoutLeadingZero = digitsOnly.substring(1);
    return {
      isValid: true,
      e164: `+44${withoutLeadingZero}`,
      originalInput
    };
  } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    // Other international numbers - add + and hope for the best
    return {
      isValid: true,
      e164: `+${digitsOnly}`,
      originalInput
    };
  }

  return {
    isValid: false,
    originalInput,
    error: `Could not normalize phone number with ${digitsOnly.length} digits: ${digitsOnly}`
  };
}

/**
 * Format phone for Twilio WhatsApp API
 */
export function formatTwilioPhone(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized.isValid) {
    throw new Error(`Invalid phone number: ${phone}`);
  }
  
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${normalized.e164}`;
}

/**
 * Create a hash of the phone number for privacy-preserving storage
 */
export async function hashPhoneNumber(e164: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(e164);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}