/**
 * Enhanced message templates matching specification requirements
 */

export interface MessageTemplate {
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  template: string;
  buttons?: string[];
  description?: string;
}

export const MESSAGE_TEMPLATES: Record<string, MessageTemplate> = {
  // Onboarding & Access
  onboarding_help_v1: {
    category: 'UTILITY',
    template: "Hi! To start using your AI Physio Twin, please complete onboarding at {{1}} and then message us here with your access code.",
    description: "Sent when someone uses an invalid seat code"
  },
  
  access_denied_v1: {
    category: 'UTILITY', 
    template: "This number isn't enabled for {{1}}. Please contact {{2}} to request access or email support@productionphysio.com.",
    description: "Sent when phone number has no active seat"
  },
  
  // Binding Security
  seat_mismatch_v1: {
    category: 'UTILITY',
    template: "This access code is linked to another number. Please contact support@productionphysio.com if you believe this is an error.",
    description: "Sent when phone doesn't match the pre-loaded phone for that seat code"
  },
  
  seat_not_found_v1: {
    category: 'UTILITY',
    template: "Access code not recognized. Please check with your company manager or complete onboarding at {{1}}.",
    description: "Sent when seat code doesn't exist or isn't pending"
  },
  
  // Session Management  
  resume_session_v1: {
    category: 'UTILITY',
    template: "Ready to continue your coaching for {{1}}? Just reply to get started.",
    description: "Sent when user messages after 24-hour window"
  },
  
  // Expiry Management
  seat_expiry_notice_v1: {
    category: 'UTILITY',
    template: "Your AI Physio Twin access has expired. Please contact your production if you need continued access.",
    description: "Single expiry notice - sent once only"
  },
  
  seat_expiry_warn_v1: {
    category: 'UTILITY',
    template: "Your AI twin access for {{1}} expires in {{2}} days. Need help extending? Contact your company manager.",
    description: "Optional warning before expiry"
  },
  
  // Status Changes
  seat_revoked_v1: {
    category: 'UTILITY',
    template: "Your access has been revoked. Please contact your company manager if you have questions.",
    description: "Sent once when seat is revoked"
  },
  
  // Error States
  rate_limited_v1: {
    category: 'UTILITY',
    template: "Too many messages. Please wait a moment and try again.",
    description: "Sent when rate limit exceeded"
  },
  
  service_unavailable_v1: {
    category: 'UTILITY',
    template: "Service temporarily unavailable. Please try again in a few minutes.",
    description: "Sent during system maintenance or errors"
  },
  
  // Red Flag Escalation
  red_flag_escalation_v1: {
    category: 'UTILITY',
    template: "Based on your message, please contact {{1}} immediately at {{2}}. This is important for your safety.",
    description: "Sent when AI detects potential medical emergency"
  }
};

/**
 * Process template with variables
 */
export function processTemplate(templateKey: string, variables: string[] = []): string {
  const template = MESSAGE_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  
  let message = template.template;
  variables.forEach((variable, index) => {
    message = message.replace(`{{${index + 1}}}`, variable);
  });
  
  return message;
}

/**
 * Validate template exists
 */
export function isValidTemplate(templateKey: string): boolean {
  return templateKey in MESSAGE_TEMPLATES;
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): Record<string, MessageTemplate> {
  return MESSAGE_TEMPLATES;
}