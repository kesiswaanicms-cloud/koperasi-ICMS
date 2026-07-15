/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Printer, BookOpen, Layers, BarChart3 } from 'lucide-react';
import { KoperasiData } from '../types';
import { formatRupiah, getCycleSummary, calculateAllSHU } from '../utils/format';

interface FinancialReportsProps {
  data: KoperasiData;
}

export default function FinancialReports({ data }: FinancialReportsProps) {
  const [activeTab, setActiveTab] = useState<'laba-rugi' | 'neraca' | 'arus-kas'>('laba-rugi');

  const { simpanan, labaUsaha } = data;
  const cycleSummary = getCycleSummary(simpanan, labaUsaha);
  const { summary: shuSummary } = calculateAllSHU(data);

  // --- 1. Laba Rugi Calculations ---
  const pendapatanToko = cycleSummary.prod.penjualan;
  const hppToko = cycleSummary.prod.pembelian;
  const labaKotorToko = pendapatanToko - hppToko;

  const pendapatanBunga = cycleSummary.ksp.bunga;
  const pendapatanAdmin = cycleSummary.ksp.admin;
  const pendapatanKSP = pendapatanBunga + pendapatanAdmin;

  const totalPendapatanOperasional = labaKotorToko + pendapatanKSP;

  const bebanGaji = cycleSummary.beban.gaji;
  const bebanAdmin = cycleSummary.beban.admin;
  const totalBebanOperasional = bebanGaji + bebanAdmin;

  const labaBersih = totalPendapatanOperasional - totalBebanOperasional;

  // --- 2. Neraca Calculations ---
  // Aset: Kas & Bank
  const totalPenerimaanKas = 
    cycleSummary.modalSimpanan.pokok +
    cycleSummary.modalSimpanan.wajib +
    cycleSummary.modalSimpanan.sukarela +
    cycleSummary.ksp.angsuran +
    cycleSummary.ksp.bunga +
    cycleSummary.ksp.admin +
    cycleSummary.prod.penjualan;
  
  const totalPengeluaranKas = 
    cycleSummary.modalSimpanan.tarikSukarela +
    cycleSummary.modalSimpanan.keluarAnggota +
    cycleSummary.ksp.pinjaman +
    cycleSummary.prod.pembelian +
    cycleSummary.beban.gaji +
    cycleSummary.beban.admin;

  const kasDanBank = totalPenerimaanKas - totalPengeluaranKas;
  
  // Aset: Piutang Pinjaman Anggota
  const piutangPinjaman = cycleSummary.ksp.pinjaman - cycleSummary.ksp.angsuran;

  const totalAset = kasDanBank + piutangPinjaman;

  // Pasiva: Kewajiban
  const simpananSukarelaBersih = cycleSummary.modalSimpanan.sukarela - cycleSummary.modalSimpanan.tarikSukarela;
  // Kewajiban pembagian SHU (SHU Pool yang akan dibagikan)
  const shuPool = shuSummary.shuPool;
  
  const totalKewajiban = simpananSukarelaBersih + shuPool;

  // Pasiva: Ekuitas
  const simpananPokok = cycleSummary.modalSimpanan.pokok;
  const simpananWajib = cycleSummary.modalSimpanan.wajib;
  // Cadangan Koperasi = Laba Bersih yang tidak dibagikan = Laba Bersih - SHU Pool
  
  const cadanganKoperasi = labaBersih - shuPool - cycleSummary.modalSimpanan.keluarAnggota;
  const totalEkuitas = simpananPokok + simpananWajib + cadanganKoperasi;
  const totalPasiva = totalKewajiban + totalEkuitas;


  // --- 3. Arus Kas Calculations ---
  // Operasional
  const arusKasMasukOperasional = cycleSummary.prod.penjualan + cycleSummary.ksp.bunga + cycleSummary.ksp.admin;
  const arusKasKeluarOperasional = cycleSummary.prod.pembelian + cycleSummary.beban.gaji + cycleSummary.beban.admin;
  const netArusKasOperasional = arusKasMasukOperasional - arusKasKeluarOperasional;

  // Investasi (Simpan Pinjam)
  const arusKasKeluarInvestasi = cycleSummary.ksp.pinjaman;
  const arusKasMasukInvestasi = cycleSummary.ksp.angsuran;
  const netArusKasInvestasi = arusKasMasukInvestasi - arusKasKeluarInvestasi;

  // Pendanaan
  const arusKasMasukPendanaan = cycleSummary.modalSimpanan.pokok + cycleSummary.modalSimpanan.wajib + cycleSummary.modalSimpanan.sukarela;
  const arusKasKeluarPendanaan = cycleSummary.modalSimpanan.tarikSukarela + cycleSummary.modalSimpanan.keluarAnggota;
  const netArusKasPendanaan = arusKasMasukPendanaan - arusKasKeluarPendanaan;

  const kenaikanBersihKas = netArusKasOperasional + netArusKasInvestasi + netArusKasPendanaan;


  const handlePrint = () => {
    // Generate professional HTML report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Browser memblokir popup. Izinkan popup untuk mencetak laporan.");
      return;
    }

    let reportTitle = "";
    let reportContent = "";

    if (activeTab === 'laba-rugi') {
      reportTitle = "Laporan Laba Rugi";
      reportContent = `
        <table>
          <tr class="header"><td colspan="2">Pendapatan Operasional</td></tr>
          <tr><td>Pendapatan Toko / Konsumen</td><td class="amount">${formatRupiah(pendapatanToko)}</td></tr>
          <tr><td>Dikurangi: Harga Pokok Pembelian</td><td class="amount negative">(${formatRupiah(hppToko)})</td></tr>
          <tr class="subtotal"><td>Laba Kotor Toko</td><td class="amount">${formatRupiah(labaKotorToko)}</td></tr>
          <tr><td>Pendapatan Bunga Pinjaman KSP</td><td class="amount">${formatRupiah(pendapatanBunga)}</td></tr>
          <tr><td>Pendapatan Administrasi KSP</td><td class="amount">${formatRupiah(pendapatanAdmin)}</td></tr>
          <tr class="total"><td>Total Pendapatan Operasional</td><td class="amount">${formatRupiah(totalPendapatanOperasional)}</td></tr>
          
          <tr class="spacer"><td colspan="2"></td></tr>
          
          <tr class="header"><td colspan="2">Beban Operasional</td></tr>
          <tr><td>Beban Gaji & Honor</td><td class="amount">${formatRupiah(bebanGaji)}</td></tr>
          <tr><td>Beban Administrasi & Umum</td><td class="amount">${formatRupiah(bebanAdmin)}</td></tr>
          <tr class="total"><td>Total Beban Operasional</td><td class="amount negative">(${formatRupiah(totalBebanOperasional)})</td></tr>
          
          <tr class="spacer"><td colspan="2"></td></tr>
          
          <tr class="grand-total"><td>Laba Bersih Operasional (SHU Sebelum Pembagian)</td><td class="amount">${formatRupiah(labaBersih)}</td></tr>
        </table>
      `;
    } else if (activeTab === 'neraca') {
      reportTitle = "Laporan Posisi Keuangan (Neraca)";
      reportContent = `
        <div class="split-layout">
          <div>
            <table>
              <tr class="header"><td colspan="2" class="center">Aktiva (Aset)</td></tr>
              <tr><td>Kas & Bank</td><td class="amount">${formatRupiah(kasDanBank)}</td></tr>
              <tr><td>Piutang Pinjaman Anggota</td><td class="amount">${formatRupiah(piutangPinjaman)}</td></tr>
              <tr class="spacer"><td colspan="2"></td></tr>
              <tr class="grand-total"><td>Total Aktiva</td><td class="amount">${formatRupiah(totalAset)}</td></tr>
            </table>
          </div>
          <div>
            <table>
              <tr class="header"><td colspan="2" class="center">Pasiva (Kewajiban & Ekuitas)</td></tr>
              <tr class="subheader"><td colspan="2">Kewajiban</td></tr>
              <tr><td>Simpanan Sukarela Anggota</td><td class="amount">${formatRupiah(simpananSukarelaBersih)}</td></tr>
              <tr><td>Dana SHU Anggota & Pengurus (Belum Dibagi)</td><td class="amount">${formatRupiah(shuPool)}</td></tr>
              <tr class="subtotal"><td>Total Kewajiban</td><td class="amount">${formatRupiah(totalKewajiban)}</td></tr>
              
              <tr class="spacer"><td colspan="2"></td></tr>
              
              <tr class="subheader"><td colspan="2">Ekuitas Modal</td></tr>
              <tr><td>Simpanan Pokok</td><td class="amount">${formatRupiah(simpananPokok)}</td></tr>
              <tr><td>Simpanan Wajib</td><td class="amount">${formatRupiah(simpananWajib)}</td></tr>
              <tr><td>Cadangan Koperasi</td><td class="amount">${formatRupiah(cadanganKoperasi)}</td></tr>
              <tr class="subtotal"><td>Total Ekuitas</td><td class="amount">${formatRupiah(totalEkuitas)}</td></tr>
              
              <tr class="spacer"><td colspan="2"></td></tr>
              <tr class="grand-total"><td>Total Pasiva</td><td class="amount">${formatRupiah(totalPasiva)}</td></tr>
            </table>
          </div>
        </div>
      `;
    } else if (activeTab === 'arus-kas') {
      reportTitle = "Laporan Arus Kas (Metode Langsung)";
      reportContent = `
        <table>
          <tr class="header"><td colspan="2">Aktivitas Operasional</td></tr>
          <tr><td>Penerimaan Kas dari Pelanggan & Jasa</td><td class="amount">${formatRupiah(arusKasMasukOperasional)}</td></tr>
          <tr><td>Pengeluaran Kas untuk Pemasok & Karyawan</td><td class="amount negative">(${formatRupiah(arusKasKeluarOperasional)})</td></tr>
          <tr class="total"><td>Arus Kas Bersih dari Aktivitas Operasional</td><td class="amount">${formatRupiah(netArusKasOperasional)}</td></tr>
          
          <tr class="spacer"><td colspan="2"></td></tr>
          
          <tr class="header"><td colspan="2">Aktivitas Investasi (Simpan Pinjam)</td></tr>
          <tr><td>Penerimaan Kas dari Angsuran Pinjaman</td><td class="amount">${formatRupiah(arusKasMasukInvestasi)}</td></tr>
          <tr><td>Pengeluaran Kas untuk Pemberian Pinjaman</td><td class="amount negative">(${formatRupiah(arusKasKeluarInvestasi)})</td></tr>
          <tr class="total"><td>Arus Kas Bersih dari Aktivitas Investasi</td><td class="amount">${formatRupiah(netArusKasInvestasi)}</td></tr>
          
          <tr class="spacer"><td colspan="2"></td></tr>
          
          <tr class="header"><td colspan="2">Aktivitas Pendanaan (Modal)</td></tr>
          <tr><td>Penerimaan Setoran Modal (Pokok, Wajib, Sukarela)</td><td class="amount">${formatRupiah(arusKasMasukPendanaan)}</td></tr>
          <tr><td>Pengeluaran Penarikan Modal / Pengembalian</td><td class="amount negative">(${formatRupiah(arusKasKeluarPendanaan)})</td></tr>
          <tr class="total"><td>Arus Kas Bersih dari Aktivitas Pendanaan</td><td class="amount">${formatRupiah(netArusKasPendanaan)}</td></tr>
          
          <tr class="spacer"><td colspan="2"></td></tr>
          
          <tr class="grand-total">
            <td>Kenaikan (Penurunan) Bersih Kas & Bank</td>
            <td class="amount">${formatRupiah(kenaikanBersihKas)}</td>
          </tr>
        </table>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak - ${reportTitle}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body {
            font-family: 'Arial', sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
          }
          .report-header {
            text-align: center;
            border-bottom: 2px solid #2e7d32;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .report-header h1 {
            margin: 0;
            color: #2e7d32;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .report-header h2 {
            margin: 5px 0 0 0;
            font-size: 18px;
            color: #555;
          }
          .report-header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #777;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          td {
            padding: 8px 0;
            border-bottom: 1px dashed #ccc;
          }
          .header td {
            font-weight: bold;
            color: #2e7d32;
            text-transform: uppercase;
            border-bottom: 2px solid #2e7d32;
            padding-top: 15px;
          }
          .subheader td {
            font-weight: bold;
            color: #555;
            padding-top: 10px;
            border-bottom: 1px solid #aaa;
          }
          .subtotal td {
            font-weight: bold;
            background-color: #f9f9f9;
            border-bottom: 1px solid #aaa;
          }
          .total td {
            font-weight: bold;
            border-top: 1px solid #aaa;
            border-bottom: 2px solid #aaa;
          }
          .grand-total td {
            font-weight: bold;
            font-size: 16px;
            color: #2e7d32;
            background-color: #e8f5e9;
            padding: 12px 10px;
            border: 1px solid #2e7d32;
          }
          .amount {
            text-align: right;
            font-family: monospace;
            font-size: 15px;
          }
          .negative {
            color: #d32f2f;
          }
          .spacer td {
            border: none;
            height: 10px;
          }
          .center {
            text-align: center;
          }
          .split-layout {
            display: flex;
            gap: 40px;
          }
          .split-layout > div {
            flex: 1;
          }
          .footer-note {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          
          tr:not(.header):not(.subheader):not(.subtotal):not(.total):not(.grand-total):not(.spacer) td:first-child {
            padding-left: 15px;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Koperasi ICMS</h1>
          <h2>${reportTitle}</h2>
          <p>Periode Berjalan (Real-time) - Dicetak pada ${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        ${reportContent}
        
        <div class="footer-note">
          Dokumen ini di-generate secara otomatis oleh Sistem Koperasi ICMS.<br/>
          &copy; ${new Date().getFullYear()} Koperasi ICMS.
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-beige-border print:hidden">
        <div>
          <h2 className="text-xl font-display font-semibold text-green-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-gold-accent" />
            Laporan Keuangan
          </h2>
          <p className="text-sm text-slate-500 mt-1">Pilih jenis laporan untuk melihat rincian posisi keuangan koperasi secara real-time.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-green-primary text-white text-sm font-semibold rounded-lg hover:bg-green-primary/90 transition-colors shadow-sm"
        >
          <Printer className="h-4 w-4" />
          Cetak Laporan
        </button>
      </div>

      <div className="flex bg-cream-card p-1 rounded-lg border border-beige-border shadow-sm print:hidden">
        <button
          onClick={() => setActiveTab('laba-rugi')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all flex justify-center items-center gap-2 ${activeTab === 'laba-rugi' ? 'bg-white text-green-primary shadow-sm' : 'text-slate-500 hover:text-green-primary'}`}
        >
          <BarChart3 className="h-4 w-4" /> Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab('neraca')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all flex justify-center items-center gap-2 ${activeTab === 'neraca' ? 'bg-white text-green-primary shadow-sm' : 'text-slate-500 hover:text-green-primary'}`}
        >
          <Layers className="h-4 w-4" /> Neraca
        </button>
        <button
          onClick={() => setActiveTab('arus-kas')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all flex justify-center items-center gap-2 ${activeTab === 'arus-kas' ? 'bg-white text-green-primary shadow-sm' : 'text-slate-500 hover:text-green-primary'}`}
        >
          <FileText className="h-4 w-4" /> Arus Kas
        </button>
      </div>

      {/* Laporan Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[600px] print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Laba Rugi */}
        {activeTab === 'laba-rugi' && (
          <div className="space-y-6">
            <div className="text-center mb-8 border-b-2 border-green-primary pb-4">
              <h3 className="text-xl font-bold uppercase tracking-wider text-green-primary">Koperasi ICMS</h3>
              <h4 className="text-lg font-semibold text-slate-800">Laporan Laba Rugi</h4>
              <p className="text-sm text-slate-500">Periode Berjalan (Real-time)</p>
            </div>

            <div className="space-y-4 text-sm font-mono text-slate-700">
              {/* Pendapatan */}
              <div>
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans print:bg-white print:border-b print:border-black">Pendapatan Operasional</div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Pendapatan Toko / Konsumen</span>
                  <span>{formatRupiah(pendapatanToko)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-8 print:border-black">
                  <span className="text-slate-500">Dikurangi: Harga Pokok Pembelian</span>
                  <span className="text-red-500">({formatRupiah(hppToko)})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 pl-4 font-semibold text-slate-800 bg-slate-50 print:bg-white print:border-black">
                  <span>Laba Kotor Toko</span>
                  <span>{formatRupiah(labaKotorToko)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 mt-2 print:border-black">
                  <span>Pendapatan Bunga Pinjaman KSP</span>
                  <span>{formatRupiah(pendapatanBunga)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Pendapatan Administrasi KSP</span>
                  <span>{formatRupiah(pendapatanAdmin)}</span>
                </div>
                <div className="flex justify-between py-3 border-b-2 border-slate-300 font-bold text-slate-800 mt-2 print:border-black">
                  <span>Total Pendapatan Operasional</span>
                  <span>{formatRupiah(totalPendapatanOperasional)}</span>
                </div>
              </div>

              {/* Beban */}
              <div className="pt-4">
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans print:bg-white print:border-b print:border-black">Beban Operasional</div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Beban Gaji & Honor</span>
                  <span>{formatRupiah(bebanGaji)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Beban Administrasi & Umum</span>
                  <span>{formatRupiah(bebanAdmin)}</span>
                </div>
                <div className="flex justify-between py-3 border-b-2 border-slate-300 font-bold text-slate-800 mt-2 print:border-black">
                  <span>Total Beban Operasional</span>
                  <span className="text-red-600">({formatRupiah(totalBebanOperasional)})</span>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="pt-4">
                <div className="flex justify-between py-4 border-b-[3px] border-green-primary font-bold text-lg text-green-primary bg-green-primary/5 px-4 rounded print:bg-white print:border-black print:text-black">
                  <span>Laba Bersih Operasional (SHU Sebelum Pembagian)</span>
                  <span>{formatRupiah(labaBersih)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Neraca */}
        {activeTab === 'neraca' && (
          <div className="space-y-6">
            <div className="text-center mb-8 border-b-2 border-green-primary pb-4 print:border-black">
              <h3 className="text-xl font-bold uppercase tracking-wider text-green-primary print:text-black">Koperasi ICMS</h3>
              <h4 className="text-lg font-semibold text-slate-800">Laporan Posisi Keuangan (Neraca)</h4>
              <p className="text-sm text-slate-500">Per Hari Ini</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-mono text-slate-700">
              
              {/* Aktiva (Aset) */}
              <div>
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans mb-2 border-b-2 border-green-primary text-center print:bg-white print:text-black print:border-black">Aktiva (Aset)</div>
                <div className="space-y-1">
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Kas & Bank</span>
                    <span>{formatRupiah(kasDanBank)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Piutang Pinjaman Anggota</span>
                    <span>{formatRupiah(piutangPinjaman)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-b-4 border-slate-800 font-bold text-slate-900 mt-6 bg-slate-100 px-2 print:bg-white print:border-black">
                  <span>Total Aktiva</span>
                  <span>{formatRupiah(totalAset)}</span>
                </div>
              </div>

              {/* Pasiva (Kewajiban + Ekuitas) */}
              <div>
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans mb-2 border-b-2 border-green-primary text-center print:bg-white print:text-black print:border-black">Pasiva (Kewajiban & Ekuitas)</div>
                
                {/* Kewajiban */}
                <div className="font-semibold text-slate-800 py-2 border-b border-slate-300 print:border-black">Kewajiban</div>
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Simpanan Sukarela Anggota</span>
                    <span>{formatRupiah(simpananSukarelaBersih)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Dana SHU Anggota & Pengurus (Belum Dibagi)</span>
                    <span>{formatRupiah(shuPool)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-300 pl-2 font-semibold bg-slate-50 print:bg-white print:border-black">
                    <span>Total Kewajiban</span>
                    <span>{formatRupiah(totalKewajiban)}</span>
                  </div>
                </div>

                {/* Ekuitas */}
                <div className="font-semibold text-slate-800 py-2 border-b border-slate-300 print:border-black">Ekuitas Modal</div>
                <div className="space-y-1">
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Simpanan Pokok</span>
                    <span>{formatRupiah(simpananPokok)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Simpanan Wajib</span>
                    <span>{formatRupiah(simpananWajib)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-2 print:border-black">
                    <span>Cadangan Koperasi (Laba Ditahan)</span>
                    <span>{formatRupiah(cadanganKoperasi)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-300 pl-2 font-semibold bg-slate-50 print:bg-white print:border-black">
                    <span>Total Ekuitas</span>
                    <span>{formatRupiah(totalEkuitas)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-3 border-t-2 border-b-4 border-slate-800 font-bold text-slate-900 mt-6 bg-slate-100 px-2 print:bg-white print:border-black">
                  <span>Total Pasiva</span>
                  <span>{formatRupiah(totalPasiva)}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Arus Kas */}
        {activeTab === 'arus-kas' && (
          <div className="space-y-6">
            <div className="text-center mb-8 border-b-2 border-green-primary pb-4 print:border-black">
              <h3 className="text-xl font-bold uppercase tracking-wider text-green-primary print:text-black">Koperasi ICMS</h3>
              <h4 className="text-lg font-semibold text-slate-800">Laporan Arus Kas (Metode Langsung)</h4>
              <p className="text-sm text-slate-500">Periode Berjalan (Real-time)</p>
            </div>

            <div className="space-y-4 text-sm font-mono text-slate-700 max-w-3xl mx-auto">
              {/* Aktivitas Operasional */}
              <div>
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans print:bg-white print:border-b print:border-black">Aktivitas Operasional</div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Penerimaan Kas dari Pelanggan & Jasa</span>
                  <span>{formatRupiah(arusKasMasukOperasional)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Pengeluaran Kas untuk Pemasok & Karyawan</span>
                  <span className="text-red-600 print:text-black">({formatRupiah(arusKasKeluarOperasional)})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 pl-4 font-bold text-slate-800 bg-slate-50 print:bg-white print:border-black">
                  <span>Arus Kas Bersih dari Aktivitas Operasional</span>
                  <span className={netArusKasOperasional < 0 ? 'text-red-600 print:text-black' : 'text-green-600 print:text-black'}>
                    {netArusKasOperasional < 0 ? `(${formatRupiah(Math.abs(netArusKasOperasional))})` : formatRupiah(netArusKasOperasional)}
                  </span>
                </div>
              </div>

              {/* Aktivitas Investasi / Simpan Pinjam */}
              <div className="pt-2">
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans print:bg-white print:border-b print:border-black">Aktivitas Investasi (Simpan Pinjam)</div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Penerimaan Kas dari Angsuran Pinjaman</span>
                  <span>{formatRupiah(arusKasMasukInvestasi)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Pengeluaran Kas untuk Pemberian Pinjaman</span>
                  <span className="text-red-600 print:text-black">({formatRupiah(arusKasKeluarInvestasi)})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 pl-4 font-bold text-slate-800 bg-slate-50 print:bg-white print:border-black">
                  <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                  <span className={netArusKasInvestasi < 0 ? 'text-red-600 print:text-black' : 'text-green-600 print:text-black'}>
                    {netArusKasInvestasi < 0 ? `(${formatRupiah(Math.abs(netArusKasInvestasi))})` : formatRupiah(netArusKasInvestasi)}
                  </span>
                </div>
              </div>

              {/* Aktivitas Pendanaan */}
              <div className="pt-2">
                <div className="font-bold text-green-primary bg-emerald-50 p-2 rounded uppercase font-sans print:bg-white print:border-b print:border-black">Aktivitas Pendanaan (Modal)</div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Penerimaan Setoran Modal (Pokok, Wajib, Sukarela)</span>
                  <span>{formatRupiah(arusKasMasukPendanaan)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-slate-200 pl-4 print:border-black">
                  <span>Pengeluaran Penarikan Modal / Pengembalian</span>
                  <span className="text-red-600 print:text-black">({formatRupiah(arusKasKeluarPendanaan)})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 pl-4 font-bold text-slate-800 bg-slate-50 print:bg-white print:border-black">
                  <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                  <span className={netArusKasPendanaan < 0 ? 'text-red-600 print:text-black' : 'text-green-600 print:text-black'}>
                    {netArusKasPendanaan < 0 ? `(${formatRupiah(Math.abs(netArusKasPendanaan))})` : formatRupiah(netArusKasPendanaan)}
                  </span>
                </div>
              </div>

              {/* Kenaikan Bersih Kas */}
              <div className="pt-4">
                <div className="flex justify-between py-4 border-b-[3px] border-slate-800 font-bold text-lg text-slate-900 bg-slate-100 px-4 rounded print:bg-white print:border-black">
                  <span>Kenaikan (Penurunan) Bersih Kas & Bank</span>
                  <span className={kenaikanBersihKas < 0 ? 'text-red-600 print:text-black' : 'text-green-600 print:text-black'}>
                    {kenaikanBersihKas < 0 ? `(${formatRupiah(Math.abs(kenaikanBersihKas))})` : formatRupiah(kenaikanBersihKas)}
                  </span>
                </div>
                <div className="text-xs text-center mt-2 text-slate-500 font-sans italic print:text-black">
                  *Saldo kas ini cocok dengan nominal Kas & Bank pada Laporan Neraca.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
