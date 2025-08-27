import { supabase } from '@/integrations/supabase/client';
import { Show } from '@/types/database';

export const showApi = {
  /**
   * Verify show passcode and return show details
   */
  async verifyPasscode(passcode: string): Promise<{ id: string; show_name: string; production_house_name: string }> {
    try {
      // For demo purposes, accept DEMO123 passcode
      if (passcode === 'DEMO123') {
        return { 
          id: 'demo-show-id', 
          show_name: 'Demo Show',
          production_house_name: 'Demo Production House'
        };
      }
      
      // TODO: When Supabase tables are ready, uncomment this:
      // const hashedPasscode = await hashPasscode(passcode);
      // const { data, error } = await (supabase as any)
      //   .from('shows')
      //   .select('id, show_name, production_house_name')
      //   .eq('passcode_hash', hashedPasscode)
      //   .eq('status', 'active')
      //   .single();

      throw new Error('Invalid passcode');
    } catch (error) {
      console.error('Passcode verification failed:', error);
      throw new Error('Invalid passcode');
    }
  },

  /**
   * Get show details by ID
   */
  async getShow(showId: string): Promise<Show> {
    // Mock implementation until Supabase tables are ready
    if (showId === 'demo-show-id') {
      return {
        id: 'demo-show-id',
        show_name: 'Demo Show',
        production_house_name: 'Demo Production House',
        default_seat_duration_days: 180,
        status: 'active',
        passcode_hash: await hashPasscode('DEMO123'),
        seat_limit: 50,
        start_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    throw new Error('Show not found');
  },

  /**
   * List all active shows for admin
   */
  async listShows(): Promise<Show[]> {
    // Mock implementation until Supabase tables are ready
    return [
      {
        id: 'demo-show-id',
        show_name: 'Demo Show',
        production_house_name: 'Demo Production House',
        default_seat_duration_days: 180,
        status: 'active',
        passcode_hash: await hashPasscode('DEMO123'),
        seat_limit: 50,
        start_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  },

  /**
   * Create a new show
   */
  async createShow(showData: Omit<Show, 'id' | 'created_at' | 'updated_at'>): Promise<Show> {
    // Mock implementation until Supabase tables are ready
    const now = new Date().toISOString();
    return {
      id: `show-${Date.now()}`,
      created_at: now,
      updated_at: now,
      ...showData
    };
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