
// Security utility functions for input validation and sanitization

export const SecurityUtils = {
  /**
   * Validates and sanitizes twin name parameter
   */
  validateTwinName(twinName: string): { isValid: boolean; sanitized: string } {
    if (!twinName || typeof twinName !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    // Remove potentially dangerous characters
    const sanitized = twinName
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase()
      .substring(0, 50); // Limit length

    // Check if it's a valid twin name format
    const isValid = /^[a-zA-Z0-9_-]+$/.test(sanitized) && sanitized.length > 0;

    return { isValid, sanitized };
  },

  /**
   * Validates and sanitizes chat message input
   */
  validateChatMessage(message: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!message || typeof message !== 'string') {
      return { isValid: false, sanitized: '', error: 'Message is required' };
    }

    const trimmed = message.trim();

    // Check length limits
    if (trimmed.length === 0) {
      return { isValid: false, sanitized: '', error: 'Message cannot be empty' };
    }

    if (trimmed.length > 4000) {
      return { isValid: false, sanitized: '', error: 'Message too long' };
    }

    // Basic content filtering - block potentially malicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmed)) {
        return { isValid: false, sanitized: '', error: 'Message contains invalid content' };
      }
    }

    // Sanitize the message (basic HTML escape)
    const sanitized = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return { isValid: true, sanitized };
  },

  /**
   * Creates a safe error message for users
   */
  createSafeErrorMessage(error: unknown, context: string): string {
    console.error(`Error in ${context}:`, error);
    
    // Never expose internal errors to users
    const safeMessages: Record<string, string> = {
      'network': 'Unable to connect to our services. Please try again.',
      'auth': 'Authentication failed. Please check your credentials.',
      'validation': 'Invalid input provided. Please check your data.',
      'rate_limit': 'Too many requests. Please wait a moment before trying again.',
      'server': 'Something went wrong. Please try again later.',
    };

    return safeMessages[context] || safeMessages['server'];
  },

  /**
   * Validates API response to prevent XSS from external APIs
   */
  validateApiResponse(data: any): boolean {
    if (!data) return false;
    
    // Check for potentially dangerous content in string values
    const checkString = (str: string): boolean => {
      if (typeof str !== 'string') return true;
      
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
      ];
      
      return !dangerousPatterns.some(pattern => pattern.test(str));
    };

    // Recursively check object properties
    const checkObject = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return checkString(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.every(checkObject);
      }
      
      if (obj && typeof obj === 'object') {
        return Object.values(obj).every(checkObject);
      }
      
      return true;
    };

    return checkObject(data);
  }
};
