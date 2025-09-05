/**
 * Shared Twilio utilities for webhook processing and security
 */

/**
 * Validate Twilio webhook signature for security
 * Implementation based on Twilio's signature validation algorithm
 */
export async function validateTwilioSignature(
  signature: string, 
  url: string, 
  params: Record<string, string>, 
  authToken: string
): Promise<boolean> {
  try {
    // Construct the signature string
    let signatureString = url;
    
    // Sort parameters and append to URL
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      signatureString += key + params[key];
    }
    
    // Create HMAC-SHA1 hash
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authToken);
    const messageData = encoder.encode(signatureString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signature_bytes)));
    
    return computedSignature === signature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Rate limiting storage (simple in-memory for now)
 * In production, use Redis or database
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for phone number
 * @param phoneE164 - Phone number in E.164 format
 * @param limit - Max requests per window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 */
export function checkRateLimit(
  phoneE164: string, 
  limit: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now();
  const key = `rate_limit:${phoneE164}`;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // New window or expired
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, resetTime, remaining: limit - 1 };
  }
  
  if (existing.count >= limit) {
    // Rate limited
    return { 
      allowed: false, 
      resetTime: existing.resetTime, 
      remaining: 0 
    };
  }
  
  // Increment counter
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return { 
    allowed: true, 
    resetTime: existing.resetTime, 
    remaining: limit - existing.count 
  };
}

/**
 * Idempotency key storage (simple in-memory for now)
 * In production, use Redis or database with TTL
 */
const idempotencyStore = new Map<string, { processed: boolean; timestamp: number }>();

/**
 * Check if a webhook has already been processed
 * Uses Twilio MessageSid as idempotency key
 */
export function checkIdempotency(messageSid: string): { isProcessed: boolean; shouldProcess: boolean } {
  const key = `idempotent:${messageSid}`;
  const existing = idempotencyStore.get(key);
  const now = Date.now();
  const TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  if (!existing) {
    // First time seeing this message
    idempotencyStore.set(key, { processed: false, timestamp: now });
    return { isProcessed: false, shouldProcess: true };
  }
  
  if (now - existing.timestamp > TTL) {
    // Expired, treat as new
    idempotencyStore.set(key, { processed: false, timestamp: now });
    return { isProcessed: false, shouldProcess: true };
  }
  
  if (existing.processed) {
    // Already processed successfully
    return { isProcessed: true, shouldProcess: false };
  }
  
  // In progress or failed previously, allow reprocessing
  return { isProcessed: false, shouldProcess: true };
}

/**
 * Mark a webhook as successfully processed
 */
export function markProcessed(messageSid: string): void {
  const key = `idempotent:${messageSid}`;
  const existing = idempotencyStore.get(key);
  if (existing) {
    existing.processed = true;
    idempotencyStore.set(key, existing);
  }
}
