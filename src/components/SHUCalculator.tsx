/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calculator, 
  Settings, 
  UserCheck, 
  Coins, 
  HelpCircle, 
  AlertCircle,
  Award,
  Download,
  Receipt,
  Landmark
} from 'lucide-react';
import { KoperasiData, PengaturanSHU } from '../types';
import { calculateAllSHU, formatRupiah } from '../utils/format';

interface SHUCalculatorProps {
  data: KoperasiData;
  setPengaturanSHU: React.Dispatch<React.SetStateAction<PengaturanSHU>>;
  currentUserRole: 'admin' | 'anggota' | 'guest';
  selectedMemberId?: string;
}

export default function SHUCalculator({
  data,
  setPengaturanSHU,
  currentUserRole,
  selectedMemberId
}: SHUCalculatorProps) {
  const isAdmin = currentUserRole === 'admin';
  const isMember = currentUserRole === 'anggota';

  // Compute live SHU calculations based on current parameters and data
  const { results, summary } = calculateAllSHU(data);

  // Auto adjusting sliders: if modal changes, pengurus is 100 - modal
  const handlePercentModalChange = (val: number) => {
    setPengaturanSHU(prev => ({
      ...prev,
      persenPoolSimpanan: val,
      persenPoolPengurus: 100 - val
    }));
  };

  const handlePercentPengurusChange = (val: number) => {
    setPengaturanSHU(prev => ({
      ...prev,
      persenPoolPengurus: val,
      persenPoolSimpanan: 100 - val
    }));
  };

  const handlePercentPoolChange = (val: number) => {
    setPengaturanSHU(prev => ({
      ...prev,
      persenLabaPool: val
    }));
  };

  // Find the selected member's personal row if in member mode
  const personalSHUResult = isMember && selectedMemberId
    ? results.find(r => r.memberId === selectedMemberId)
    : null;

  return (
    <div id="calculator-shu-view" className="space-y-6">
      
      {/* Settings Row (Sliders for Admin, Read-Only Info for others) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Param settings (Left) */}
        <div className="lg:col-span-5 bg-[#FAF8F5] border-2 border-slate-200 rounded-xl p-5 shadow-xs h-fit">
          <h3 className="text-base font-semibold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            <Settings className="h-5 w-5 text-[#0f5132]" />
            Konfigurasi Persentase Alokasi SHU
          </h3>

          <div className="space-y-5">
            {/* Slide 1: Pool SHU from Profit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-brand font-semibold text-slate-700 flex items-center gap-1">
                  Alokasi Pool SHU dari Laba:
                  <span className="group relative">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg w-48 hidden group-hover:block z-20 font-sans font-normal normal-case leading-tight">
                      Persentase dari total laba bersih usaha koperasi yang dialokasikan khusus untuk dibagikan kembali ke anggota.
                    </span>
                  </span>
                </span>
                <span className="font-mono font-bold text-[#0f5132] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {data.pengaturanSHU.persenLabaPool} %
                </span>
              </div>
              <input
                id="shu-pool-slider"
                type="range"
                min="10"
                max="90"
                step="5"
                value={data.pengaturanSHU.persenLabaPool}
                onChange={(e) => handlePercentPoolChange(Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full accent-[#0f5132] disabled:opacity-50"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>10%</span>
                <span>Alokasi Ideal: 40% - 50%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Slide 2: Jasa Modal proportion (out of the pool) */}
            <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-200/60">
              <span className="text-[10px] font-bold text-[#b8860b] uppercase tracking-wider block mb-1">Breakdown Distribusi Pool SHU:</span>
              
              {/* Jasa Modal Slider */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-brand font-semibold text-slate-700">Porsi Jasa Modal (Simpanan):</span>
                  <span className="font-mono font-bold text-amber-700">
                    {data.pengaturanSHU.persenPoolSimpanan} %
                  </span>
                </div>
                <input
                  id="shu-savings-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={data.pengaturanSHU.persenPoolSimpanan}
                  onChange={(e) => handlePercentModalChange(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full accent-amber-600 disabled:opacity-50"
                />
              </div>

              {/* Jasa Pengurus Slider */}
              <div className="space-y-2.5 mt-3 border-t border-slate-200/80 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-brand font-semibold text-slate-700">Porsi Jasa Pengurus (Andil Kerja):</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {data.pengaturanSHU.persenPoolPengurus} %
                  </span>
                </div>
                <input
                  id="shu-management-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={data.pengaturanSHU.persenPoolPengurus}
                  onChange={(e) => handlePercentPengurusChange(Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full accent-[#0f5132] disabled:opacity-50"
                />
              </div>

              <div className="text-[10px] text-slate-500 italic leading-tight mt-3 text-center border-t border-dashed border-slate-200 pt-2 font-sans">
                {isAdmin ? (
                  "💡 Mengubah satu slider akan menyesuaikan slider lainnya otomatis agar total pas 100%."
                ) : (
                  "🔒 Konfigurasi di atas hanya dapat diubah oleh peran Admin."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic breakdown Ledger sheet (Right) */}
        <div className="lg:col-span-7 bg-[#FAF8F5] border-2 border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <Calculator className="h-5 w-5 text-[#b8860b]" />
              Lembar Jurnal Alokasi Pembagian Dana SHU
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
              Hasil kalkulasi instan pembagian porsi SHU berdasarkan laba bersih koperasi terhitung per hari ini.
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-xs text-slate-700 bg-[#fbf9f4] p-4 rounded-lg border border-slate-200/80">
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Total Laba Bersih Koperasi:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(summary.totalLaba)}</span>
            </div>
            
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-sans text-slate-500">Porsi Pool SHU ({data.pengaturanSHU.persenLabaPool}%):</span>
              <span className="font-bold text-amber-700">{formatRupiah(summary.shuPool)}</span>
            </div>

            <div className="flex justify-between pl-4 text-amber-900 border-l-2 border-amber-500 mt-1">
              <span className="font-sans text-slate-500">Porsi Jasa Modal ({data.pengaturanSHU.persenPoolSimpanan}%):</span>
              <span className="font-semibold">{formatRupiah(summary.poolSimpanan)}</span>
            </div>

            <div className="flex justify-between pl-4 text-emerald-900 border-l-2 border-emerald-700 mt-1 pb-2">
              <span className="font-sans text-slate-500">Porsi Jasa Pengurus ({data.pengaturanSHU.persenPoolPengurus}%):</span>
              <span className="font-semibold">{formatRupiah(summary.poolPengurus)}</span>
            </div>

            <div className="flex justify-between border-t-2 border-[#0f5132] pt-2.5 font-bold text-sm text-[#0f5132]">
              <span className="font-sans">Dana SHU Siap Salur:</span>
              <span className="ledger-double-underline">{formatRupiah(summary.distributedTotal)}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 leading-relaxed font-sans mt-3">
            ⚠️ <span className="font-bold">Ketentuan:</span> Porsi Jasa Modal hanya didistribusikan kepada anggota yang memiliki riwayat simpanan. Porsi Jasa Pengurus hanya dibagikan kepada anggota yang menjabat sebagai <strong>Pengurus</strong>.
          </div>
        </div>
      </div>

      {/* Personalized Slip Section (if logged in as Anggota) */}
      {isMember && personalSHUResult && (
        <div className="bg-[#FAF8F5] border-3 border-[#b8860b] rounded-xl p-5 shadow-md max-w-xl mx-auto relative overflow-hidden bg-gradient-to-br from-amber-50/10 via-[#FAF8F5] to-amber-50/20">
          {/* Paper passbook look stamp */}
          <div className="absolute right-0 top-0 rotate-12 translate-x-3 -translate-y-2 opacity-10 pointer-events-none">
            <Landmark className="h-32 w-32 text-[#0f5132]" />
          </div>

          <div className="flex justify-between items-center border-b border-[#b8860b] pb-3 mb-4">
            <div className="flex items-center gap-2 text-[#0f5132]">
              <Receipt className="h-5 w-5" />
              <h4 className="font-semibold font-display text-base">Slip Rincian SHU Personal</h4>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase font-brand border border-amber-200">
              Passbook Copy
            </span>
          </div>

          {/* Passbook / Slip Content */}
          <div className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-600 bg-white p-3 rounded border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-brand uppercase tracking-wider">Nama Anggota:</span>
                <span className="font-bold text-slate-800 text-sm font-brand">{personalSHUResult.nama}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-brand uppercase tracking-wider">Status / Jabatan:</span>
                <span className="font-bold text-[#0f5132] text-sm font-brand">{personalSHUResult.jabatan}</span>
              </div>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden">
              <div className="bg-[#0f5132]/5 px-3 py-1.5 font-bold text-[#0f5132] font-brand text-[11px] uppercase border-b border-slate-200">
                A. Rincian Jasa Modal (Simpanan)
              </div>
              <div className="p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Simpanan Anda:</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(personalSHUResult.totalSimpanan)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kontribusi terhadap Kas Koperasi (%):</span>
                  <span>{personalSHUResult.proporsiSimpananPersen.toFixed(3)} %</span>
                </div>
                <div className="flex justify-between text-[#b8860b] font-bold border-t border-dashed border-slate-100 pt-1.5">
                  <span>SHU Jasa Modal Diterima:</span>
                  <span>{formatRupiah(personalSHUResult.shuJasaModal)}</span>
                </div>
              </div>
            </div>

            {personalSHUResult.jabatan === 'Pengurus' && (
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="bg-[#0f5132]/5 px-3 py-1.5 font-bold text-[#0f5132] font-brand text-[11px] uppercase border-b border-slate-200">
                  B. Rincian Jasa Kerja Pengurus
                </div>
                <div className="p-3 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Bobot Pengurus Kerja Anda:</span>
                    <span className="font-semibold text-slate-800">{personalSHUResult.bobotPengurus} %</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-dashed border-slate-100 pt-1.5">
                    <span>SHU Jasa Pengurus Diterima:</span>
                    <span>{formatRupiah(personalSHUResult.shuJasaPengurus)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-lg flex justify-between items-center font-mono">
              <div>
                <span className="text-[10px] text-emerald-300 block font-brand uppercase tracking-wider font-semibold">Total Penerimaan SHU Anda:</span>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {formatRupiah(personalSHUResult.totalSHU)}
                </span>
              </div>
              <div className="text-right text-[10px] font-sans opacity-75">
                Tanggal Perhitungan:<br />
                {new Date().toISOString().split('T')[0]}
              </div>
            </div>
            
            {/* Signature Area */}
            <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between text-[10px] text-slate-400 font-mono">
              <div>
                <span>Disahkan Oleh:</span>
                <div className="h-10"></div>
                <span className="underline font-bold text-slate-700">Ahmad Subarjo</span><br />
                <span>Ketua Koperasi ICMS</span>
              </div>
              <div className="text-right">
                <span>Penerima:</span>
                <div className="h-10"></div>
                <span className="underline font-bold text-slate-700">{personalSHUResult.nama}</span><br />
                <span>Anggota Koperasi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger Distribution Table */}
      <div className="bg-[#FAF8F5] border-2 border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-semibold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <Award className="h-5 w-5 text-[#b8860b]" />
          Buku Besar Distribusi SHU per Anggota
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-[#0f5132]/5 text-[#0f5132] text-xs font-brand uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Nama Anggota</th>
                <th className="px-3 py-3 text-center font-bold">Jabatan</th>
                <th className="px-4 py-3 text-right font-bold">Total Simpanan (Rp)</th>
                <th className="px-3 py-3 text-center font-bold">Kontribusi %</th>
                <th className="px-4 py-3 text-right font-bold text-amber-700">SHU Simpanan (Rp)</th>
                <th className="px-4 py-3 text-right font-bold text-emerald-800">SHU Pengurus (Rp)</th>
                <th className="px-4 py-3 text-right font-bold bg-[#0f5132]/5 text-[#0f5132]">Total SHU (Rp)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 text-xs">
              {results.map((r) => {
                const isPersonalHighlight = currentUserRole === 'anggota' && r.memberId === selectedMemberId;
                return (
                  <tr 
                    key={r.memberId} 
                    className={`hover:bg-[#fcfbf9] transition-all ${
                      isPersonalHighlight ? 'bg-amber-100/40 font-semibold border-y border-[#b8860b]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800 font-brand">
                      {r.nama} {isPersonalHighlight && <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded ml-1 font-sans uppercase">Anda</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase font-brand ${
                        r.jabatan === 'Pengurus' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.jabatan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatRupiah(r.totalSimpanan)}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium text-slate-600">
                      {r.proporsiSimpananPersen.toFixed(2)} %
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      {formatRupiah(r.shuJasaModal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-800">
                      {formatRupiah(r.shuJasaPengurus)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#0f5132] bg-[#0f5132]/2">
                      {formatRupiah(r.totalSHU)}
                    </td>
                  </tr>
                );
              })}

              {/* Grand totals row */}
              <tr className="bg-slate-50 font-bold border-t-2 border-[#0f5132]">
                <td colSpan={2} className="px-4 py-3.5 font-brand text-xs text-[#0f5132] uppercase font-bold text-left">
                  JUMLAH DISTRIBUSI TOTAL
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-800 text-xs ledger-double-underline">
                  {formatRupiah(results.reduce((sum, r) => sum + r.totalSimpanan, 0))}
                </td>
                <td className="px-3 py-3.5 text-center font-mono text-xs ledger-double-underline">
                  100.00 %
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-amber-800 text-xs ledger-double-underline">
                  {formatRupiah(results.reduce((sum, r) => sum + r.shuJasaModal, 0))}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-emerald-800 text-xs ledger-double-underline">
                  {formatRupiah(results.reduce((sum, r) => sum + r.shuJasaPengurus, 0))}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-[#0f5132] text-sm ledger-double-underline">
                  {formatRupiah(results.reduce((sum, r) => sum + r.totalSHU, 0))}
                </td>
              </tr>

              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data anggota terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
