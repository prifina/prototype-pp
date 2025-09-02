export interface PhoneValidationResult {
  isValid: boolean;
  e164?: string;
  originalInput: string;
  error?: string;
}

/**
 * Super simple phone normalization - strips everything except digits and adds country codes
 */
export function normalizePhoneNumber(input: string): PhoneValidationResult {
  const originalInput = input.trim();
  console.log('Phone normalization - Original input:', originalInput);
  
  if (!originalInput) {
    return {
      isValid: false,
      originalInput,
      error: 'Phone number is required'
    };
  }

  // Strip everything except digits and + sign
  let digitsOnly = originalInput.replace(/[^\d+]/g, '');
  console.log('Phone normalization - Digits only:', digitsOnly);

  // If it already starts with +, validate and return
  if (digitsOnly.startsWith('+')) {
    console.log('Phone normalization - Already has +, using as-is:', digitsOnly);
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
    const e164 = `+1${digitsOnly}`;
    console.log('Phone normalization - 10 digits, adding +1:', e164);
    return {
      isValid: true,
      e164,
      originalInput
    };
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 11 digits starting with 1 - US with country code
    const e164 = `+${digitsOnly}`;
    console.log('Phone normalization - 11 digits with 1, adding +:', e164);
    return {
      isValid: true,
      e164,
      originalInput
    };
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    // 11 digits starting with 0 - likely UK
    const withoutLeadingZero = digitsOnly.substring(1);
    const e164 = `+44${withoutLeadingZero}`;
    console.log('Phone normalization - UK number, converting:', e164);
    return {
      isValid: true,
      e164,
      originalInput
    };
  } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    // Other international numbers - add + and hope for the best
    const e164 = `+${digitsOnly}`;
    console.log('Phone normalization - International number:', e164);
    return {
      isValid: true,
      e164,
      originalInput
    };
  }

  console.log('Phone normalization - Could not normalize:', digitsOnly);
  return {
    isValid: false,
    originalInput,
    error: `Could not normalize phone number with ${digitsOnly.length} digits: ${digitsOnly}`
  };
}

/**
 * Format a phone number for display (basic formatting)
 */
export function formatPhoneForDisplay(e164: string): string {
  // Simple formatting - just return the E164 number
  return e164;
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
  phones: string[]
): { valid: PhoneValidationResult[]; invalid: PhoneValidationResult[]; duplicates: string[] } {
  const results = phones.map(phone => normalizePhoneNumber(phone));
  
  const valid = results.filter(r => r.isValid);
  const invalid = results.filter(r => !r.isValid);
  
  // Check for duplicates in valid E.164 numbers
  const e164Numbers = valid.map(v => v.e164!);
  const duplicates = e164Numbers.filter((num, index) => e164Numbers.indexOf(num) !== index);
  
  return { valid, invalid, duplicates: [...new Set(duplicates)] };
}