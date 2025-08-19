// Database types for Production Physio AI Twin system

export interface Production {
  id: string;
  name: string;
  passcode_hash: string;
  seat_limit: number;
  start_at: string;
  end_at?: string;
  created_at: string;
  updated_at: string;
}

export type SeatStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface Seat {
  id: string;
  production_id: string;
  phone_e164?: string;
  phone_hash?: string;
  status: SeatStatus;
  start_at?: string;
  end_at?: string;
  seat_code: string;
  qr_url?: string;
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