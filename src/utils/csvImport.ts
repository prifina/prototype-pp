import { normalizePhoneNumber, validatePhoneNumbers } from './phoneNormalization';
import { v4 as uuidv4 } from 'uuid';

export interface CsvRow {
  name: string;
  phone: string;
  notes?: string;
}

export interface CsvValidationResult {
  batchId: string;
  totalRows: number;
  validRows: ProcessedCsvRow[];
  errorRows: CsvErrorRow[];
  duplicatePhones: string[];
  summary: {
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

export interface ProcessedCsvRow {
  rowNumber: number;
  name: string;
  phoneOriginal: string;
  phoneE164: string;
  notes?: string;
}

export interface CsvErrorRow {
  rowNumber: number;
  name: string;
  phoneOriginal: string;
  error: string;
  notes?: string;
}

/**
 * Parse CSV content into structured data
 */
export function parseCsvContent(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  const rows: CsvRow[] = [];
  
  // Skip header row if present
  const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const columns = parseCSVLine(line);
    
    if (columns.length >= 2) {
      rows.push({
        name: columns[0]?.trim() || '',
        phone: columns[1]?.trim() || '',
        notes: columns[2]?.trim() || undefined
      });
    }
  }
  
  return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Validate CSV data and prepare for import
 */
export function validateCsvData(rows: CsvRow[]): CsvValidationResult {
  const batchId = uuidv4();
  const validRows: ProcessedCsvRow[] = [];
  const errorRows: CsvErrorRow[] = [];
  
  // Collect all phone numbers for duplicate checking
  const allPhones = rows.map(row => row.phone);
  const phoneValidation = validatePhoneNumbers(allPhones);
  
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Validate name
    if (!row.name || row.name.trim().length === 0) {
      errorRows.push({
        rowNumber,
        name: row.name,
        phoneOriginal: row.phone,
        error: 'Name is required',
        notes: row.notes
      });
      return;
    }
    
    // Validate phone
    const phoneResult = normalizePhoneNumber(row.phone);
    if (!phoneResult.isValid) {
      errorRows.push({
        rowNumber,
        name: row.name,
        phoneOriginal: row.phone,
        error: phoneResult.error || 'Invalid phone number',
        notes: row.notes
      });
      return;
    }
    
    // Check for duplicates within this CSV
    const duplicateCount = allPhones.filter(p => {
      const normalized = normalizePhoneNumber(p);
      return normalized.isValid && normalized.e164 === phoneResult.e164;
    }).length;
    
    if (duplicateCount > 1) {
      errorRows.push({
        rowNumber,
        name: row.name,
        phoneOriginal: row.phone,
        error: 'Duplicate phone number in CSV',
        notes: row.notes
      });
      return;
    }
    
    validRows.push({
      rowNumber,
      name: row.name.trim(),
      phoneOriginal: row.phone,
      phoneE164: phoneResult.e164!,
      notes: row.notes?.trim()
    });
  });
  
  return {
    batchId,
    totalRows: rows.length,
    validRows,
    errorRows,
    duplicatePhones: phoneValidation.duplicates,
    summary: {
      valid: validRows.length,
      invalid: errorRows.length,
      duplicates: phoneValidation.duplicates.length
    }
  };
}

/**
 * Generate error CSV content for download
 */
export function generateErrorCsv(errors: CsvErrorRow[]): string {
  const header = 'Row,Name,Phone,Error,Notes\n';
  const rows = errors.map(error => 
    `${error.rowNumber},"${error.name}","${error.phoneOriginal}","${error.error}","${error.notes || ''}"`
  ).join('\n');
  
  return header + rows;
}

/**
 * Generate preview CSV for valid rows
 */
export function generatePreviewCsv(validRows: ProcessedCsvRow[]): string {
  const header = 'Name,Original Phone,Normalized Phone,Notes\n';
  const rows = validRows.map(row => 
    `"${row.name}","${row.phoneOriginal}","${row.phoneE164}","${row.notes || ''}"`
  ).join('\n');
  
  return header + rows;
}