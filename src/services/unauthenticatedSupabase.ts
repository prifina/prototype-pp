// src/services/unauthenticatedSupabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://fkvtnyvttgjiherassmn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdnRueXZ0dGdqaWhlcmFzc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzkxNzcsImV4cCI6MjA3MTkxNTE3N30.8LovbABQbDqSkVzWrqr6WnCZawP2V7aFM0-htaounI8";

// Create a fresh client without any persisted session
export const unauthenticatedSupabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,  // Critical: Don't persist any session
      autoRefreshToken: false, // Don't auto refresh
      detectSessionInUrl: false // Don't detect session in URL
    }
  }
);