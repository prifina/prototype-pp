/**
 * Enhanced message templates matching specification requirements
 */

export interface MessageTemplate {
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  template: string;
  buttons?: string[];
  description?: string;
  body?: string; // For backwards compatibility
}

export enum MessageType {
  SEAT_BOUND_SUCCESS = 'SEAT_BOUND_SUCCESS',
  SEAT_NOT_FOUND = 'SEAT_NOT_FOUND',
  SEAT_EXPIRED = 'SEAT_EXPIRED',
  SEAT_ALREADY_BOUND = 'SEAT_ALREADY_BOUND',
  SEAT_REVOKED = 'SEAT_REVOKED',
  NO_ACTIVE_SEAT = 'NO_ACTIVE_SEAT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export const MESSAGE_TEMPLATES: Record<string, MessageTemplate> = {
  // Success Messages
  SEAT_BOUND_SUCCESS: {
    category: 'UTILITY',
    template: "Welcome! You're now connected with the AI Performance Assistant. What would you like to discuss?",
    body: "Welcome! You're now connected with the AI Performance Assistant. What would you like to discuss?",
    description: "Sent when user is automatically connected"
  },
  // Onboarding & Access
  onboarding_help_v1: {
    category: 'UTILITY',
    template: "Hi! To start using your AI Performance Assistant, please complete onboarding at {{1}}.",
    description: "Sent when onboarding help is needed"
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
  
  // Error States - Legacy format support
  SEAT_NOT_FOUND: {
    category: 'UTILITY',
    template: "Access code not recognized. Please check with your company manager or complete onboarding.",
    body: "Access code not recognized. Please check with your company manager or complete onboarding.",
    description: "Sent when seat code doesn't exist"
  },
  
  SEAT_EXPIRED: {
    category: 'UTILITY',
    template: "Your AI Performance Assistant access has expired. Please contact your production if you need continued access.",
    body: "Your AI Performance Assistant access has expired. Please contact your production if you need continued access.",
    description: "Sent when seat is expired"
  },
  
  SEAT_ALREADY_BOUND: {
    category: 'UTILITY',
    template: "This access code is linked to another number. Please contact support if you believe this is an error.",
    body: "This access code is linked to another number. Please contact support if you believe this is an error.",
    description: "Sent when seat already bound to different phone"
  },
  
  SEAT_REVOKED: {
    category: 'UTILITY',
    template: "Your access has been revoked. Please contact your company manager if you have questions.",
    body: "Your access has been revoked. Please contact your company manager if you have questions.",
    description: "Sent when seat is revoked"
  },
  
  NO_ACTIVE_SEAT: {
    category: 'UTILITY',
    template: "Sorry, no seats are currently available. Please contact your company manager for assistance.",
    body: "Sorry, no seats are currently available. Please contact your company manager for assistance.",
    description: "Sent when no seats are available for auto-binding"
  },
  
  SESSION_EXPIRED: {
    category: 'UTILITY',
    template: "Ready to continue your coaching? Just reply to get started.",
    body: "Ready to continue your coaching? Just reply to get started.",
    description: "Sent when user messages after 24-hour window"
  },
  
  SYSTEM_ERROR: {
    category: 'UTILITY',
    template: "Service temporarily unavailable. Please try again in a few minutes.",
    body: "Service temporarily unavailable. Please try again in a few minutes.",
    description: "Sent during system errors"
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
 * Get message template by type
 */
export function getMessageTemplate(messageType: MessageType, variables?: Record<string, string>): MessageTemplate {
  const template = MESSAGE_TEMPLATES[messageType];
  if (!template) {
    throw new Error(`Template not found: ${messageType}`);
  }
  
  let processedTemplate = { ...template };
  
  // Replace variables in template/body if provided
  if (variables) {
    const replaceVars = (text: string) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
    };
    
    processedTemplate.template = replaceVars(processedTemplate.template);
    if (processedTemplate.body) {
      processedTemplate.body = replaceVars(processedTemplate.body);
    }
  }
  
  return processedTemplate;
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): Record<string, MessageTemplate> {
  return MESSAGE_TEMPLATES;
}