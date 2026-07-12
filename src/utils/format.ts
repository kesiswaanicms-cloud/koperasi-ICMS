/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KoperasiData, Anggota, Simpanan, LabaUsaha } from '../types';

/**
 * Formats a number into Indonesian Rupiah (Rp) with thousands separators.
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount).replace('IDR', 'Rp');
}

/**
 * Helper to calculate total savings per member.
 */
export function getMemberTotalSavings(memberId: string, simpananList: Simpanan[]): number {
  return simpananList
    .filter((s) => s.memberId === memberId)
    .reduce((sum, s) => sum + s.jumlah, 0);
}

/**
 * Helper to calculate total savings per member by category.
 */
export function getMemberSavingsBreakdown(memberId: string, simpananList: Simpanan[]) {
  const filtered = simpananList.filter((s) => s.memberId === memberId);
  return {
    pokok: filtered.filter((s) => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0),
    wajib: filtered.filter((s) => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0),
    sukarela: filtered.filter((s) => s.jenis === 'sukarela').reduce((sum, s) => sum + s.jumlah, 0),
  };
}

/**
 * Helper to calculate total of all business profit activities.
 * Laba = Penerimaan - Pengeluaran
 */
export function getBusinessProfitSummary(labaUsahaList: LabaUsaha[]) {
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;
  
  labaUsahaList.forEach((item) => {
    // Exclude capital/savings transactions from operating profit calculations
    if (item.kategori === 'modal_tarik_sukarela' || item.kategori === 'modal_keluar_anggota') {
      return;
    }
    totalPenerimaan += item.penerimaan;
    totalPengeluaran += item.pengeluaran;
  });
  
  const totalLaba = totalPenerimaan - totalPengeluaran;
  
  return {
    penerimaan: totalPenerimaan,
    pengeluaran: totalPengeluaran,
    laba: totalLaba,
  };
}

/**
 * SHU Calculation Result Item Interface
 */
export interface SHUCalculatedResult {
  memberId: string;
  nama: string;
  jabatan: 'Anggota' | 'Pengurus';
  bobotPengurus: number;
  totalSimpanan: number;
  proporsiSimpananPersen: number; // % contribution to total savings
  shuJasaModal: number;           // SHU from savings
  shuJasaPengurus: number;        // SHU from management duties
  totalSHU: number;               // Jasa Modal + Jasa Pengurus
}

/**
 * Core SHU calculation engine.
 */
export function calculateAllSHU(data: KoperasiData): {
  results: SHUCalculatedResult[];
  summary: {
    totalLaba: number;
    shuPool: number;
    poolSimpanan: number;
    poolPengurus: number;
    distributedSimpanan: number;
    distributedPengurus: number;
    distributedTotal: number;
  };
} {
  const { anggota, simpanan, labaUsaha, pengaturanSHU } = data;
  
  // 1. Total Net Profit
  const profitSummary = getBusinessProfitSummary(labaUsaha);
  const totalLaba = Math.max(0, profitSummary.laba); // Avoid negative profit for SHU calculations
  
  // 2. SHU Pool
  const shuPool = (totalLaba * pengaturanSHU.persenLabaPool) / 100;
  
  // 3. Portion Pools
  const poolSimpanan = (shuPool * pengaturanSHU.persenPoolSimpanan) / 100;
  const poolPengurus = (shuPool * pengaturanSHU.persenPoolPengurus) / 100;
  
  // 4. Calculate cooperative totals for ratios
  // Total Savings across all members
  const totalCoopSavings = simpanan.reduce((sum, s) => sum + s.jumlah, 0);
  
  // Total Bobot Pengurus across active managers
  const totalBobotPengurus = anggota
    .filter((m) => m.jabatan === 'Pengurus')
    .reduce((sum, m) => sum + m.bobotPengurus, 0);

  let distributedSimpanan = 0;
  let distributedPengurus = 0;

  const results: SHUCalculatedResult[] = anggota.map((member) => {
    const memberSavings = getMemberTotalSavings(member.id, simpanan);
    
    // a. Proporsi Simpanan
    const proporsiSimpananPersen = totalCoopSavings > 0 ? (memberSavings / totalCoopSavings) * 100 : 0;
    
    // b. Jasa Modal SHU
    const shuJasaModal = totalCoopSavings > 0 ? (memberSavings / totalCoopSavings) * poolSimpanan : 0;
    distributedSimpanan += shuJasaModal;
    
    // c. Jasa Pengurus SHU
    let shuJasaPengurus = 0;
    if (member.jabatan === 'Pengurus' && totalBobotPengurus > 0) {
      shuJasaPengurus = (member.bobotPengurus / totalBobotPengurus) * poolPengurus;
    }
    distributedPengurus += shuJasaPengurus;
    
    return {
      memberId: member.id,
      nama: member.nama,
      jabatan: member.jabatan,
      bobotPengurus: member.bobotPengurus,
      totalSimpanan: memberSavings,
      proporsiSimpananPersen,
      shuJasaModal,
      shuJasaPengurus,
      totalSHU: shuJasaModal + shuJasaPengurus,
    };
  });

  return {
    results,
    summary: {
      totalLaba,
      shuPool,
      poolSimpanan,
      poolPengurus,
      distributedSimpanan,
      distributedPengurus,
      distributedTotal: distributedSimpanan + distributedPengurus,
    },
  };
}

