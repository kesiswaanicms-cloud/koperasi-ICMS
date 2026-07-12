/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  Coins, 
  History, 
  PlusCircle, 
  Trash2, 
  Search, 
  Filter, 
  Calculator, 
  AlertTriangle,
  FolderDot,
  Edit2,
  X
} from 'lucide-react';
import { Simpanan, Anggota, JenisSimpanan } from '../types';
import { formatRupiah, getMemberSavingsBreakdown } from '../utils/format';

interface ManageSavingsProps {
  simpananList: Simpanan[];
  setSimpananList: React.Dispatch<React.SetStateAction<Simpanan[]>>;
  anggotaList: Anggota[];
  currentUserRole: 'admin' | 'anggota' | 'guest';
}

export default function ManageSavings({
  simpananList,
  setSimpananList,
  anggotaList,
  currentUserRole
}: ManageSavingsProps) {
  const isAdmin = currentUserRole === 'admin';

  // State for recording transaction
  const [memberIdInput, setMemberIdInput] = useState('');
  const [jenisInput, setJenisInput] = useState<JenisSimpanan>('wajib');
  const [periodeInput, setPeriodeInput] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // e.g. "2026-07"
  });
  const [jumlahInput, setJumlahInput] = useState<string>('');
  const [tanggalInput, setTanggalInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [catatanInput, setCatatanInput] = useState('');

  // Penarikan (Withdrawal) state
  const [formTab, setFormTab] = useState<'setoran' | 'penarikan'>('setoran');
  const [withdrawalType, setWithdrawalType] = useState<'sukarela' | 'keluar'>('sukarela');
  const [withdrawalJumlahInput, setWithdrawalJumlahInput] = useState<string>('');
  const [withdrawalTanggalInput, setWithdrawalTanggalInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [withdrawalCatatanInput, setWithdrawalCatatanInput] = useState('');
  const [withdrawalErrorMsg, setWithdrawalErrorMsg] = useState('');

  // Validation & search state
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('all');

  // Edit & Delete Confirmation States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deleteTargetDetails = useMemo(() => {
    if (!deleteConfirmId) return null;
    const tx = simpananList.find(s => s.id === deleteConfirmId);
    if (!tx) return null;
    const member = anggotaList.find(m => m.id === tx.memberId);
    return {
      name: member?.nama || 'Unknown',
      amount: tx.jumlah
    };
  }, [deleteConfirmId, simpananList, anggotaList]);

  // Start editing transaction
  const handleStartEdit = (tx: Simpanan) => {
    setIsEditing(true);
    setEditingId(tx.id);
    
    if (tx.jumlah >= 0) {
      setFormTab('setoran');
      setMemberIdInput(tx.memberId);
      setJenisInput(tx.jenis);
      setPeriodeInput(tx.periode);
      setJumlahInput(String(tx.jumlah));
      setTanggalInput(tx.tanggal);
      setCatatanInput(tx.catatan || '');
      setErrorMsg('');
    } else {
      setFormTab('penarikan');
      setMemberIdInput(tx.memberId);
      setWithdrawalType(tx.periode === 'Keluar' ? 'keluar' : 'sukarela');
      setWithdrawalJumlahInput(String(Math.abs(tx.jumlah)));
      setWithdrawalTanggalInput(tx.tanggal);
      setWithdrawalCatatanInput(tx.catatan || '');
      setWithdrawalErrorMsg('');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    
    // Reset fields
    if (anggotaList.length > 0) {
      setMemberIdInput(anggotaList[0].id);
    }
    setJenisInput('wajib');
    const today = new Date();
    setPeriodeInput(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    setJumlahInput('');
    setTanggalInput(new Date().toISOString().split('T')[0]);
    setCatatanInput('');
    setErrorMsg('');

    setWithdrawalType('sukarela');
    setWithdrawalJumlahInput('');
    setWithdrawalTanggalInput(new Date().toISOString().split('T')[0]);
    setWithdrawalCatatanInput('');
    setWithdrawalErrorMsg('');
  };

  // Initialize dropdown default
  React.useEffect(() => {
    if (anggotaList.length > 0 && !memberIdInput) {
      setMemberIdInput(anggotaList[0].id);
    }
  }, [anggotaList, memberIdInput]);

  // Calculate selected member's breakdown for withdrawal form
  const selectedMemberBreakdown = useMemo(() => {
    if (!memberIdInput) return { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
    const breakdown = getMemberSavingsBreakdown(memberIdInput, simpananList);
    const total = breakdown.pokok + breakdown.wajib + breakdown.sukarela;
    return { ...breakdown, total };
  }, [memberIdInput, simpananList]);

  // Sync withdrawal amount when type is 'keluar'
  React.useEffect(() => {
    if (withdrawalType === 'keluar') {
      setWithdrawalJumlahInput(selectedMemberBreakdown.total.toString());
    } else {
      setWithdrawalJumlahInput('');
    }
  }, [withdrawalType, memberIdInput, selectedMemberBreakdown.total]);

  // Form submit (Deposit / Setoran)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!memberIdInput) {
      setErrorMsg('Pilih anggota terlebih dahulu.');
      return;
    }

    const jumlah = Number(jumlahInput);
    if (isNaN(jumlah) || jumlah <= 0) {
      setErrorMsg('Jumlah simpanan harus angka bulat positif lebih besar dari nol.');
      return;
    }

    if (!periodeInput.trim()) {
      setErrorMsg('Periode/Bulan wajib diisi.');
      return;
    }

    if (!tanggalInput) {
      setErrorMsg('Tanggal transaksi wajib diisi.');
      return;
    }

    // Auto generate logical notes if empty
    const selectedMemberName = anggotaList.find(m => m.id === memberIdInput)?.nama || '';
    const generatedCatatan = catatanInput.trim() || `Simpanan ${jenisInput} - ${selectedMemberName} (${periodeInput})`;

    if (isEditing && editingId) {
      setSimpananList(prev => prev.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            memberId: memberIdInput,
            jenis: jenisInput,
            periode: periodeInput,
            jumlah: Math.floor(jumlah),
            tanggal: tanggalInput,
            catatan: generatedCatatan
          };
        }
        return item;
      }));
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newTransaction: Simpanan = {
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        memberId: memberIdInput,
        jenis: jenisInput,
        periode: periodeInput,
        jumlah: Math.floor(jumlah),
        tanggal: tanggalInput,
        catatan: generatedCatatan
      };

      setSimpananList(prev => [newTransaction, ...prev]);
    }
    
    // Reset form inputs except member and period for convenience of multiple entries
    setJumlahInput('');
    setCatatanInput('');
    setErrorMsg('');
  };

  // Form submit (Withdrawal / Penarikan)
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalErrorMsg('');

    if (!memberIdInput) {
      setWithdrawalErrorMsg('Pilih anggota terlebih dahulu.');
      return;
    }

    const selectedMemberName = anggotaList.find(m => m.id === memberIdInput)?.nama || '';

    if (withdrawalType === 'sukarela') {
      const jumlah = Number(withdrawalJumlahInput);
      if (isNaN(jumlah) || jumlah <= 0) {
        setWithdrawalErrorMsg('Jumlah penarikan harus angka bulat positif lebih besar dari nol.');
        return;
      }
      
      const currentEditingItem = isEditing && editingId ? simpananList.find(s => s.id === editingId) : null;
      const currentEditingAmount = (currentEditingItem && currentEditingItem.jenis === 'sukarela') 
        ? Math.abs(currentEditingItem.jumlah) 
        : 0;

      if (jumlah > selectedMemberBreakdown.sukarela + currentEditingAmount) {
        setWithdrawalErrorMsg(`Jumlah penarikan (${formatRupiah(jumlah)}) tidak boleh melebihi saldo simpanan sukarela anggota (${formatRupiah(selectedMemberBreakdown.sukarela + currentEditingAmount)}).`);
        return;
      }

      const generatedCatatan = withdrawalCatatanInput.trim() || `Penarikan Simpanan Sukarela - ${selectedMemberName}`;

      if (isEditing && editingId) {
        setSimpananList(prev => prev.map(item => {
          if (item.id === editingId) {
            return {
              ...item,
              memberId: memberIdInput,
              jenis: 'sukarela',
              periode: withdrawalTanggalInput.substring(0, 7) || 'Penarikan',
              jumlah: -Math.floor(jumlah),
              tanggal: withdrawalTanggalInput,
              catatan: generatedCatatan
            };
          }
          return item;
        }));
        setIsEditing(false);
        setEditingId(null);
      } else {
        const newTransaction: Simpanan = {
          id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          memberId: memberIdInput,
          jenis: 'sukarela',
          periode: withdrawalTanggalInput.substring(0, 7) || 'Penarikan',
          jumlah: -Math.floor(jumlah),
          tanggal: withdrawalTanggalInput,
          catatan: generatedCatatan
        };

        setSimpananList(prev => [newTransaction, ...prev]);
      }
    } else if (withdrawalType === 'keluar') {
      const generatedCatatan = withdrawalCatatanInput.trim() || `Pengembalian/Penyelesaian Simpanan Anggota Keluar - ${selectedMemberName}`;
      
      if (isEditing && editingId) {
        const inputAmount = Number(withdrawalJumlahInput);
        if (isNaN(inputAmount) || inputAmount <= 0) {
          setWithdrawalErrorMsg('Jumlah pengembalian harus angka bulat positif lebih besar dari nol.');
          return;
        }

        setSimpananList(prev => prev.map(item => {
          if (item.id === editingId) {
            return {
              ...item,
              memberId: memberIdInput,
              jumlah: -Math.floor(inputAmount),
              tanggal: withdrawalTanggalInput,
              catatan: generatedCatatan
            };
          }
          return item;
        }));
        setIsEditing(false);
        setEditingId(null);
      } else {
        const total = selectedMemberBreakdown.total;
        if (total <= 0) {
          setWithdrawalErrorMsg('Anggota ini tidak memiliki saldo simpanan untuk dikembalikan.');
          return;
        }

        if (!window.confirm(`Yakin memproses penyelesaian keluar untuk ${selectedMemberName}? Seluruh saldo simpanan (${formatRupiah(total)}) akan dikembalikan dan saldo tabungan anggota ini akan menjadi nol.`)) {
          return;
        }

        const newTransactions: Simpanan[] = [];
        const baseId = Date.now();

        if (selectedMemberBreakdown.pokok > 0) {
          newTransactions.push({
            id: `s_${baseId}_p_${Math.random().toString(36).substring(2, 5)}`,
            memberId: memberIdInput,
            jenis: 'pokok',
            periode: 'Keluar',
            jumlah: -selectedMemberBreakdown.pokok,
            tanggal: withdrawalTanggalInput,
            catatan: `Pengembalian Simpanan Pokok (Penyelesaian Keluar) - ${selectedMemberName}`
          });
        }
        if (selectedMemberBreakdown.wajib > 0) {
          newTransactions.push({
            id: `s_${baseId}_w_${Math.random().toString(36).substring(2, 5)}`,
            memberId: memberIdInput,
            jenis: 'wajib',
            periode: 'Keluar',
            jumlah: -selectedMemberBreakdown.wajib,
            tanggal: withdrawalTanggalInput,
            catatan: `Pengembalian Simpanan Wajib (Penyelesaian Keluar) - ${selectedMemberName}`
          });
        }
        if (selectedMemberBreakdown.sukarela > 0) {
          newTransactions.push({
            id: `s_${baseId}_s_${Math.random().toString(36).substring(2, 5)}`,
            memberId: memberIdInput,
            jenis: 'sukarela',
            periode: 'Keluar',
            jumlah: -selectedMemberBreakdown.sukarela,
            tanggal: withdrawalTanggalInput,
            catatan: `Pengembalian Simpanan Sukarela (Penyelesaian Keluar) - ${selectedMemberName}`
          });
        }

        setSimpananList(prev => [...newTransactions, ...prev]);
      }
    }

    // Reset withdrawal inputs
    setWithdrawalJumlahInput('');
    setWithdrawalCatatanInput('');
    setWithdrawalErrorMsg('');
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string, memberName: string, amount: number) => {
    setDeleteConfirmId(id);
  };

  // Filtered ledger history list
  const filteredHistory = useMemo(() => {
    return simpananList.filter(s => {
      const member = anggotaList.find(m => m.id === s.memberId);
      const matchesSearch = member ? member.nama.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const matchesJenis = filterJenis === 'all' ? true : s.jenis === filterJenis;
      return matchesSearch && matchesJenis;
    });
  }, [simpananList, anggotaList, searchTerm, filterJenis]);

  // Subtotals per member
  const memberBalances = useMemo(() => {
    return anggotaList.map(member => {
      const breakdown = getMemberSavingsBreakdown(member.id, simpananList);
      const total = breakdown.pokok + breakdown.wajib + breakdown.sukarela;
      return {
        ...member,
        ...breakdown,
        total
      };
    }).sort((a, b) => b.total - a.total);
  }, [anggotaList, simpananList]);

  return (
    <div id="simpanan-view" className="space-y-6">
      
      {/* Top row: Entry Form (left) & Member balances subtotal sheet (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Entry form */}
        <div className="lg:col-span-5 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs h-fit">
          <div className="flex border-b border-beige-border pb-3 mb-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !isEditing && setFormTab('setoran')}
                disabled={isEditing}
                className={`text-xs font-brand uppercase tracking-wider font-bold py-1 px-2.5 rounded transition-all cursor-pointer ${
                  formTab === 'setoran'
                    ? 'bg-green-primary text-white shadow-xs'
                    : 'text-slate-500 hover:text-green-primary hover:bg-white/50'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Setoran
              </button>
              <button
                type="button"
                onClick={() => !isEditing && setFormTab('penarikan')}
                disabled={isEditing}
                className={`text-xs font-brand uppercase tracking-wider font-bold py-1 px-2.5 rounded transition-all cursor-pointer ${
                  formTab === 'penarikan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-amber-600 hover:bg-white/50'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Penarikan
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 normal-case tracking-normal font-sans font-medium cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Batal
                </button>
              )}
              <h3 className="text-xs font-semibold font-display text-slate-400 uppercase tracking-wider">
                {isEditing 
                  ? (formTab === 'setoran' ? 'Ubah Setoran' : 'Ubah Penarikan')
                  : (formTab === 'setoran' ? 'Catat Setoran (Simpanan)' : 'Catat Penarikan (Pengambilan)')}
              </h3>
            </div>
          </div>

          {isAdmin ? (
            <>
              {formTab === 'setoran' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-medium font-mono">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                      Anggota Penyetor:
                    </label>
                    <select
                      id="saving-member-select"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Anggota --</option>
                      {anggotaList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nama} ({m.jabatan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Jenis Setoran:
                      </label>
                      <select
                        id="saving-type-select"
                        value={jenisInput}
                        onChange={(e) => setJenisInput(e.target.value as JenisSimpanan)}
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                      >
                        <option value="pokok">Simpanan Pokok</option>
                        <option value="wajib">Simpanan Wajib</option>
                        <option value="sukarela">Simpanan Sukarela</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Periode / Bulan:
                      </label>
                      <input
                        id="saving-period-input"
                        type="text"
                        value={periodeInput}
                        onChange={(e) => setPeriodeInput(e.target.value)}
                        placeholder="Contoh: 2026-07 atau Awal"
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Jumlah Setoran (Rp):
                      </label>
                      <input
                        id="saving-amount-input"
                        type="number"
                        min="1"
                        value={jumlahInput}
                        onChange={(e) => setJumlahInput(e.target.value)}
                        placeholder="Contoh: 100000"
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                        required
                      />
                      {jumlahInput && !isNaN(Number(jumlahInput)) && (
                        <p className="text-[10px] text-green-primary font-semibold mt-1">
                          Terbaca: {formatRupiah(Number(jumlahInput))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Tanggal Pembayaran:
                      </label>
                      <input
                        id="saving-date-input"
                        type="date"
                        value={tanggalInput}
                        onChange={(e) => setTanggalInput(e.target.value)}
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                      Catatan / Keterangan:
                    </label>
                    <input
                      id="saving-note-input"
                      type="text"
                      value={catatanInput}
                      onChange={(e) => setCatatanInput(e.target.value)}
                      placeholder="Opsional - terisi otomatis jika kosong"
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full text-white font-brand font-semibold uppercase py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer ${
                      isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-primary hover:bg-green-primary/90'
                    }`}
                  >
                    <Coins className="h-4 w-4 text-gold-accent animate-pulse" /> {isEditing ? 'Simpan Perubahan Setoran' : 'Masukkan Buku Kas Simpanan'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  {withdrawalErrorMsg && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-medium font-mono">
                      {withdrawalErrorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                      Anggota Penarik:
                    </label>
                    <select
                      id="withdrawal-member-select"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Anggota --</option>
                      {anggotaList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nama} ({m.jabatan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                      Jenis Pengambilan:
                    </label>
                    <select
                      id="withdrawal-type-select"
                      value={withdrawalType}
                      onChange={(e) => setWithdrawalType(e.target.value as 'sukarela' | 'keluar')}
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                    >
                      <option value="sukarela">Pengambilan Simpanan Sukarela (Anggota Aktif)</option>
                      <option value="keluar">Pengembalian/Penyelesaian Simpanan Anggota Keluar</option>
                    </select>
                  </div>

                  {memberIdInput && (
                    <div className="p-3 bg-cream-bg rounded border border-beige-border text-xs text-slate-700">
                      <span className="font-bold text-green-primary uppercase tracking-wider text-[10px] block mb-1">Status Saldo Tabungan Anggota:</span>
                      <ul className="space-y-0.5 font-mono text-[10px]">
                        <li className="flex justify-between">
                          <span>Simpanan Pokok:</span>
                          <span className="font-bold text-gold-accent">{formatRupiah(selectedMemberBreakdown.pokok)}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Simpanan Wajib:</span>
                          <span className="font-bold text-green-primary">{formatRupiah(selectedMemberBreakdown.wajib)}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Simpanan Sukarela:</span>
                          <span className="font-bold text-amber-700">{formatRupiah(selectedMemberBreakdown.sukarela)}</span>
                        </li>
                        <li className="flex justify-between border-t border-beige-border pt-1 mt-1 font-bold text-green-primary text-xs">
                          <span>Total Saldo:</span>
                          <span>{formatRupiah(selectedMemberBreakdown.total)}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Jumlah Penarikan (Rp):
                      </label>
                      <input
                        id="withdrawal-amount-input"
                        type="number"
                        min="1"
                        value={withdrawalJumlahInput}
                        onChange={(e) => setWithdrawalJumlahInput(e.target.value)}
                        disabled={withdrawalType === 'keluar'}
                        placeholder={withdrawalType === 'keluar' ? String(selectedMemberBreakdown.total) : "Contoh: 100000"}
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        required
                      />
                      {withdrawalJumlahInput && !isNaN(Number(withdrawalJumlahInput)) && (
                        <p className="text-[10px] text-green-primary font-semibold mt-1">
                          Terbaca: {formatRupiah(Number(withdrawalJumlahInput))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                        Tanggal Transaksi:
                      </label>
                      <input
                        id="withdrawal-date-input"
                        type="date"
                        value={withdrawalTanggalInput}
                        onChange={(e) => setWithdrawalTanggalInput(e.target.value)}
                        className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                      Catatan / Keterangan:
                    </label>
                    <input
                      id="withdrawal-note-input"
                      type="text"
                      value={withdrawalCatatanInput}
                      onChange={(e) => setWithdrawalCatatanInput(e.target.value)}
                      placeholder="Opsional - terisi otomatis jika kosong"
                      className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full text-white font-brand font-semibold uppercase py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer ${
                      isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-primary hover:bg-green-primary/90'
                    }`}
                  >
                    <Coins className="h-4 w-4 text-gold-accent animate-pulse" /> {isEditing ? 'Simpan Perubahan Penarikan' : 'Masukkan Buku Kas Penarikan'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="bg-cream-bg text-slate-800 p-4 rounded-lg border border-beige-border text-xs space-y-2">
              <AlertTriangle className="h-5 w-5 text-gold-accent mb-1 animate-bounce" />
              <p className="font-semibold font-brand text-green-primary uppercase tracking-wider">Mode Terbatas (Read-Only)</p>
              <p className="leading-relaxed text-slate-600">
                Anda login sebagai <span className="font-bold uppercase text-green-primary">{currentUserRole === 'anggota' ? 'Anggota' : 'Tamu'}</span>. Pencatatan transaksi simpanan/penarikan baru hanya bisa diinput oleh <span className="font-bold text-gold-accent">Admin</span>.
              </p>
            </div>
          )}
        </div>

        {/* Member balances subtotal list */}
        <div className="lg:col-span-7 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3 mb-4 uppercase tracking-wider">
              <Calculator className="h-5 w-5 text-gold-accent" />
              Rekapitulasi Saldo Buku Tabungan Anggota
            </h3>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
              Lembar buku pembantu kas yang merangkum saldo terkini dari seluruh jenis simpanan per anggota.
            </p>
          </div>

          <div className="overflow-x-auto border border-beige-border rounded-lg max-h-[360px] overflow-y-auto">
            <table className="min-w-full divide-y border-collapse divide-beige-border">
              <thead className="bg-cream-bg text-gold-accent text-[10px] font-sans uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold border-b border-r border-beige-border">Nama Anggota</th>
                  <th className="px-2 py-2.5 text-right font-bold border-b border-r border-beige-border">S. Pokok</th>
                  <th className="px-2 py-2.5 text-right font-bold border-b border-r border-beige-border">S. Wajib</th>
                  <th className="px-2 py-2.5 text-right font-bold border-b border-r border-beige-border">S. Sukarela</th>
                  <th className="px-3 py-2.5 text-right font-bold border-b bg-green-primary/5 text-green-primary">Saldo Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-beige-border text-[11px] font-mono">
                {memberBalances.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-bg transition-all border-b border-beige-border">
                    <td className="px-3 py-2.5 font-serif italic text-xs font-semibold text-green-primary border-r border-beige-border">
                      {item.nama}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gold-accent border-r border-beige-border">
                      {formatRupiah(item.pokok)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-green-primary border-r border-beige-border">
                      {formatRupiah(item.wajib)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-amber-700 border-r border-beige-border">
                      {formatRupiah(item.sukarela)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-green-primary bg-green-primary/5">
                      {formatRupiah(item.total)}
                    </td>
                  </tr>
                ))}
                {memberBalances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                      Belum ada data anggota terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-cream-bg p-2.5 rounded border border-beige-border text-[10px] text-slate-600 mt-4 leading-relaxed font-sans">
            💡 <span className="font-semibold text-green-primary uppercase tracking-wider">Petunjuk Transparansi:</span> Klik tombol peran <span className="font-semibold text-gold-accent">"Anggota"</span> di bar atas dan pilih nama Anda untuk melihat filter personal di rincian SHU dan simpanan Anda.
          </div>
        </div>
      </div>

      {/* Bottom ledger list: Transaction Ledger History */}
      <div className="bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-beige-border pb-3 mb-4">
          <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 uppercase tracking-wider">
            <History className="h-5 w-5 text-gold-accent" />
            Buku Jurnal Riwayat Transaksi Setoran Simpanan
          </h3>

          {/* Search and filter controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="saving-search-input"
                type="text"
                placeholder="Cari nama anggota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-beige-border rounded pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
              />
            </div>

            {/* Filter select */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                id="saving-filter-select"
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="bg-white border border-beige-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-primary"
              >
                <option value="all">Semua Jenis</option>
                <option value="pokok">Hanya Pokok</option>
                <option value="wajib">Hanya Wajib</option>
                <option value="sukarela">Hanya Sukarela</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border border-beige-border rounded-lg">
          <table className="min-w-full divide-y border-collapse divide-beige-border">
            <thead className="bg-cream-bg text-gold-accent text-xs font-sans uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border w-32">Tanggal</th>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Nama Anggota</th>
                <th className="px-3 py-3 text-center font-bold border-b border-r border-beige-border">Jenis</th>
                <th className="px-3 py-3 text-center font-bold border-b border-r border-beige-border w-24">Periode</th>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Keterangan / Catatan</th>
                <th className="px-4 py-3 text-right font-bold border-b border-beige-border w-36">Jumlah (Rp)</th>
                {isAdmin && <th className="px-3 py-3 text-center font-bold border-b w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-beige-border text-xs">
              {filteredHistory.map((s) => {
                const member = anggotaList.find(m => m.id === s.memberId);
                const isPersonalHighlight = currentUserRole === 'anggota' && s.memberId === memberIdInput;
                return (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-cream-bg transition-all border-b border-beige-border ${
                      isPersonalHighlight ? 'bg-cream-bg/60 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap border-r border-beige-border">
                      {s.tanggal}
                    </td>
                    <td className="px-4 py-3 font-serif italic text-green-primary border-r border-beige-border text-sm">
                      {member ? member.nama : <span className="text-red-500 font-sans italic">Anggota Terhapus</span>}
                    </td>
                    <td className="px-3 py-3 text-center border-r border-beige-border">
                      <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                        s.jenis === 'pokok' 
                          ? 'bg-cream-bg text-gold-accent border border-beige-border' 
                          : s.jenis === 'wajib'
                          ? 'bg-green-primary/10 text-green-primary border border-green-primary/20'
                          : 'bg-yellow-accent/10 text-gold-accent border border-beige-border'
                      }`}>
                        {s.jenis}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium text-slate-600 border-r border-beige-border">
                      {s.periode}
                    </td>
                    <td className="px-4 py-3 text-slate-600 italic border-r border-beige-border">
                      {s.catatan || '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      s.jumlah < 0 ? 'text-red-600' : 'text-green-primary'
                    }`}>
                      {formatRupiah(s.jumlah)}
                    </td>
                    
                    {isAdmin && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`edit-trans-${s.id}`}
                            onClick={() => handleStartEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-green-primary bg-slate-50 hover:bg-green-primary/10 border border-beige-border hover:border-green-primary/30 rounded transition-all cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`delete-trans-${s.id}`}
                            onClick={() => handleDeleteTransaction(s.id, member?.nama || 'Unknown', s.jumlah)}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-beige-border hover:border-red-300 rounded transition-all cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                    <FolderDot className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Belum ada transaksi simpanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && deleteTargetDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-cream-card border-2 border-beige-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold font-display text-red-600 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 animate-bounce text-red-600" />
              Konfirmasi Hapus Transaksi
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus transaksi {deleteTargetDetails.amount < 0 ? 'penarikan' : 'setoran'} senilai <strong className="text-gold-accent">{formatRupiah(Math.abs(deleteTargetDetails.amount))}</strong> atas nama <strong className="text-green-primary">"{deleteTargetDetails.name}"</strong>? 
              Tindakan ini tidak dapat dibatalkan.
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
                    setSimpananList(prev => prev.filter(s => s.id !== deleteConfirmId));
                    setDeleteConfirmId(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer"
              >
                Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
