/**
 * Client-side audit logging utilities
 * For logging administrative actions and changes
 */

export interface AuditLogEntry {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event (client-side mock - replace with actual API)
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>): Promise<void> {
  try {
    const auditEntry: AuditLogEntry = {
      ...entry,
      ipAddress: 'client', // Would be determined server-side in production
      userAgent: navigator.userAgent.substring(0, 100)
    };

    // TODO: Send to audit logging API
    console.log('Audit Log:', auditEntry);
    
    // In production, this would be:
    // await fetch('/api/audit-log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(auditEntry)
    // });

  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Generate audit details for different action types
 */
export const auditMessages = {
  seatCreate: (count: number, batchId: string) => 
    `Created ${count} seats via CSV import (batch: ${batchId})`,
    
  seatPhoneUpdate: (oldPhone: string, newPhone: string) =>
    `Updated phone from ${oldPhone} to ${newPhone}`,
    
  seatBinding: (waId: string) =>
    `Seat bound to WhatsApp ID: ${waId}`,
    
  seatRevoke: (reason?: string) =>
    `Seat revoked${reason ? ` due to ${reason}` : ''}`,
    
  seatExpiry: () =>
    'Seat expired automatically at end of duration',
    
  seatExtend: (newExpiry: string) =>
    `Seat expiry extended to ${newExpiry}`,
    
  showCreate: (name: string, productionHouse: string) =>
    `Created show "${name}" for ${productionHouse}`,
    
  csvImport: (validRows: number, errorRows: number, batchId: string) =>
    `CSV import completed: ${validRows} valid, ${errorRows} errors (batch: ${batchId})`
};

/**
 * Helper to get current user context for audit logging
 */
export function getCurrentActor(): string {
  // TODO: Get from actual authentication context
  return 'admin@productionphysio.com';
}