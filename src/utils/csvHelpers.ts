/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Anggota, JenisSimpanan } from '../types';

/**
 * Downloads a string content as a CSV file in the browser.
 */
export function downloadCsv(filename: string, content: string) {
  // Add BOM for UTF-8 Excel compatibility
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV text fields properly.
 */
function escapeCsv(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface ParsedSavingsRow {
  memberId: string;
  namaMember: string;
  jenis: JenisSimpanan;
  periode: string;
  jumlah: number;
  tanggal: string;
  catatan: string;
  isValid: boolean;
  errorMsg?: string;
}

export interface ParsedInstallmentRow {
  namaMember: string;
  pokok: number;
  bunga: number;
  tanggal: string;
  catatan: string;
  isValid: boolean;
  errorMsg?: string;
}

/**
 * Generates CSV template pre-populated with member names for Simpanan.
 */
export function generateSavingsCsvTemplate(
  anggotaList: Anggota[],
  defaultJenis: JenisSimpanan = 'wajib',
  defaultPeriode: string = new Date().toISOString().slice(0, 7),
  defaultTanggal: string = new Date().toISOString().split('T')[0]
): string {
  const headers = ['ID_Anggota', 'Nama_Anggota', 'Jenis_Simpanan', 'Periode', 'Jumlah_Rp', 'Tanggal', 'Catatan'];
  const rows = anggotaList.map(a => [
    escapeCsv(a.id),
    escapeCsv(a.nama),
    escapeCsv(defaultJenis),
    escapeCsv(defaultPeriode),
    '50000', // Default example amount
    escapeCsv(defaultTanggal),
    escapeCsv('Setoran Rutin')
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Parses uploaded CSV for Simpanan.
 */
export function parseSavingsCsv(csvText: string, anggotaList: Anggota[]): ParsedSavingsRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const results: ParsedSavingsRow[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const [idRaw, namaRaw, jenisRaw, periodeRaw, jumlahRaw, tanggalRaw, catatanRaw] = cols;
    const memberId = idRaw?.trim() || '';
    const namaMember = namaRaw?.trim() || '';
    
    // Find member by ID or by exact Name matching
    const matchedMember = anggotaList.find(a => a.id === memberId || a.nama.toLowerCase() === namaMember.toLowerCase());
    
    const jenisClean = (jenisRaw?.trim().toLowerCase() || 'wajib') as JenisSimpanan;
    const validJenis: JenisSimpanan[] = ['pokok', 'wajib', 'sukarela'];
    const jenis: JenisSimpanan = validJenis.includes(jenisClean) ? jenisClean : 'wajib';

    const periode = periodeRaw?.trim() || new Date().toISOString().slice(0, 7);
    const cleanJumlah = (jumlahRaw || '0').replace(/[^0-9]/g, '');
    const jumlah = parseInt(cleanJumlah, 10) || 0;
    const tanggal = tanggalRaw?.trim() || new Date().toISOString().split('T')[0];
    const catatan = catatanRaw?.trim() || '';

    let isValid = true;
    let errorMsg = '';

    if (!matchedMember) {
      isValid = false;
      errorMsg = 'Anggota tidak ditemukan';
    } else if (jumlah <= 0) {
      isValid = false;
      errorMsg = 'Jumlah harus lebih besar dari 0';
    }

    results.push({
      memberId: matchedMember ? matchedMember.id : memberId,
      namaMember: matchedMember ? matchedMember.nama : namaMember,
      jenis,
      periode,
      jumlah,
      tanggal,
      catatan,
      isValid,
      errorMsg
    });
  }

  return results;
}

/**
 * Generates CSV template pre-populated with member names for Cicilan / Angsuran.
 */
export function generateInstallmentsCsvTemplate(
  anggotaList: Anggota[],
  defaultTanggal: string = new Date().toISOString().split('T')[0]
): string {
  const headers = ['Nama_Anggota', 'Angsuran_Pokok_Rp', 'Penerimaan_Bunga_Rp', 'Tanggal', 'Catatan'];
  const rows = anggotaList.map(a => [
    escapeCsv(a.nama),
    '0',
    '0',
    escapeCsv(defaultTanggal),
    escapeCsv('Cicilan Pinjaman')
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Parses uploaded CSV for Cicilan / Angsuran.
 */
export function parseInstallmentsCsv(csvText: string, anggotaList: Anggota[]): ParsedInstallmentRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const results: ParsedInstallmentRow[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const [namaRaw, pokokRaw, bungaRaw, tanggalRaw, catatanRaw] = cols;
    const namaMember = namaRaw?.trim() || '';
    
    const matchedMember = anggotaList.find(a => a.nama.toLowerCase() === namaMember.toLowerCase());
    
    const cleanPokok = (pokokRaw || '0').replace(/[^0-9]/g, '');
    const cleanBunga = (bungaRaw || '0').replace(/[^0-9]/g, '');
    const pokok = parseInt(cleanPokok, 10) || 0;
    const bunga = parseInt(cleanBunga, 10) || 0;

    const tanggal = tanggalRaw?.trim() || new Date().toISOString().split('T')[0];
    const catatan = catatanRaw?.trim() || '';

    let isValid = true;
    let errorMsg = '';

    if (!matchedMember) {
      isValid = false;
      errorMsg = 'Anggota tidak ditemukan';
    } else if (pokok <= 0 && bunga <= 0) {
      isValid = false;
      errorMsg = 'Nilai Pokok atau Bunga harus diisi (> 0)';
    }

    results.push({
      namaMember: matchedMember ? matchedMember.nama : namaMember,
      pokok,
      bunga,
      tanggal,
      catatan,
      isValid,
      errorMsg
    });
  }

  return results;
}

/**
 * Basic CSV line parser handling quoted strings.
 */
function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}
