import { supabase } from '@/integrations/supabase/client';
import { Seat, SeatStatus } from '@/types/database';
import { ProcessedCsvRow } from '@/utils/csvImport';
import { normalizePhoneNumber, hashPhoneNumber } from '@/utils/phoneNormalization';
import { v4 as uuidv4 } from 'uuid';

export const seatApi = {
  /**
   * Import seats from CSV data
   */
  async importSeats(
    showId: string, 
    validRows: ProcessedCsvRow[], 
    batchId: string,
    defaultDurationDays: number = 180
  ): Promise<Seat[]> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + defaultDurationDays * 24 * 60 * 60 * 1000);
    
    const seatsToInsert = await Promise.all(
      validRows.map(async (row) => ({
        show_id: showId,
        seat_code: generateSeatCode(),
        phone_number: row.phoneE164,
        status: 'pending' as SeatStatus,
        expires_at: expiresAt.toISOString()
      }))
    );

    const { data, error } = await supabase
      .from('seats')
      .insert(seatsToInsert)
      .select();

    if (error) {
      console.error('Seat import error:', error);
      throw new Error('Failed to import seats');
    }

    return (data || []) as Seat[];
  },

  /**
   * Create a single seat manually
   */
  async createSeat(
    showId: string,
    phoneNumber: string,
    defaultDurationDays: number = 180
  ): Promise<Seat> {
    const phoneResult = normalizePhoneNumber(phoneNumber);
    if (!phoneResult.isValid) {
      throw new Error('Invalid phone number format');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + defaultDurationDays * 24 * 60 * 60 * 1000);

    const seatData = {
      show_id: showId,
      seat_code: generateSeatCode(),
      phone_number: phoneResult.e164,
      status: 'pending' as SeatStatus,
      expires_at: expiresAt.toISOString()
    };

    const { data, error } = await supabase
      .from('seats')
      .insert([seatData])
      .select()
      .single();

    if (error) {
      console.error('Seat creation error:', error);
      throw new Error('Failed to create seat');
    }

    return data as Seat;
  },

  /**
   * Find seat by phone number for onboarding validation - tries multiple normalized formats
   */
  async findSeatByPhone(showId: string, phoneNumber: string): Promise<Seat | null> {
    console.log('Seat API - Looking for seat with phone:', phoneNumber);
    
    try {
      const phoneResult = normalizePhoneNumber(phoneNumber);
      console.log('Seat API - Normalized phone result:', phoneResult);
      
      if (!phoneResult.isValid) {
        console.log('Seat API - Invalid phone number, cannot search');
        return null;
      }

      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('show_id', showId)
        .eq('phone_number', phoneResult.e164)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        console.error('Seat API - Error finding seat:', error);
        return null;
      }

      console.log('Seat API - Seat lookup result:', data);
      return data as Seat | null;
    } catch (error) {
      console.error('Seat API - Seat lookup error:', error);
      return null;
    }
  },

  /**
   * Get seats for a show with optional filtering
   */
  async getSeats(
    showId: string, 
    filters?: { 
      status?: SeatStatus; 
      search?: string; 
      batchId?: string; 
    }
  ): Promise<Seat[]> {
    let query = supabase
      .from('seats')
      .select('*')
      .eq('show_id', showId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`seat_code.ilike.${searchTerm},phone_number.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch seats:', error);
      throw new Error('Failed to fetch seats');
    }

    return (data || []) as Seat[];
  },

  /**
   * Update seat status
   */
  async updateSeatStatus(seatId: string, status: SeatStatus): Promise<Seat> {
    const { data, error } = await supabase
      .from('seats')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', seatId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update seat status:', error);
      throw new Error('Failed to update seat status');
    }

    return data as Seat;
  },

  /**
   * Correct phone number for unbound seat
   */
  async correctSeatPhone(seatId: string, newPhoneNumber: string): Promise<Seat> {
    const phoneResult = normalizePhoneNumber(newPhoneNumber);
    if (!phoneResult.isValid) {
      throw new Error('Invalid phone number format');
    }

    const { data, error } = await supabase
      .from('seats')
      .update({ 
        phone_number: phoneResult.e164!,
        updated_at: new Date().toISOString()
      })
      .eq('id', seatId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update seat phone:', error);
      throw new Error('Failed to update seat phone number');
    }

    return data as Seat;
  },

  /**
   * Delete seats
   */
  async deleteSeats(seatIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('seats')
      .delete()
      .in('id', seatIds);

    if (error) {
      console.error('Failed to delete seats:', error);
      throw new Error('Failed to delete seats');
    }
  }
};

/**
 * Generate a unique seat code
 */
function generateSeatCode(): string {
  const prefix = 'SC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}