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
    // Mock implementation until Supabase tables are ready
    const now = new Date();
    const expiresAt = new Date(now.getTime() + defaultDurationDays * 24 * 60 * 60 * 1000);
    
    const seats = await Promise.all(
      validRows.map(async (row) => ({
        id: `seat-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        show_id: showId,
        seat_code: generateSeatCode(),
        phone_e164: row.phoneE164,
        phone_original_input: row.phoneOriginal,
        phone_hash: await hashPhoneNumber(row.phoneE164),
        status: 'pending' as SeatStatus,
        expires_at: expiresAt.toISOString(),
        license_batch_id: batchId,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }))
    );

    return seats;
  },

  /**
   * Find seat by phone number for onboarding validation
   */
  async findSeatByPhone(showId: string, phoneNumber: string): Promise<Seat | null> {
    try {
      const phoneResult = normalizePhoneNumber(phoneNumber);
      if (!phoneResult.isValid) {
        return null;
      }

      // Mock implementation - for demo, return a valid seat for normalized phone
      if (phoneResult.e164 && showId === 'demo-show-id') {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        
        return {
          id: `seat-${Date.now()}`,
          show_id: showId,
          seat_code: generateSeatCode(),
          phone_e164: phoneResult.e164,
          phone_original_input: phoneResult.originalInput,
          phone_hash: await hashPhoneNumber(phoneResult.e164),
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          license_batch_id: 'demo-batch',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Seat lookup error:', error);
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
    // Mock implementation until Supabase tables are ready
    const mockSeats: Seat[] = [
      {
        id: 'seat-1',
        show_id: showId,
        seat_code: 'SC-DEMO-ABC12345-X',
        phone_e164: '+447700900123',
        phone_original_input: '07700 900123',
        phone_hash: 'hash123',
        status: 'pending',
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        license_batch_id: 'batch-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    let filteredSeats = mockSeats;

    if (filters?.status) {
      filteredSeats = filteredSeats.filter(seat => seat.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSeats = filteredSeats.filter(seat => 
        seat.seat_code.toLowerCase().includes(searchLower) ||
        seat.phone_e164?.includes(searchLower) ||
        seat.phone_original_input?.toLowerCase().includes(searchLower)
      );
    }

    return filteredSeats;
  },

  /**
   * Update seat status
   */
  async updateSeatStatus(seatId: string, status: SeatStatus): Promise<Seat> {
    // Mock implementation until Supabase tables are ready
    const now = new Date();
    return {
      id: seatId,
      show_id: 'demo-show-id',
      seat_code: 'SC-DEMO-ABC12345-X',
      phone_e164: '+447700900123',
      phone_original_input: '07700 900123',
      phone_hash: 'hash123',
      status,
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      license_batch_id: 'batch-1',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  },

  /**
   * Correct phone number for unbound seat
   */
  async correctSeatPhone(seatId: string, newPhoneNumber: string): Promise<Seat> {
    const phoneResult = normalizePhoneNumber(newPhoneNumber);
    if (!phoneResult.isValid) {
      throw new Error('Invalid phone number format');
    }

    // Mock implementation until Supabase tables are ready
    const now = new Date();
    return {
      id: seatId,
      show_id: 'demo-show-id',
      seat_code: 'SC-DEMO-ABC12345-X',
      phone_e164: phoneResult.e164!,
      phone_original_input: phoneResult.originalInput,
      phone_hash: await hashPhoneNumber(phoneResult.e164!),
      status: 'pending',
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      license_batch_id: 'batch-1',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  }
};

/**
 * Generate a unique seat code
 */
function generateSeatCode(): string {
  const prefix = 'SC';
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const suffix = 'X';
  return `${prefix}-${randomPart}-${suffix}`;
}