/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Trash2, 
  BadgeDollarSign, 
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Filter,
  Search,
  Edit2,
  X
} from 'lucide-react';
import { LabaUsaha, KategoriAktivitas, Anggota } from '../types';
import { formatRupiah, getBusinessProfitSummary } from '../utils/format';

export const KATEGORI_INFO: Record<string, { nama: string; tipe: 'penerimaan' | 'pengeluaran' | 'both'; siklus: string; warna: string }> = {
  ksp_pinjaman: { nama: 'Pemberian Pinjaman', tipe: 'pengeluaran', siklus: 'Simpan Pinjam', warna: 'bg-amber-600/10 text-amber-800 border-amber-200' },
  ksp_angsuran: { nama: 'Angsuran Pokok', tipe: 'penerimaan', siklus: 'Simpan Pinjam', warna: 'bg-green-primary/10 text-green-primary border-green-primary/20' },
  ksp_bunga: { nama: 'Penerimaan Bunga', tipe: 'penerimaan', siklus: 'Simpan Pinjam', warna: 'bg-green-primary/10 text-green-primary border-green-primary/20' },
  ksp_admin: { nama: 'Biaya Administrasi', tipe: 'penerimaan', siklus: 'Simpan Pinjam', warna: 'bg-green-primary/10 text-green-primary border-green-primary/20' },
  prod_pembelian: { nama: 'Pembelian Barang/Baku', tipe: 'pengeluaran', siklus: 'Konsumen/Produsen', warna: 'bg-orange-50 text-orange-800 border-orange-200' },
  prod_penjualan: { nama: 'Penjualan Barang', tipe: 'penerimaan', siklus: 'Konsumen/Produsen', warna: 'bg-yellow-50 text-gold-accent border-beige-border' },
  beban_admin: { nama: 'Beban Administrasi/Umum', tipe: 'pengeluaran', siklus: 'Beban Umum', warna: 'bg-slate-100 text-slate-700 border-slate-200' },
  beban_gaji: { nama: 'Beban Gaji/Honor', tipe: 'pengeluaran', siklus: 'Beban Umum', warna: 'bg-slate-100 text-slate-700 border-slate-200' },
};

interface ManageProfitProps {
  labaUsahaList: LabaUsaha[];
  setLabaUsahaList: React.Dispatch<React.SetStateAction<LabaUsaha[]>>;
  currentUserRole: 'admin' | 'anggota' | 'guest';
  anggotaList?: Anggota[];
}