/**
 * Summarizes cooperative transactions into 4 activity cycles.
 */
export function getCycleSummary(simpananList: Simpanan[], labaUsahaList: LabaUsaha[]) {
  // Cycle 1: Modal & Simpanan
  const pokok = simpananList.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0);
  const wajib = simpananList.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
  const sukarela = simpananList.filter(s => s.jenis === 'sukarela').reduce((sum, s) => sum + s.jumlah, 0);
  const totalModalSimpanan = pokok + wajib + sukarela;

  // Cycle 1 Cash Outflows: Withdrawals & Outgoing Member Settlement
  let modal_tarik_sukarela = 0;
  let modal_keluar_anggota = 0;

  // Cycle 2: Simpan Pinjam breakdowns
  let ksp_pinjaman = 0;
  let ksp_angsuran = 0;
  let ksp_bunga = 0;
  let ksp_admin = 0;

  // Cycle 3: Consumer/Producer breakdowns
  let prod_pembelian = 0;
  let prod_penjualan = 0;

  // Cycle 4: Expense breakdowns
  let beban_admin = 0;
  let beban_gaji = 0;

  labaUsahaList.forEach(item => {
    let kat = item.kategori;
    if (!kat) {
      const nameLower = item.namaUsaha.toLowerCase();
      if (item.id === 'l1' || nameLower.includes('kurma')) {
        kat = 'prod_penjualan';
      } else if (item.id === 'l2' || nameLower.includes('hewan') || nameLower.includes('kambing')) {
        kat = 'prod_penjualan';
      } else if (item.id === 'l3' || nameLower.includes('vario') || nameLower.includes('motor') || nameLower.includes('pinjam')) {
        kat = 'ksp_pinjaman';
      } else if (item.id === 'l4' || nameLower.includes('makanan') || nameLower.includes('kantin')) {
        kat = 'prod_penjualan';
      } else if (nameLower.includes('gaji') || nameLower.includes('honor') || nameLower.includes('personalia')) {
        kat = 'beban_gaji';
      } else if (nameLower.includes('beban') || nameLower.includes('listrik') || nameLower.includes('telepon') || nameLower.includes('atk') || nameLower.includes('sewa') || nameLower.includes('administrasi')) {
        kat = 'beban_admin';
      } else {
        kat = 'prod_penjualan'; // default fallback
      }
    }

    if (kat === 'ksp_pinjaman') {
      ksp_pinjaman += item.pengeluaran;
    } else if (kat === 'ksp_angsuran') {
      ksp_angsuran += item.penerimaan;
    } else if (kat === 'ksp_bunga') {
      ksp_bunga += item.penerimaan;
    } else if (kat === 'ksp_admin') {
      ksp_admin += item.penerimaan;
    } else if (kat === 'prod_pembelian') {
      prod_pembelian += item.pengeluaran;
    } else if (kat === 'prod_penjualan') {
      prod_penjualan += item.penerimaan;
      prod_pembelian += item.pengeluaran; // handle dual input in old items
    } else if (kat === 'beban_admin') {
      beban_admin += item.pengeluaran;
    } else if (kat === 'beban_gaji') {
      beban_gaji += item.pengeluaran;
    } else if (kat === 'modal_tarik_sukarela') {
      modal_tarik_sukarela += item.pengeluaran;
    } else if (kat === 'modal_keluar_anggota') {
      modal_keluar_anggota += item.pengeluaran;
    }
  });

  return {
    modalSimpanan: {
      pokok,
      wajib,
      sukarela,
      tarikSukarela: modal_tarik_sukarela,
      keluarAnggota: modal_keluar_anggota,
      total: totalModalSimpanan - (modal_tarik_sukarela + modal_keluar_anggota)
    },
    ksp: {
      pinjaman: ksp_pinjaman,
      angsuran: ksp_angsuran,
      bunga: ksp_bunga,
      admin: ksp_admin,
      penerimaan: ksp_angsuran + ksp_bunga + ksp_admin,
      pengeluaran: ksp_pinjaman,
      net: (ksp_angsuran + ksp_bunga + ksp_admin) - ksp_pinjaman
    },
    prod: {
      pembelian: prod_pembelian,
      penjualan: prod_penjualan,
      penerimaan: prod_penjualan,
      pengeluaran: prod_pembelian,
      net: prod_penjualan - prod_pembelian
    },
    beban: {
      admin: beban_admin,
      gaji: beban_gaji,
      penerimaan: 0,
      pengeluaran: beban_admin + beban_gaji,
      net: -(beban_admin + beban_gaji)
    }
  };
}
