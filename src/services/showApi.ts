import { supabase } from '@/integrations/supabase/client';
import { Show } from '@/types/database';

export const showApi = {
  /**
   * Verify show passcode and return show details
   */
  async verifyPasscode(passcode: string): Promise<{ id: string; show_name: string; production_house_name: string }> {
    try {
      const hashedPasscode = await hashPasscode(passcode);
      const { data, error } = await supabase
        .from('shows')
        .select('id, name, production_house')
        .eq('passcode', hashedPasscode)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Invalid passcode');
      }

      if (!data) {
        throw new Error('Invalid passcode');
      }

      return { 
        id: data.id, 
        show_name: data.name,
        production_house_name: data.production_house || ''
      };
    } catch (error) {
      console.error('Passcode verification failed:', error);
      throw new Error('Invalid passcode');
    }
  },

  /**
   * Get show details by ID
   */
  async getShow(showId: string): Promise<Show> {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('id', showId)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Show not found');
      }

      if (!data) {
        throw new Error('Show not found');
      }

      return {
        id: data.id,
        show_name: data.name,
        production_house_name: data.production_house || '',
        default_seat_duration_days: data.duration_days || 30,
        status: data.status as 'active' | 'archived',
        passcode_hash: data.passcode,
        seat_limit: data.seat_limit || 100,
        start_at: data.created_at,
        end_at: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Failed to get show:', error);
      throw new Error('Show not found');
    }
  },

  /**
   * List all active shows for admin
   */
  async listShows(): Promise<Show[]> {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to load shows');
      }

      return (data || []).map(show => ({
        id: show.id,
        show_name: show.name,
        production_house_name: show.production_house || '',
        default_seat_duration_days: show.duration_days || 30,
        status: show.status as 'active' | 'archived',
        passcode_hash: show.passcode,
        seat_limit: show.seat_limit || 100,
        start_at: show.created_at,
        end_at: null,
        created_at: show.created_at,
        updated_at: show.updated_at
      }));
    } catch (error) {
      console.error('Failed to list shows:', error);
      throw new Error('Failed to load shows');
    }
  },

  /**
   * Create a new show
   */
  async createShow(showData: Omit<Show, 'id' | 'created_at' | 'updated_at'>): Promise<Show> {
    try {
      const { data, error } = await supabase
        .from('shows')
        .insert([{
          name: showData.show_name,
          production_house: showData.production_house_name,
          passcode: showData.passcode_hash,
          seat_limit: showData.seat_limit,
          duration_days: showData.default_seat_duration_days,
          status: 'active',
          contact_email: '',
          contact_phone: ''
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to create show');
      }

      return {
        id: data.id,
        show_name: data.name,
        production_house_name: data.production_house || '',
        default_seat_duration_days: data.duration_days || 30,
        status: data.status as 'active' | 'archived',
        passcode_hash: data.passcode,
        seat_limit: data.seat_limit || 100,
        start_at: data.created_at,
        end_at: null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Failed to create show:', error);
      throw new Error('Failed to create show');
    }
  }
};

/**
 * Hash a passcode for secure storage
 */
async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}