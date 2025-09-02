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
 * Simple E.164 normalization for server-side use
 * Handles common phone number formats with forgiving validation
 */
export function normalizePhoneNumber(input: string, defaultCountry?: string): PhoneValidationResult {
  const originalInput = input.trim();
  
  if (!originalInput) {
    return {
      isValid: false,
      originalInput,
      error: 'Phone number is required'
    };
  }

  try {
    // Clean common artifacts before parsing
    let cleanedInput = originalInput
      // Remove whatsapp: prefix
      .replace(/^whatsapp:/, '')
      // Remove spaces, hyphens, parentheses, dots
      .replace(/[\s\-\(\)\.]/g, '')
      // Remove the (0) trunk hint in +44 (0)7... format
      .replace(/^\+44\(0\)/, '+44')
      // Handle 0044 prefix
      .replace(/^0044/, '+44')
      // Handle leading 0 for UK numbers (07700... -> +447700...)
      .replace(/^0([1-9])/, '+44$1');

    // Handle numbers starting with just "1" (assume US/Canada)
    if (cleanedInput.match(/^1[2-9][0-9]{9}$/)) {
      cleanedInput = '+' + cleanedInput;
    }
    
    // Handle numbers without + but starting with country code
    if (cleanedInput.match(/^[1-9][0-9]{10,14}$/) && !cleanedInput.startsWith('+')) {
      cleanedInput = '+' + cleanedInput;
    }

    // Flexible validation for various formats
    if (cleanedInput.startsWith('+44')) {
      // UK number - should be +44 followed by 10 digits for mobile, or 11 for landline
      const digits = cleanedInput.substring(3);
      if (digits.match(/^[1-9][0-9]{8,10}$/)) {
        return {
          isValid: true,
          e164: cleanedInput,
          originalInput
        };
      }
    } else if (cleanedInput.startsWith('+1')) {
      // US/Canada number - should be +1 followed by 10 digits
      const digits = cleanedInput.substring(2);
      if (digits.match(/^[2-9][0-9]{9}$/)) {
        return {
          isValid: true,
          e164: cleanedInput,
          originalInput
        };
      }
    } else if (cleanedInput.startsWith('+')) {
      // Other international numbers - basic length check (7-15 digits after +)
      const digits = cleanedInput.substring(1);
      if (digits.match(/^[1-9][0-9]{6,14}$/)) {
        return {
          isValid: true,
          e164: cleanedInput,
          originalInput
        };
      }
    } else if (cleanedInput.match(/^[2-9][0-9]{9}$/)) {
      // 10-digit US number without country code - add +1
      return {
        isValid: true,
        e164: '+1' + cleanedInput,
        originalInput
      };
    } else if (cleanedInput.match(/^[7-9][0-9]{9}$/)) {
      // 10-digit UK mobile without country code - add +44
      return {
        isValid: true,
        e164: '+44' + cleanedInput,
        originalInput
      };
    }

    return {
      isValid: false,
      originalInput,
      error: 'Invalid phone number format'
    };
    
  } catch (error) {
    return {
      isValid: false,
      originalInput,
      error: 'Unable to parse phone number'
    };
  }
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