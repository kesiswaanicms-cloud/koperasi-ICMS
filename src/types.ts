/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Anggota {
  id: string;
  nama: string;
  jabatan: 'Anggota' | 'Pengurus';
  bobotPengurus: number; // 0 to 100
}

export type JenisSimpanan = 'pokok' | 'wajib' | 'sukarela';

export interface Simpanan {
  id: string;
  memberId: string;
  jenis: JenisSimpanan;
  periode: string; // e.g., "2026-07"
  jumlah: number;  // must be positive
  tanggal: string; // YYYY-MM-DD
  catatan?: string;
}

export type KategoriAktivitas = 
  | 'ksp_pinjaman'    // Pemberian Pinjaman
  | 'ksp_angsuran'    // Angsuran Pokok
  | 'ksp_bunga'       // Penerimaan Bunga
  | 'ksp_admin'       // Biaya Administrasi
  | 'prod_pembelian'  // Pembelian Barang/Bahan Baku
  | 'prod_penjualan'  // Penjualan Barang
  | 'beban_admin'     // Beban Administrasi & Umum
  | 'beban_gaji'      // Beban Personalia/Gaji
  | 'modal_tarik_sukarela' // Pengambilan Simpanan Sukarela
  | 'modal_keluar_anggota'; // Pengembalian/Penyelesaian Simpanan Anggota Keluar

export interface LabaUsaha {
  id: string;
  namaUsaha: string;
  pengeluaran: number; // must be positive/zero
  penerimaan: number;  // must be positive/zero
  tanggal: string;     // YYYY-MM-DD
  catatan?: string;
  kategori?: KategoriAktivitas;
}

export interface PengaturanSHU {
  persenLabaPool: number;      // percentage of total profit allocated for SHU pool
  persenPoolSimpanan: number;  // percentage of SHU pool allocated for "jasa modal" (savings)
  persenPoolPengurus: number;  // percentage of SHU pool allocated for "jasa pengurus"
}

export interface KoperasiData {
  anggota: Anggota[];
  simpanan: Simpanan[];
  labaUsaha: LabaUsaha[];
  pengaturanSHU: PengaturanSHU;
}
