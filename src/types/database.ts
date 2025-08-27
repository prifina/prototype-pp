// Database types for Production Physio AI Twin system

export interface Show {
  id: string;
  show_name: string;
  production_house_name: string;
  contacts?: {
    gm?: string;
    production_coordinator?: string;
    company_manager?: string;
  };
  default_seat_duration_days: number;
  status: 'active' | 'archived';
  passcode_hash: string;
  seat_limit: number;
  start_at: string;
  end_at?: string;
  created_at: string;
  updated_at: string;
}

// Legacy alias for backward compatibility
export type Production = Show;

export type SeatStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface Seat {
  id: string;
  show_id: string; // Updated from production_id to match new Show model
  phone_e164?: string;
  phone_original_input?: string; // Store original input for audit/support
  phone_hash?: string;
  status: SeatStatus;
  start_at?: string;
  end_at?: string;
  expires_at?: string; // When this seat expires
  seat_code: string;
  qr_url?: string;
  license_batch_id?: string; // Group seats from same CSV import
  wa_id?: string; // WhatsApp ID after binding
  binding_completed_at?: string; // When seat was bound to phone
  created_at: string;
  updated_at: string;
}

export type TourOrResident = 'tour' | 'resident';

export interface Profile {
  id: string;
  seat_id: string;
  name: string;
  role: string;
  show_name: string;
  tour_or_resident: TourOrResident;
  phone_e164?: string; // Normalized phone number
  sleep_env?: {
    environment: 'hotel' | 'home' | 'other';
    noise_level: 'quiet' | 'moderate' | 'noisy';
    light_control: 'good' | 'limited' | 'poor';
    notes?: string;
  };
  food_constraints?: {
    allergies: string[];
    intolerances: string[];
    dietary_preferences: string[];
    notes?: string;
  };
  injuries_notes?: string;
  goals?: string;
  consent_flags?: {
    privacy_policy: boolean;
    terms_of_service: boolean;
    whatsapp_opt_in: boolean;
    data_processing: boolean;
  };
  consent_ts?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminNote {
  id: string;
  seat_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export type MessageDirection = 'in' | 'out';
export type MessageChannel = 'whatsapp';

export interface MessageLog {
  id: string;
  seat_id: string;
  direction: MessageDirection;
  channel: MessageChannel;
  payload: any;
  template_used?: string;
  within_24h: boolean;
  provider_message_id?: string;
  created_at: string;
}

export type OptEventType = 'opt_in' | 'opt_out';
export type OptEventSource = 'web' | 'chat' | 'admin';

export interface OptEvent {
  id: string;
  seat_id: string;
  type: OptEventType;
  source: OptEventSource;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  before_data?: any;
  after_data?: any;
  created_at: string;
}

// Form data types for onboarding
export interface OnboardingFormData {
  // Personal info
  name: string;
  role: string;
  show_name: string;
  tour_or_resident: TourOrResident;
  
  // Phone number (will be validated against pre-loaded seats)
  phone_number: string;
  
  // Health context
  sleep_environment: 'hotel' | 'home' | 'other';
  noise_level: 'quiet' | 'moderate' | 'noisy';
  light_control: 'good' | 'limited' | 'poor';
  sleep_notes?: string;
  
  // Food constraints
  allergies: string[];
  intolerances: string[];
  dietary_preferences: string[];
  food_notes?: string;
  
  // Health & goals
  injuries_notes?: string;
  goals?: string;
  
  // Consent
  privacy_policy: boolean;
  terms_of_service: boolean;
  whatsapp_opt_in: boolean;
  data_processing: boolean;
}

export interface OnboardingResponse {
  seat_id: string;
  wa_link: string;
  qr_url: string;
}