import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  e164?: string;
  originalInput: string;
  error?: string;
}

/**
 * Normalize a phone number to E.164 format with GB as default country
 * Handles common UK input formats and artifacts
 */
export function normalizePhoneNumber(
  input: string, 
  defaultCountry: CountryCode = 'GB'
): PhoneValidationResult {
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
      // Remove spaces and hyphens
      .replace(/[\s\-]/g, '')
      // Remove the (0) trunk hint in +44 (0)7... format
      .replace(/^\+44\(0\)/, '+44')
      // Handle 0044 prefix
      .replace(/^0044/, '+44')
      // Handle leading 0 for UK numbers (07700... -> +447700...)
      .replace(/^0([1-9])/, `+44$1`);

    const phoneNumber = parsePhoneNumberFromString(cleanedInput, defaultCountry);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        isValid: false,
        originalInput,
        error: 'Invalid phone number format'
      };
    }

    return {
      isValid: true,
      e164: phoneNumber.number,
      originalInput
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
 * Format a phone number for display (e.g., +44 7700 900123)
 */
export function formatPhoneForDisplay(e164: string): string {
  try {
    const phoneNumber = parsePhoneNumberFromString(e164);
    return phoneNumber?.formatInternational() || e164;
  } catch {
    return e164;
  }
}

/**
 * Check if two phone numbers are equivalent (same E.164)
 */
export function arePhoneNumbersEquivalent(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  return normalized1.isValid && 
         normalized2.isValid && 
         normalized1.e164 === normalized2.e164;
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

/**
 * Validate multiple phone numbers from CSV import
 */
export function validatePhoneNumbers(
  phones: string[], 
  defaultCountry: CountryCode = 'GB'
): { valid: PhoneValidationResult[]; invalid: PhoneValidationResult[]; duplicates: string[] } {
  const results = phones.map(phone => normalizePhoneNumber(phone, defaultCountry));
  
  const valid = results.filter(r => r.isValid);
  const invalid = results.filter(r => !r.isValid);
  
  // Check for duplicates in valid E.164 numbers
  const e164Numbers = valid.map(v => v.e164!);
  const duplicates = e164Numbers.filter((num, index) => e164Numbers.indexOf(num) !== index);
  
  return { valid, invalid, duplicates: [...new Set(duplicates)] };
}