export default function ManageProfit({
  labaUsahaList,
  setLabaUsahaList,
  currentUserRole,
  anggotaList = []
}: ManageProfitProps) {
  const isAdmin = currentUserRole === 'admin';

  // State for recording/editing business activity
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [namaUsahaInput, setNamaUsahaInput] = useState('');
  const [kategoriInput, setKategoriInput] = useState<string>('prod_penjualan');
  const [pengeluaranInput, setPengeluaranInput] = useState<string>('0');
  const [penerimaanInput, setPenerimaanInput] = useState<string>('');
  const [tanggalInput, setTanggalInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [catatanInput, setCatatanInput] = useState('');

  // Filtering states
  const [filterSiklus, setFilterSiklus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Validation state
  const [errorMsg, setErrorMsg] = useState('');

  // Deletion confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteTargetName = useMemo(() => {
    return labaUsahaList.find(l => l.id === deleteConfirmId)?.namaUsaha || '';
  }, [deleteConfirmId, labaUsahaList]);

  const isMemberInList = useMemo(() => {
    return anggotaList.some(m => m.nama === namaUsahaInput);
  }, [namaUsahaInput, anggotaList]);

  const onKategoriChange = (kat: string) => {
    setKategoriInput(kat);
    const info = KATEGORI_INFO[kat];
    if (info) {
      if (info.tipe === 'penerimaan') {
        setPengeluaranInput('0');
        setPenerimaanInput('');
      } else if (info.tipe === 'pengeluaran') {
        setPenerimaanInput('0');
        setPengeluaranInput('');
      }
    }
    if (kat === 'ksp_pinjaman') {
      if (!isEditing) {
        setNamaUsahaInput(anggotaList[0]?.nama || '');
      }
    } else {
      if (!isEditing) {
        setNamaUsahaInput('');
      }
    }
  };

  // Start edit flow
  const handleStartEdit = (activity: LabaUsaha) => {
    setIsEditing(true);
    setEditingId(activity.id);
    setNamaUsahaInput(activity.namaUsaha);
    setKategoriInput(activity.kategori || 'prod_penjualan');
    setPengeluaranInput(String(activity.pengeluaran));
    setPenerimaanInput(String(activity.penerimaan));
    setTanggalInput(activity.tanggal);
    setCatatanInput(activity.catatan || '');
    setErrorMsg('');
  };

  // Cancel edit flow
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNamaUsahaInput('');
    setKategoriInput('prod_penjualan');
    setPengeluaranInput('0');
    setPenerimaanInput('');
    setTanggalInput(new Date().toISOString().split('T')[0]);
    setCatatanInput('');
    setErrorMsg('');
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaUsahaInput.trim()) {
      setErrorMsg('Nama kegiatan usaha / unit tidak boleh kosong.');
      return;
    }

    const pengeluaran = Number(pengeluaranInput);
    const penerimaan = Number(penerimaanInput);

    if (isNaN(pengeluaran) || pengeluaran < 0) {
      setErrorMsg('Jumlah pengeluaran tidak boleh bernilai minus.');
      return;
    }

    if (isNaN(penerimaan) || penerimaan < 0) {
      setErrorMsg('Jumlah penerimaan tidak boleh bernilai minus.');
      return;
    }

    if (isEditing && editingId) {
      // Edit existing activity
      setLabaUsahaList(prev => prev.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            namaUsaha: namaUsahaInput.trim(),
            pengeluaran: Math.floor(pengeluaran),
            penerimaan: Math.floor(penerimaan),
            tanggal: tanggalInput,
            catatan: catatanInput.trim() || undefined,
            kategori: kategoriInput as KategoriAktivitas
          };
        }
        return item;
      }));
      setIsEditing(false);
      setEditingId(null);
    } else {
      // Add new activity
      const activityId = `l_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newActivity: LabaUsaha = {
        id: activityId,
        namaUsaha: namaUsahaInput.trim(),
        pengeluaran: Math.floor(pengeluaran),
        penerimaan: Math.floor(penerimaan),
        tanggal: tanggalInput,
        catatan: catatanInput.trim() || undefined,
        kategori: kategoriInput as KategoriAktivitas
      };
      setLabaUsahaList(prev => [newActivity, ...prev]);
    }

    // Reset inputs
    setNamaUsahaInput('');
    setKategoriInput('prod_penjualan');
    setPengeluaranInput('0');
    setPenerimaanInput('');
    setTanggalInput(new Date().toISOString().split('T')[0]);
    setCatatanInput('');
    setErrorMsg('');
  };

  // Delete activity
  const handleDeleteActivity = (id: string, name: string) => {
    setDeleteConfirmId(id);
  };

  // Profit summaries (using full list for top cards)
  const totals = useMemo(() => {
    return getBusinessProfitSummary(labaUsahaList);
  }, [labaUsahaList]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return labaUsahaList.filter(item => {
      // Name Search Filter
      const matchesSearch = item.namaUsaha.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Cycle Filter
      let matchesSiklus = true;
      if (filterSiklus !== 'all') {
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
            kat = 'prod_penjualan';
          }
        }
        
        const info = KATEGORI_INFO[kat] || { siklus: 'Konsumen/Produsen' };
        if (filterSiklus === 'ksp') matchesSiklus = info.siklus === 'Simpan Pinjam';
        else if (filterSiklus === 'prod') matchesSiklus = info.siklus === 'Konsumen/Produsen';
        else if (filterSiklus === 'beban') matchesSiklus = info.siklus === 'Beban Umum';
      }

      return matchesSearch && matchesSiklus;
    });
  }, [labaUsahaList, filterSiklus, searchTerm]);

  return (
    <div id="laba-usaha-view" className="space-y-6">
      
      {/* Top section: ledger registration & rekap cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Entry Form (Left) */}
        <div className="lg:col-span-5 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs h-fit">
          <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3 mb-4 uppercase tracking-wider justify-between">
            <div className="flex items-center gap-2">
              {isEditing ? <Edit2 className="h-5 w-5 text-green-primary" /> : <PlusCircle className="h-5 w-5 text-green-primary" />}
              {isEditing ? 'Ubah Kegiatan Usaha' : 'Catat Kegiatan Usaha Koperasi'}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 normal-case tracking-normal font-sans font-medium cursor-pointer"
              >
                <X className="h-3 w-3" /> Batal
              </button>
            )}
          </h3>

          {isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-medium font-mono">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    {kategoriInput === 'ksp_pinjaman' ? 'Nama Anggota Peminjam:' : 'Nama Unit / Kegiatan Usaha:'}
                  </label>
                  {kategoriInput === 'ksp_pinjaman' ? (
                    <select
                      id="profit-name-select"
                      value={namaUsahaInput}
                      onChange={(e) => setNamaUsahaInput(e.target.value)}
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Anggota --</option>
                      {anggotaList?.map((m) => (
                        <option key={m.id} value={m.nama}>
                          {m.nama} ({m.jabatan})
                        </option>
                      ))}
                      {!isMemberInList && namaUsahaInput && (
                        <option value={namaUsahaInput}>{namaUsahaInput}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      id="profit-name-input"
                      type="text"
                      value={namaUsahaInput}
                      onChange={(e) => setNamaUsahaInput(e.target.value)}
                      placeholder="Contoh: Pembelian Vario, Gaji Karyawan"
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    Kategori Siklus Transaksi:
                  </label>
                  <select
                    id="profit-category-select"
                    value={kategoriInput}
                    onChange={(e) => onKategoriChange(e.target.value)}
                    className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                  >
                    <optgroup label="Siklus II: Simpan Pinjam (KSP)">
                      <option value="ksp_pinjaman">Pemberian Pinjaman (Kas Keluar)</option>
                      <option value="ksp_angsuran">Angsuran Pokok (Kas Masuk)</option>
                      <option value="ksp_bunga">Penerimaan Bunga (Kas Masuk)</option>
                      <option value="ksp_admin">Biaya Administrasi Pinjaman (Kas Masuk)</option>
                    </optgroup>
                    <optgroup label="Siklus III: Konsumen & Produsen">
                      <option value="prod_penjualan">Penjualan Barang (Kas Masuk)</option>
                      <option value="prod_pembelian">Pembelian Barang/Bahan Baku (Kas Keluar)</option>
                    </optgroup>
                    <optgroup label="Siklus IV: Beban Umum & Personalia">
                      <option value="beban_admin">Beban Administrasi & Umum (Kas Keluar)</option>
                      <option value="beban_gaji">Beban Personalia/Gaji (Kas Keluar)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {kategoriInput && KATEGORI_INFO[kategoriInput] && (
                <div className="p-2.5 bg-cream-bg rounded border border-beige-border text-[10px] text-slate-600 leading-relaxed font-sans">
                  💡 <span className="font-semibold text-green-primary uppercase tracking-wider">{KATEGORI_INFO[kategoriInput].siklus}:</span> {
                    kategoriInput === 'ksp_pinjaman' ? 'Transaksi penyaluran dana kredit kepada anggota yang membutuhkan.' :
                    kategoriInput === 'ksp_angsuran' ? 'Penerimaan cicilan pengembalian dana pinjaman dari anggota.' :
                    kategoriInput === 'ksp_bunga' ? 'Pendapatan jasa pinjaman (bunga) yang dibebankan kepada peminjam.' :
                    kategoriInput === 'ksp_admin' ? 'Pungutan atas layanan pemrosesan pinjaman anggota.' :
                    kategoriInput === 'prod_pembelian' ? 'Transaksi pengeluaran kas untuk pengadaan stok barang.' :
                    kategoriInput === 'prod_penjualan' ? 'Transaksi penerimaan kas dari penjualan barang dagangan kepada anggota maupun non-anggota.' :
                    kategoriInput === 'beban_admin' ? 'Biaya listrik, telepon, alat tulis kantor (ATK), dan sewa.' :
                    kategoriInput === 'beban_gaji' ? 'Pembayaran upah untuk pengurus dan karyawan koperasi.' : ''
                  }
                  <span className="block mt-1 text-[9px] text-slate-500 font-medium">
                    {KATEGORI_INFO[kategoriInput].tipe === 'penerimaan' ? '⚠️ Bidang Pengeluaran dikunci ke Rp 0 untuk kategori Penerimaan Kas.' : '⚠️ Bidang Penerimaan dikunci ke Rp 0 untuk kategori Pengeluaran Kas.'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    Penerimaan (Omset Rp):
                  </label>
                  <input
                    id="profit-income-input"
                    type="number"
                    min="0"
                    value={penerimaanInput}
                    onChange={(e) => setPenerimaanInput(e.target.value)}
                    placeholder={KATEGORI_INFO[kategoriInput]?.tipe === 'pengeluaran' ? 'Terkunci (Pengeluaran)' : 'Total kas masuk'}
                    className={`w-full border border-beige-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none ${
                      KATEGORI_INFO[kategoriInput]?.tipe === 'pengeluaran' ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-white'
                    }`}
                    disabled={KATEGORI_INFO[kategoriInput]?.tipe === 'pengeluaran'}
                    required
                  />
                  {penerimaanInput && !isNaN(Number(penerimaanInput)) && (
                    <p className="text-[10px] text-green-primary font-semibold mt-1">
                      {formatRupiah(Number(penerimaanInput))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    Pengeluaran (Biaya Rp):
                  </label>
                  <input
                    id="profit-expense-input"
                    type="number"
                    min="0"
                    value={pengeluaranInput}
                    onChange={(e) => setPengeluaranInput(e.target.value)}
                    placeholder={KATEGORI_INFO[kategoriInput]?.tipe === 'penerimaan' ? 'Terkunci (Penerimaan)' : 'Total modal/operasional'}
                    className={`w-full border border-beige-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none ${
                      KATEGORI_INFO[kategoriInput]?.tipe === 'penerimaan' ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-white'
                    }`}
                    disabled={KATEGORI_INFO[kategoriInput]?.tipe === 'penerimaan'}
                    required
                  />
                  {pengeluaranInput && !isNaN(Number(pengeluaranInput)) && (
                    <p className="text-[10px] text-red-600 font-semibold mt-1">
                      {formatRupiah(Number(pengeluaranInput))}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    Tanggal Pencatatan:
                  </label>
                  <input
                    id="profit-date-input"
                    type="date"
                    value={tanggalInput}
                    onChange={(e) => setTanggalInput(e.target.value)}
                    className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                    Catatan Tambahan:
                  </label>
                  <input
                    id="profit-note-input"
                    type="text"
                    value={catatanInput}
                    onChange={(e) => setCatatanInput(e.target.value)}
                    placeholder="Opsional - keterangan"
                    className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                  />
                </div>
              </div>

              {penerimaanInput && pengeluaranInput && !isNaN(Number(penerimaanInput)) && !isNaN(Number(pengeluaranInput)) && (
                <div className="p-3 bg-cream-bg rounded border border-beige-border flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold font-brand">Proyeksi Laba Bersih:</span>
                  <span className={`font-mono text-sm font-bold ${
                    (Number(penerimaanInput) - Number(pengeluaranInput)) >= 0 ? 'text-green-primary' : 'text-red-600'
                  }`}>
                    {formatRupiah(Number(penerimaanInput) - Number(pengeluaranInput))}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full text-white font-brand font-semibold uppercase py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer ${
                  isEditing 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-green-primary hover:bg-green-primary/90'
                }`}
              >
                <BadgeDollarSign className="h-4 w-4 text-gold-accent animate-pulse" />{' '}
                {isEditing ? 'Simpan Perubahan' : 'Masukkan Buku Usaha'}
              </button>
            </form>
          ) : (
            <div className="bg-cream-bg text-slate-800 p-4 rounded-lg border border-beige-border text-xs space-y-2">
              <AlertTriangle className="h-5 w-5 text-gold-accent mb-1 animate-bounce" />
              <p className="font-semibold font-brand text-green-primary uppercase tracking-wider">Mode Terbatas (Read-Only)</p>
              <p className="leading-relaxed text-slate-600">
                Anda login sebagai <span className="font-bold uppercase text-green-primary">{currentUserRole === 'anggota' ? 'Anggota' : 'Tamu'}</span>. Pencatatan transaksi usaha baru hanya bisa dilakukan oleh <span className="font-bold text-gold-accent">Admin</span>.
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Ledger Summary Display Cards (Right) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Card 1: Omset Penerimaan */}
          <div className="bg-cream-card border-2 border-beige-border p-5 rounded-xl shadow-xs flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-brand">Total Omset Penerimaan Koperasi</span>
              <h3 className="text-2xl font-mono font-bold text-green-primary mt-1">
                {formatRupiah(totals.penerimaan)}
              </h3>
            </div>
            <div className="p-3 bg-green-primary/10 text-green-primary border border-green-primary/20 rounded-full">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Pengeluaran Modal */}
          <div className="bg-cream-card border-2 border-beige-border p-5 rounded-xl shadow-xs flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-brand">Total Pengeluaran / Biaya Operasional</span>
              <h3 className="text-2xl font-mono font-bold text-red-600 mt-1">
                {formatRupiah(totals.pengeluaran)}
              </h3>
            </div>
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-full">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Bersih Kas Koperasi */}
          <div className="bg-cream-card border-2 border-gold-accent p-5 rounded-xl shadow-xs flex justify-between items-center relative overflow-hidden bg-gradient-to-r from-amber-50/20 to-transparent">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gold-accent uppercase tracking-wider font-brand">Laba Usaha Bersih</span>
                <span className="text-[9px] bg-green-primary text-white px-2 py-0.2 rounded font-bold font-mono">NET PROFIT</span>
              </div>
              <h3 className="text-3xl font-mono font-bold text-green-primary mt-1.5">
                {formatRupiah(totals.laba)}
              </h3>
            </div>
            <div className="p-3 bg-cream-bg text-gold-accent border-2 border-beige-border rounded-full">
              <Layers className="h-7 w-7" />
            </div>
          </div>
        </div>

      </div>

      {/* Ledger Log listing (Bottom) */}
      <div className="bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs">
        <div className="border-b border-beige-border pb-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 uppercase tracking-wider">
            <FileSpreadsheet className="h-5 w-5 text-gold-accent" />
            Buku Besar Jurnal Kegiatan Laba Usaha Koperasi
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Menampilkan {filteredActivities.length} dari {labaUsahaList.length} transaksi
          </span>
        </div>

        {/* Filters and Search controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-4 justify-between items-stretch md:items-center">
          {/* Cycle filter buttons */}
          <div className="flex flex-wrap gap-1 bg-cream-bg p-1 rounded-lg border border-beige-border">
            <button
              onClick={() => setFilterSiklus('all')}
              className={`px-3 py-1.5 text-xs font-brand uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                filterSiklus === 'all'
                  ? 'bg-green-primary text-white shadow-xs'
                  : 'text-slate-500 hover:text-green-primary hover:bg-white/50'
              }`}
            >
              Semua Siklus
            </button>
            <button
              onClick={() => setFilterSiklus('ksp')}
              className={`px-3 py-1.5 text-xs font-brand uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                filterSiklus === 'ksp'
                  ? 'bg-green-primary text-white shadow-xs'
                  : 'text-slate-500 hover:text-green-primary hover:bg-white/50'
              }`}
            >
              Simpan Pinjam (II)
            </button>
            <button
              onClick={() => setFilterSiklus('prod')}
              className={`px-3 py-1.5 text-xs font-brand uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                filterSiklus === 'prod'
                  ? 'bg-green-primary text-white shadow-xs'
                  : 'text-slate-500 hover:text-green-primary hover:bg-white/50'
              }`}
            >
              Sektor Riil (III)
            </button>
            <button
              onClick={() => setFilterSiklus('beban')}
              className={`px-3 py-1.5 text-xs font-brand uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                filterSiklus === 'beban'
                  ? 'bg-green-primary text-white shadow-xs'
                  : 'text-slate-500 hover:text-green-primary hover:bg-white/50'
              }`}
            >
              Beban Umum (IV)
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi / keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-beige-border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none placeholder-slate-400 font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-beige-border rounded-lg">
          <table className="min-w-full divide-y border-collapse divide-beige-border">
            <thead className="bg-cream-bg text-gold-accent text-xs font-sans uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border w-32">Tanggal</th>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Unit / Kegiatan Usaha</th>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border w-48">Kategori / Siklus</th>
                <th className="px-4 py-3 text-right font-bold border-b border-r border-beige-border">Penerimaan (Rp)</th>
                <th className="px-4 py-3 text-right font-bold border-b border-r border-beige-border">Pengeluaran (Rp)</th>
                <th className="px-4 py-3 text-right font-bold border-b border-r border-beige-border">Laba Bersih (Rp)</th>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Keterangan</th>
                {isAdmin && <th className="px-3 py-3 text-center font-bold border-b w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-beige-border text-xs">
              {filteredActivities.map((item) => {
                const netItem = item.penerimaan - item.pengeluaran;
                
                // Get category or map legacy
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
                    kat = 'prod_penjualan';
                  }
                }
                const info = KATEGORI_INFO[kat];

                return (
                  <tr key={item.id} className="hover:bg-cream-bg transition-all border-b border-beige-border">
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap border-r border-beige-border">
                      {item.tanggal}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-primary font-brand border-r border-beige-border">
                      {item.namaUsaha}
                    </td>
                    <td className="px-4 py-3 border-r border-beige-border whitespace-nowrap">
                      {info ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block w-fit px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase border ${info.warna}`}>
                            {info.nama}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium ml-0.5 font-sans">
                            {info.siklus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-primary border-r border-beige-border">
                      {formatRupiah(item.penerimaan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 border-r border-beige-border">
                      {formatRupiah(item.pengeluaran)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold border-r border-beige-border ${
                      netItem >= 0 ? 'text-green-primary' : 'text-red-600'
                    }`}>
                      {formatRupiah(netItem)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic border-r border-beige-border">
                      {item.catatan || '-'}
                    </td>
                    
                    {isAdmin && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`edit-profit-${item.id}`}
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-green-primary bg-slate-50 hover:bg-green-primary/10 border border-beige-border hover:border-green-primary/30 rounded transition-all cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`delete-profit-${item.id}`}
                            onClick={() => handleDeleteActivity(item.id, item.namaUsaha)}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-beige-border hover:border-red-300 rounded transition-all cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Total Aggregate double-underline ledger row */}
              <tr className="bg-cream-bg font-bold border-t-2 border-green-primary">
                <td colSpan={3} className="px-4 py-3.5 font-brand text-xs text-green-primary border-r border-beige-border uppercase font-bold text-left">
                  TOTAL FILTERED JURNAL
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-green-primary border-r border-beige-border text-xs ledger-double-underline">
                  {formatRupiah(filteredActivities.reduce((sum, item) => sum + item.penerimaan, 0))}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-red-700 border-r border-beige-border text-xs ledger-double-underline">
                  {formatRupiah(filteredActivities.reduce((sum, item) => sum + item.pengeluaran, 0))}
                </td>
                <td className={`px-4 py-3.5 text-right font-mono text-sm border-r border-beige-border ledger-double-underline ${
                  filteredActivities.reduce((sum, item) => sum + (item.penerimaan - item.pengeluaran), 0) >= 0 ? 'text-green-primary' : 'text-red-700'
                }`}>
                  {formatRupiah(filteredActivities.reduce((sum, item) => sum + (item.penerimaan - item.pengeluaran), 0))}
                </td>
                <td colSpan={isAdmin ? 2 : 1} className="px-4 py-3.5 ledger-double-underline"></td>
              </tr>

              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-400 font-sans">
                    Tidak ada catatan aktivitas usaha yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-cream-card border-2 border-beige-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold font-display text-red-600 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 animate-bounce text-red-600" />
              Konfirmasi Hapus Catatan
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus catatan kegiatan usaha <strong className="text-green-primary">"{deleteTargetName}"</strong>? 
              Tindakan ini tidak dapat dibatalkan dan perhitungan dana pool SHU akan berubah otomatis.
            </p>
            <div className="flex justify-end gap-2 text-xs font-semibold uppercase tracking-wider font-brand">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-beige-border text-slate-700 rounded-lg transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) {
                    setLabaUsahaList(prev => prev.filter(l => l.id !== deleteConfirmId));
                    setDeleteConfirmId(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer"
              >
                Hapus Catatan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
