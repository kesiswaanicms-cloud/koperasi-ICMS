/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  PiggyBank, 
  Award, 
  ChevronRight, 
  BadgeDollarSign, 
  BookOpen, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { KoperasiData } from '../types';
import { formatRupiah, getBusinessProfitSummary, calculateAllSHU, getCycleSummary } from '../utils/format';

interface DashboardProps {
  data: KoperasiData;
  currentUserRole: 'admin' | 'anggota' | 'guest';
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ data, currentUserRole, onNavigate }: DashboardProps) {
  const { anggota, simpanan, labaUsaha } = data;

  // Calculators
  const totalSavings = simpanan.reduce((sum, s) => sum + s.jumlah, 0);
  
  // Savings composition breakdown
  const pokokSavings = simpanan.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.jumlah, 0);
  const wajibSavings = simpanan.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.jumlah, 0);
  const sukarelaSavings = simpanan.filter(s => s.jenis === 'sukarela').reduce((sum, s) => sum + s.jumlah, 0);

  const profitSummary = getBusinessProfitSummary(labaUsaha);
  const totalLaba = profitSummary.laba;

  const { summary: shuSummary } = calculateAllSHU(data);
  const cycleSummary = getCycleSummary(simpanan, labaUsaha);

  // Ranked savings per member
  const memberRankings = anggota.map(m => {
    const totalMemberSavings = simpanan.filter(s => s.memberId === m.id).reduce((sum, s) => sum + s.jumlah, 0);
    return {
      ...m,
      totalSavings: totalMemberSavings
    };
  }).sort((a, b) => b.totalSavings - a.totalSavings);

  // SVG Donut Calculations
  const totalBreakdown = pokokSavings + wajibSavings + sukarelaSavings;
  const pctPokok = totalBreakdown > 0 ? (pokokSavings / totalBreakdown) * 100 : 0;
  const pctWajib = totalBreakdown > 0 ? (wajibSavings / totalBreakdown) * 100 : 0;
  const pctSukarela = totalBreakdown > 0 ? (sukarelaSavings / totalBreakdown) * 100 : 0;

  // Pie chart parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  const strokePokok = (pctPokok / 100) * circumference;
  const strokeWajib = (pctWajib / 100) * circumference;
  const strokeSukarela = (pctSukarela / 100) * circumference;

  const offsetPokok = 0;
  const offsetWajib = strokePokok;
  const offsetSukarela = strokePokok + strokeWajib;

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Banner Transparansi / Pengumuman Koperasi */}
      <div className="bg-cream-card border-l-4 border-gold-accent p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-beige-border/50">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-gold-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-primary text-sm font-brand uppercase tracking-wider">Informasi Transparansi Buku Kas</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selamat datang di portal transparansi keuangan Koperasi ICMS. Semua laporan simpanan, unit laba usaha sekolah, dan pembagian Sisa Hasil Usaha (SHU) disajikan secara transparan dan di-update secara real-time.
            </p>
          </div>
        </div>
        {currentUserRole === 'guest' && (
          <span className="text-[10px] bg-green-primary text-white px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap self-end sm:self-auto font-brand">
            👁️ Mode Transparansi Aktif
          </span>
        )}
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Simpanan */}
        <div 
          onClick={() => onNavigate('simpanan')}
          className="bg-cream-card border-2 border-beige-border hover:border-green-primary transition-all p-5 rounded-xl shadow-xs cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-primary/10 rounded-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform flex items-center justify-center border-l border-b border-beige-border/50">
            <PiggyBank className="h-5 w-5 text-green-primary -translate-x-1 translate-y-1" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-accent font-sans">Total Simpanan</span>
            <h3 className="text-2xl font-mono font-bold text-green-primary mt-1.5 break-all">
              {formatRupiah(totalSavings)}
            </h3>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-beige-border/50 pt-2.5 mt-4">
            <span className="text-[11px] text-slate-500">Pokok, Wajib & Sukarela</span>
            <span className="text-[11px] font-bold text-green-primary flex items-center group-hover:translate-x-1 transition-transform">
              Buka Ledger <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 2: Total Laba Usaha */}
        <div 
          onClick={() => onNavigate('laba')}
          className="bg-cream-card border-2 border-beige-border hover:border-green-primary transition-all p-5 rounded-xl shadow-xs cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-primary/10 rounded-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform flex items-center justify-center border-l border-b border-beige-border/50">
            <TrendingUp className="h-5 w-5 text-gold-accent -translate-x-1 translate-y-1" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-accent font-sans">Total Laba Usaha</span>
            <h3 className="text-2xl font-mono font-bold text-green-primary mt-1.5 break-all">
              {formatRupiah(totalLaba)}
            </h3>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-beige-border/50 pt-2.5 mt-4">
            <span className="text-[11px] text-slate-500">Net dari unit sekolah</span>
            <span className="text-[11px] font-bold text-gold-accent flex items-center group-hover:translate-x-1 transition-transform">
              Rincian Laba <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 3: Estimasi Pool SHU */}
        <div 
          onClick={() => onNavigate('shu')}
          className="bg-cream-card border-2 border-beige-border hover:border-green-primary transition-all p-5 rounded-xl shadow-xs cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-primary/10 rounded-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform flex items-center justify-center border-l border-b border-beige-border/50">
            <BadgeDollarSign className="h-5 w-5 text-amber-600 -translate-x-1 translate-y-1" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold-accent font-sans">Pool Dana SHU</span>
              <span className="text-[9px] bg-green-primary text-white px-1.5 py-0.2 rounded font-bold font-mono">
                {data.pengaturanSHU.persenLabaPool}% Laba
              </span>
            </div>
            <h3 className="text-2xl font-mono font-bold text-green-primary mt-1.5 break-all">
              {formatRupiah(shuSummary.shuPool)}
            </h3>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-beige-border/50 pt-2.5 mt-4">
            <span className="text-[11px] text-slate-500">Siap didistribusikan</span>
            <span className="text-[11px] font-bold text-green-primary flex items-center group-hover:translate-x-1 transition-transform">
              Hitung SHU <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 4: Jumlah Anggota */}
        <div 
          onClick={() => onNavigate('anggota')}
          className="bg-cream-card border-2 border-beige-border hover:border-green-primary transition-all p-5 rounded-xl shadow-xs cursor-pointer group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-primary/10 rounded-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform flex items-center justify-center border-l border-b border-beige-border/50">
            <Users className="h-5 w-5 text-slate-600 -translate-x-1 translate-y-1" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-accent font-sans">Jumlah Anggota</span>
            <h3 className="text-2xl font-mono font-bold text-green-primary mt-1.5">
              {anggota.length} <span className="text-xs font-sans font-normal text-slate-500">Orang</span>
            </h3>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-beige-border/50 pt-2.5 mt-4">
            <span className="text-[11px] text-slate-500">
              {anggota.filter(m => m.jabatan === 'Pengurus').length} Pengurus | {anggota.filter(m => m.jabatan === 'Anggota').length} Anggota
            </span>
            <span className="text-[11px] font-bold text-green-primary flex items-center group-hover:translate-x-1 transition-transform">
              Kelola <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 4 Siklus Aktivitas Keuangan Koperasi */}
      <div id="siklus-keuangan-panel" className="bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs">
        <div className="border-b border-beige-border pb-3 mb-4">
          <h3 className="text-lg font-semibold font-display text-green-primary flex items-center gap-2 uppercase tracking-wider">
            <BookOpen className="h-5 w-5 text-gold-accent" />
            4 Siklus Aktivitas Keuangan Koperasi ICMS
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Klasifikasi akuntansi koperasi berdasarkan aktivitas modal, operasional simpan pinjam (KSP), operasional konsumen/produsen, serta beban operasional umum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Siklus 1: Transaksi Modal dan Simpanan */}
          <div className="bg-white border border-beige-border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-beige-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Siklus I</span>
                <span className="bg-green-primary/10 text-green-primary text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Simpanan</span>
              </div>
              <h4 className="text-xs font-bold text-green-primary font-brand uppercase tracking-wider mb-2">Modal & Simpanan</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span>Simpanan Pokok:</span>
                  <span className="font-mono font-medium">{formatRupiah(cycleSummary.modalSimpanan.pokok)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Simpanan Wajib:</span>
                  <span className="font-mono font-medium">{formatRupiah(cycleSummary.modalSimpanan.wajib)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Simpanan Sukarela:</span>
                  <span className="font-mono font-medium">{formatRupiah(cycleSummary.modalSimpanan.sukarela)}</span>
                </li>
                {cycleSummary.modalSimpanan.tarikSukarela > 0 && (
                  <li className="flex justify-between text-red-600">
                    <span>Penarikan Sukarela:</span>
                    <span className="font-mono font-medium">-{formatRupiah(cycleSummary.modalSimpanan.tarikSukarela)}</span>
                  </li>
                )}
                {cycleSummary.modalSimpanan.keluarAnggota > 0 && (
                  <li className="flex justify-between text-red-600">
                    <span>Pengembalian Keluar:</span>
                    <span className="font-mono font-medium">-{formatRupiah(cycleSummary.modalSimpanan.keluarAnggota)}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="border-t border-beige-border pt-2 mt-3 flex justify-between items-center bg-cream-bg/35 -mx-4 -mb-4 p-3 rounded-b-lg">
              <span className="text-[10px] text-slate-500 font-sans font-medium">Kas Simpanan Bersih:</span>
              <span className="font-mono font-bold text-green-primary text-xs">{formatRupiah(cycleSummary.modalSimpanan.total)}</span>
            </div>
          </div>

          {/* Siklus 2: Operasional Simpan Pinjam */}
          <div className="bg-white border border-beige-border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-beige-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Siklus II</span>
                <span className="bg-amber-600/10 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">KSP (Kredit)</span>
              </div>
              <h4 className="text-xs font-bold text-green-primary font-brand uppercase tracking-wider mb-2">Unit Simpan Pinjam</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span>Pemberian Pinjaman:</span>
                  <span className="font-mono text-amber-700 font-medium">-{formatRupiah(cycleSummary.ksp.pinjaman)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Angsuran Pokok:</span>
                  <span className="font-mono text-green-primary font-medium">+{formatRupiah(cycleSummary.ksp.angsuran)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Penerimaan Bunga:</span>
                  <span className="font-mono text-green-primary font-medium">+{formatRupiah(cycleSummary.ksp.bunga)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Biaya Administrasi:</span>
                  <span className="font-mono text-green-primary font-medium">+{formatRupiah(cycleSummary.ksp.admin)}</span>
                </li>
              </ul>
            </div>
            <div className="border-t border-beige-border pt-2 mt-3 flex justify-between items-center bg-cream-bg/35 -mx-4 -mb-4 p-3 rounded-b-lg">
              <span className="text-[10px] text-slate-500 font-sans font-medium">Arus Kas Bersih KSP:</span>
              <span className={`font-mono font-bold text-xs ${cycleSummary.ksp.net >= 0 ? 'text-green-primary' : 'text-amber-700'}`}>
                {cycleSummary.ksp.net >= 0 ? '+' : ''}{formatRupiah(cycleSummary.ksp.net)}
              </span>
            </div>
          </div>

          {/* Siklus 3: Operasional Konsumen / Produsen */}
          <div className="bg-white border border-beige-border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-beige-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Siklus III</span>
                <span className="bg-yellow-50 text-gold-accent text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-beige-border/30">Sektor Riil</span>
              </div>
              <h4 className="text-xs font-bold text-green-primary font-brand uppercase tracking-wider mb-2">Konsumen & Produsen</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span>Penjualan Barang:</span>
                  <span className="font-mono text-green-primary font-medium">+{formatRupiah(cycleSummary.prod.penjualan)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Pembelian/Stok:</span>
                  <span className="font-mono text-amber-700 font-medium">-{formatRupiah(cycleSummary.prod.pembelian)}</span>
                </li>
              </ul>
            </div>
            <div className="border-t border-beige-border pt-2 mt-3 flex justify-between items-center bg-cream-bg/35 -mx-4 -mb-4 p-3 rounded-b-lg">
              <span className="text-[10px] text-slate-500 font-sans font-medium">Margin Laba Kotor:</span>
              <span className={`font-mono font-bold text-xs ${cycleSummary.prod.net >= 0 ? 'text-green-primary' : 'text-amber-700'}`}>
                {cycleSummary.prod.net >= 0 ? '+' : ''}{formatRupiah(cycleSummary.prod.net)}
              </span>
            </div>
          </div>

          {/* Siklus 4: Beban dan Pengeluaran Umum */}
          <div className="bg-white border border-beige-border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-beige-border">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Siklus IV</span>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Beban</span>
              </div>
              <h4 className="text-xs font-bold text-green-primary font-brand uppercase tracking-wider mb-2">Beban Operasional</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex justify-between">
                  <span>Beban Umum/ATK:</span>
                  <span className="font-mono text-amber-700 font-medium">-{formatRupiah(cycleSummary.beban.admin)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Beban Gaji/Honor:</span>
                  <span className="font-mono text-amber-700 font-medium">-{formatRupiah(cycleSummary.beban.gaji)}</span>
                </li>
              </ul>
            </div>
            <div className="border-t border-beige-border pt-2 mt-3 flex justify-between items-center bg-cream-bg/35 -mx-4 -mb-4 p-3 rounded-b-lg">
              <span className="text-[10px] text-slate-500 font-sans font-medium">Total Beban Usaha:</span>
              <span className="font-mono font-bold text-amber-700 text-xs">-{formatRupiah(cycleSummary.beban.pengeluaran)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts & Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Composition Ledger & SVG Chart */}
        <div className="lg:col-span-5 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3">
              <FileSpreadsheet className="h-5 w-5 text-green-primary" />
              Komposisi Kas Simpanan
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Proporsi akumulasi dana simpanan koperasi dari seluruh anggota aktif yang terdaftar saat ini.
            </p>
          </div>

          {/* SVG Pie Chart */}
          <div className="my-6 flex items-center justify-center gap-6 flex-col sm:flex-row">
            {totalBreakdown > 0 ? (
              <svg className="w-36 h-36 transform -rotate-90 shrink-0" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1ebd9" strokeWidth="14" />
                
                {/* Pokok (Gold) */}
                {strokePokok > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#B8860B"
                    strokeWidth="14"
                    strokeDasharray={`${strokePokok} ${circumference}`}
                    strokeDashoffset={-offsetPokok}
                  />
                )}
                
                {/* Wajib (Green) */}
                {strokeWajib > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#1B4332"
                    strokeWidth="14"
                    strokeDasharray={`${strokeWajib} ${circumference}`}
                    strokeDashoffset={-offsetWajib}
                  />
                )}
                
                {/* Sukarela (Yellow Accent) */}
                {strokeSukarela > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#E9C46A"
                    strokeWidth="14"
                    strokeDasharray={`${strokeSukarela} ${circumference}`}
                    strokeDashoffset={-offsetSukarela}
                  />
                )}
                
                {/* Center text */}
                <circle cx="60" cy="60" r="38" fill="#F5F2EA" />
              </svg>
            ) : (
              <div className="w-36 h-36 rounded-full bg-[#EAE7DF] flex items-center justify-center text-center p-3 text-xs text-slate-400">
                Belum ada transaksi simpanan
              </div>
            )}

            {/* Legend as an Accounting Ledger Table */}
            <div className="space-y-2.5 w-full">
              <div className="flex items-center justify-between text-xs border-b border-dashed border-beige-border pb-1">
                <span className="flex items-center gap-1.5 font-brand font-medium text-green-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-accent" />
                  Pokok
                </span>
                <span className="font-mono text-slate-700">{pctPokok.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-dashed border-beige-border pb-1">
                <span className="flex items-center gap-1.5 font-brand font-medium text-green-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-primary" />
                  Wajib
                </span>
                <span className="font-mono text-slate-700">{pctWajib.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-dashed border-beige-border pb-1">
                <span className="flex items-center gap-1.5 font-brand font-medium text-green-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-accent" />
                  Sukarela
                </span>
                <span className="font-mono text-slate-700">{pctSukarela.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-cream-bg border border-beige-border p-3 rounded-lg font-mono text-xs text-slate-700 space-y-1.5">
            <div className="flex justify-between">
              <span className="font-sans text-slate-500 italic">Simpanan Pokok</span>
              <span className="font-semibold text-gold-accent">{formatRupiah(pokokSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500 italic">Simpanan Wajib</span>
              <span className="font-semibold text-green-primary">{formatRupiah(wajibSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-slate-500 italic">Simpanan Sukarela</span>
              <span className="font-semibold text-amber-700">{formatRupiah(sukarelaSavings)}</span>
            </div>
            <div className="flex justify-between border-t border-gold-accent pt-1.5 font-bold">
              <span className="font-sans text-green-primary">Total Kas:</span>
              <span className="text-green-primary">{formatRupiah(totalBreakdown)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Ledger Rank of Savings per Member */}
        <div className="lg:col-span-7 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3">
              <Award className="h-5 w-5 text-gold-accent" />
              Peringkat Simpanan Anggota (Buku Besar)
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Tabel buku kas pembantu yang memuat rincian akumulasi simpanan setiap anggota, diurutkan dari saldo tertinggi.
            </p>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto my-4 border border-beige-border rounded-lg">
            <table className="min-w-full divide-y border-collapse divide-beige-border">
              <thead className="bg-cream-bg text-gold-accent text-xs font-sans uppercase">
                <tr>
                  <th scope="col" className="px-3 py-3 text-center font-bold w-12 border-b border-r border-beige-border">No</th>
                  <th scope="col" className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Nama Anggota</th>
                  <th scope="col" className="px-3 py-3 text-center font-bold w-24 border-b border-r border-beige-border">Jabatan</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold border-b border-beige-border">Total Simpanan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-beige-border font-sans text-xs">
                {memberRankings.map((member, index) => {
                  const isTop3 = index < 3 && member.totalSavings > 0;
                  return (
                    <tr key={member.id} className="hover:bg-cream-bg transition-all border-b border-beige-border">
                      <td className="px-3 py-3 text-center font-mono text-slate-500 border-r border-beige-border">
                        {isTop3 ? (
                          <span className={`inline-block w-5 h-5 rounded-full text-center leading-5 text-[10px] font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            index === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="px-4 py-3 font-serif italic text-slate-800 border-r border-beige-border">
                        {member.nama}
                      </td>
                      <td className="px-3 py-3 text-center border-r border-beige-border">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase font-brand ${
                          member.jabatan === 'Pengurus' 
                            ? 'bg-green-primary/10 text-green-primary border border-green-primary/20' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.jabatan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-primary">
                        {formatRupiah(member.totalSavings)}
                      </td>
                    </tr>
                  );
                })}
                {memberRankings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Belum ada data anggota terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onNavigate('anggota')}
              className="text-xs text-green-primary hover:text-gold-accent font-semibold flex items-center gap-1 font-brand transition-all animate-pulse"
            >
              Lihat Detail Anggota <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dynamic calculation rules box */}
      <div className="bg-cream-card border-2 border-beige-border p-5 rounded-xl shadow-sm">
        <h4 className="text-sm font-semibold text-green-primary font-display flex items-center gap-1.5 mb-2 uppercase tracking-wider">
          <AlertCircle className="h-4 w-4 text-green-primary" />
          Rumus Buku Kas & Transparansi SHU Koperasi ICMS
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-white p-3 rounded border border-beige-border/50 shadow-3xs">
            <span className="font-bold text-green-primary block mb-1">1. Laba Operasional Bersih</span>
            Semua penerimaan usaha dikurangi biaya operasional/pengeluaran kegiatan. Laba = Penerimaan - Pengeluaran.
          </div>
          <div className="bg-white p-3 rounded border border-beige-border/50 shadow-3xs">
            <span className="font-bold text-gold-accent block mb-1">2. Porsi Jasa Modal (Simpanan)</span>
            Bagian SHU modal dibagi berdasarkan proporsi kontribusi total tabungan per anggota terhadap total tabungan semua anggota.
          </div>
          <div className="bg-white p-3 rounded border border-beige-border/50 shadow-3xs">
            <span className="font-bold text-amber-700 block mb-1">3. Porsi Jasa Pengurus</span>
            Bagian SHU pengurus dibagi proporsional berdasarkan bobot pengurus (0-100) terhadap total bobot pengurus koperasi yang terdaftar.
          </div>
        </div>
      </div>
    </div>
  );
}
