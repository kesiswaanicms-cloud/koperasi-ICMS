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
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckSquare,
  Square,
  Check,
  CheckCircle
} from 'lucide-react';
import { Simpanan, Anggota, JenisSimpanan } from '../types';
import { formatRupiah, getMemberSavingsBreakdown } from '../utils/format';
import { 
  downloadCsv, 
  generateSavingsCsvTemplate, 
  parseSavingsCsv, 
  ParsedSavingsRow 
} from '../utils/csvHelpers';

interface ManageSavingsProps {
  simpananList: Simpanan[];
  setSimpananList: React.Dispatch<React.SetStateAction<Simpanan[]>>;
  anggotaList: Anggota[];
  currentUserRole: 'admin' | 'anggota' | 'guest';
}

export default function ManageSavings({
  simpananList,
  setSimpananList,
  anggotaList = [],
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

  // Bulk Input Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActiveTab, setBulkActiveTab] = useState<'grid' | 'csv'>('grid');
  const [bulkJenis, setBulkJenis] = useState<JenisSimpanan>('wajib');
  const [bulkPeriode, setBulkPeriode] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bulkTanggal, setBulkTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkDefaultAmount, setBulkDefaultAmount] = useState('50000');
  const [bulkGridRows, setBulkGridRows] = useState<Record<string, { selected: boolean; amount: string; note: string }>>({});
  
  // CSV Import state
  const [csvParsedRows, setCsvParsedRows] = useState<ParsedSavingsRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Open Bulk Modal
  const handleOpenBulkModal = () => {
    setIsBulkModalOpen(true);
    setBulkSuccessMsg('');
    const initialRows: Record<string, { selected: boolean; amount: string; note: string }> = {};
    (anggotaList || []).forEach(member => {
      if (member && member.id) {
        initialRows[member.id] = {
          selected: true,
          amount: bulkDefaultAmount || '50000',
          note: `Setoran ${bulkJenis} (${bulkPeriode})`
        };
      }
    });
    setBulkGridRows(initialRows);
    setCsvParsedRows([]);
    setCsvFileName('');
  };

  // Apply default amount to all selected grid rows
  const handleApplyDefaultAmount = () => {
    setBulkGridRows(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = {
          ...next[id],
          amount: bulkDefaultAmount || '0',
          note: `Setoran ${bulkJenis} (${bulkPeriode})`
        };
      });
      return next;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = (select: boolean) => {
    setBulkGridRows(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], selected: select };
      });
      return next;
    });
  };

  // Submit Grid Bulk Transaction
  const handleProcessBulkGrid = () => {
    const selectedEntries = Object.entries(bulkGridRows).filter(([_, data]) => data && data.selected);
    if (selectedEntries.length === 0) {
      alert('Pilih setidaknya 1 anggota untuk diproses.');
      return;
    }

    const newTransactions: Simpanan[] = [];
    const now = Date.now();
    let index = 0;

    for (const [memberId, data] of selectedEntries) {
      const amtStr = String(data?.amount || '0').replace(/[^0-9]/g, '');
      const amt = parseInt(amtStr, 10) || 0;
      if (amt <= 0) continue;

      const memberName = (anggotaList || []).find(m => m.id === memberId)?.nama || '';
      const noteStr = String(data?.note || '').trim();
      newTransactions.push({
        id: `s_bulk_${now}_${index++}_${Math.random().toString(36).substring(2, 6)}`,
        memberId,
        jenis: bulkJenis,
        periode: bulkPeriode,
        jumlah: amt,
        tanggal: bulkTanggal,
        catatan: noteStr || `Setoran ${bulkJenis} - ${memberName} (${bulkPeriode})`
      });
    }

    if (newTransactions.length === 0) {
      alert('Tidak ada transaksi dengan nominal valid (> 0).');
      return;
    }

    setSimpananList(prev => [...newTransactions, ...prev]);
    setBulkSuccessMsg(`Berhasil menambahkan ${newTransactions.length} simpanan secara massal!`);
    setTimeout(() => {
      setIsBulkModalOpen(false);
      setBulkSuccessMsg('');
    }, 1200);
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseSavingsCsv(text, anggotaList);
        setCsvParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Submit CSV Bulk Transaction
  const handleProcessCsvImport = () => {
    const validRows = csvParsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada baris data CSV yang valid untuk diimport.');
      return;
    }

    const now = Date.now();
    const newTransactions: Simpanan[] = validRows.map((r, index) => ({
      id: `s_csv_${now}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      memberId: r.memberId,
      jenis: r.jenis,
      periode: r.periode,
      jumlah: r.jumlah,
      tanggal: r.tanggal,
      catatan: r.catatan || `Import Simpanan ${r.jenis} (${r.periode})`
    }));

    setSimpananList(prev => [...newTransactions, ...prev]);
    setBulkSuccessMsg(`Berhasil mengimpor ${newTransactions.length} transaksi simpanan dari CSV!`);
    setTimeout(() => {
      setIsBulkModalOpen(false);
      setBulkSuccessMsg('');
    }, 1200);
  };

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
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenBulkModal}
                  className="bg-gold-accent hover:bg-gold-accent/90 text-white font-brand text-xs uppercase tracking-wider font-semibold py-1 px-2.5 rounded shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Input Massal
                </button>
              )}
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

      {/* Bulk Input Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-cream-card border-2 border-beige-border rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-cream-bg p-4 border-b border-beige-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-primary text-white rounded-lg shadow-xs">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-green-primary uppercase tracking-wider">
                    Input Massal (Bulk Input) Simpanan Anggota
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Catat setoran simpanan untuk seluruh atau banyak anggota sekaligus secara efisien.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-beige-border bg-cream-card shrink-0 px-4 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkActiveTab('grid')}
                className={`px-4 py-2 text-xs font-brand uppercase tracking-wider font-bold rounded-t-lg transition-all cursor-pointer border-b-2 ${
                  bulkActiveTab === 'grid'
                    ? 'border-green-primary text-green-primary bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Form Grid Massal (Rekomendasi)
              </button>
              <button
                type="button"
                onClick={() => setBulkActiveTab('csv')}
                className={`px-4 py-2 text-xs font-brand uppercase tracking-wider font-bold rounded-t-lg transition-all cursor-pointer border-b-2 ${
                  bulkActiveTab === 'csv'
                    ? 'border-green-primary text-green-primary bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📥 Upload & Import CSV
              </button>
            </div>

            {/* Success notification */}
            {bulkSuccessMsg && (
              <div className="bg-green-100 border-b border-green-300 text-green-800 px-4 py-2.5 text-xs font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                {bulkSuccessMsg}
              </div>
            )}

            {/* Modal Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {bulkActiveTab === 'grid' ? (
                <>
                  {/* Global settings bar */}
                  <div className="bg-white border border-beige-border rounded-lg p-3.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                          Jenis Simpanan:
                        </label>
                        <select
                          value={bulkJenis}
                          onChange={(e) => setBulkJenis(e.target.value as JenisSimpanan)}
                          className="w-full bg-cream-bg border border-beige-border rounded px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-green-primary focus:outline-none"
                        >
                          <option value="wajib">Simpanan Wajib</option>
                          <option value="pokok">Simpanan Pokok</option>
                          <option value="sukarela">Simpanan Sukarela</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                          Periode / Bulan:
                        </label>
                        <input
                          type="month"
                          value={bulkPeriode}
                          onChange={(e) => setBulkPeriode(e.target.value)}
                          className="w-full bg-cream-bg border border-beige-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-green-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                          Tanggal Transaksi:
                        </label>
                        <input
                          type="date"
                          value={bulkTanggal}
                          onChange={(e) => setBulkTanggal(e.target.value)}
                          className="w-full bg-cream-bg border border-beige-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-green-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-brand uppercase tracking-wider font-semibold text-green-primary mb-1">
                          Nominal Default (Rp):
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={bulkDefaultAmount}
                            onChange={(e) => setBulkDefaultAmount(e.target.value)}
                            placeholder="50000"
                            className="w-full bg-cream-bg border border-beige-border rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-green-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDefaultAmount}
                            className="bg-green-primary hover:bg-green-primary/90 text-white text-[11px] font-brand uppercase tracking-wider font-semibold px-2 py-1.5 rounded transition-all shrink-0 cursor-pointer"
                          >
                            Terapkan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAll(true)}
                          className="text-green-primary hover:underline text-[11px] font-medium cursor-pointer"
                        >
                          Centang Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAll(false)}
                          className="text-slate-500 hover:underline text-[11px] font-medium cursor-pointer"
                        >
                          Batal Centang
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {Object.values(bulkGridRows).filter(r => r.selected).length} dari {anggotaList.length} Anggota Dipilih
                      </p>
                    </div>
                  </div>

                  {/* Grid Table */}
                  <div className="border border-beige-border rounded-lg max-h-[320px] overflow-y-auto bg-white">
                    <table className="min-w-full divide-y divide-beige-border text-xs">
                      <thead className="bg-cream-bg text-gold-accent sticky top-0 z-10 text-[10px] font-sans uppercase">
                        <tr>
                          <th className="p-2 text-center w-10 border-b border-r border-beige-border">Pilih</th>
                          <th className="p-2 text-left font-bold border-b border-r border-beige-border">Nama Anggota</th>
                          <th className="p-2 text-left font-bold border-b border-r border-beige-border w-24">Jabatan</th>
                          <th className="p-2 text-left font-bold border-b border-r border-beige-border w-44">Jumlah Simpanan (Rp)</th>
                          <th className="p-2 text-left font-bold border-b border-beige-border">Catatan Transaksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-beige-border text-xs">
                        {(anggotaList || []).map((member) => {
                          const row = bulkGridRows[member.id] || { selected: true, amount: bulkDefaultAmount || '50000', note: '' };
                          const isSel = Boolean(row?.selected);
                          const numAmt = parseInt(String(row?.amount || '0').replace(/[^0-9]/g, ''), 10) || 0;

                          return (
                            <tr key={member.id} className={`hover:bg-cream-bg transition-colors ${isSel ? 'bg-white' : 'bg-slate-50/70 opacity-60'}`}>
                              <td className="p-2 text-center border-r border-beige-border">
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={(e) => {
                                    setBulkGridRows(prev => ({
                                      ...prev,
                                      [member.id]: { ...row, selected: e.target.checked }
                                    }));
                                  }}
                                  className="h-4 w-4 text-green-primary border-beige-border rounded focus:ring-green-primary cursor-pointer"
                                />
                              </td>
                              <td className="p-2 font-serif italic text-slate-800 font-semibold border-r border-beige-border">
                                {member.nama}
                              </td>
                              <td className="p-2 border-r border-beige-border text-[11px] text-slate-500">
                                {member.jabatan}
                              </td>
                              <td className="p-2 border-r border-beige-border">
                                <input
                                  type="number"
                                  value={row.amount}
                                  disabled={!isSel}
                                  onChange={(e) => {
                                    setBulkGridRows(prev => ({
                                      ...prev,
                                      [member.id]: { ...row, amount: e.target.value }
                                    }));
                                  }}
                                  className="w-full bg-white border border-beige-border rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-green-primary focus:outline-none disabled:bg-slate-100"
                                />
                                {numAmt > 0 && isSel && (
                                  <span className="text-[10px] text-green-primary font-mono block mt-0.5">
                                    {formatRupiah(numAmt)}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.note}
                                  disabled={!isSel}
                                  onChange={(e) => {
                                    setBulkGridRows(prev => ({
                                      ...prev,
                                      [member.id]: { ...row, note: e.target.value }
                                    }));
                                  }}
                                  placeholder={`Setoran ${bulkJenis} (${bulkPeriode})`}
                                  className="w-full bg-white border border-beige-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-green-primary focus:outline-none disabled:bg-slate-100"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  {/* CSV Mode */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-beige-border rounded-lg p-4 gap-3">
                      <div>
                        <h4 className="text-xs font-bold font-brand text-green-primary uppercase tracking-wider mb-1">
                          1. Unduh Template CSV Anggota
                        </h4>
                        <p className="text-xs text-slate-500 font-sans">
                          File CSV akan otomatis terisi daftar nama dan ID seluruh {anggotaList.length} anggota terdaftar.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const csvText = generateSavingsCsvTemplate(anggotaList, bulkJenis, bulkPeriode, bulkTanggal);
                          downloadCsv(`Template_Simpanan_${bulkJenis}_${bulkPeriode}.csv`, csvText);
                        }}
                        className="bg-green-primary hover:bg-green-primary/90 text-white text-xs font-brand uppercase tracking-wider font-semibold px-3 py-2 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="h-4 w-4" />
                        Unduh Template CSV
                      </button>
                    </div>

                    <div className="bg-white border border-beige-border rounded-lg p-4">
                      <h4 className="text-xs font-bold font-brand text-green-primary uppercase tracking-wider mb-2">
                        2. Unggah File CSV yang Telah Diisi
                      </h4>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-primary/10 file:text-green-primary hover:file:bg-green-primary/20 cursor-pointer"
                      />
                      {csvFileName && (
                        <p className="text-xs text-slate-600 mt-2 font-mono">
                          📁 File terpilih: <span className="font-semibold">{csvFileName}</span> ({csvParsedRows.length} baris data)
                        </p>
                      )}
                    </div>

                    {/* Preview Table */}
                    {csvParsedRows.length > 0 && (
                      <div className="border border-beige-border rounded-lg max-h-[260px] overflow-y-auto bg-white">
                        <table className="min-w-full divide-y divide-beige-border text-xs">
                          <thead className="bg-cream-bg text-gold-accent sticky top-0 z-10 text-[10px] font-sans uppercase">
                            <tr>
                              <th className="p-2 text-center w-16">Status</th>
                              <th className="p-2 text-left">Nama Anggota</th>
                              <th className="p-2 text-left">Jenis</th>
                              <th className="p-2 text-left">Periode</th>
                              <th className="p-2 text-right">Jumlah (Rp)</th>
                              <th className="p-2 text-left">Tanggal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-beige-border text-xs">
                            {csvParsedRows.map((r, idx) => (
                              <tr key={idx} className={r.isValid ? 'hover:bg-cream-bg' : 'bg-red-50'}>
                                <td className="p-2 text-center">
                                  {r.isValid ? (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">Valid</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded" title={r.errorMsg}>Error</span>
                                  )}
                                </td>
                                <td className="p-2 font-serif italic">{r.namaMember}</td>
                                <td className="p-2 uppercase text-[10px] font-bold text-slate-600">{r.jenis}</td>
                                <td className="p-2 font-mono text-[11px]">{r.periode}</td>
                                <td className="p-2 text-right font-mono font-semibold text-green-primary">{formatRupiah(r.jumlah)}</td>
                                <td className="p-2 font-mono text-[11px]">{r.tanggal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-cream-bg p-4 border-t border-beige-border flex justify-between items-center shrink-0">
              <div className="text-xs font-mono text-slate-700">
                {bulkActiveTab === 'grid' ? (
                  <span>
                    Total Diproses: <strong className="text-green-primary">{Object.values(bulkGridRows).filter(r => r && r.selected && (parseInt(String(r.amount || '0').replace(/[^0-9]/g, ''), 10) > 0)).length} Transaksi</strong> 
                    ({formatRupiah(Object.values(bulkGridRows).filter(r => r && r.selected).reduce((sum, r) => sum + (parseInt(String(r?.amount || '0').replace(/[^0-9]/g, ''), 10) || 0), 0))})
                  </span>
                ) : (
                  <span>
                    Baris Valid CSV: <strong className="text-green-primary">{csvParsedRows.filter(r => r.isValid).length} Transaksi</strong>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-beige-border text-slate-700 font-brand text-xs uppercase tracking-wider font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>

                {bulkActiveTab === 'grid' ? (
                  <button
                    type="button"
                    onClick={handleProcessBulkGrid}
                    className="px-4 py-2 bg-green-primary hover:bg-green-primary/90 text-white font-brand text-xs uppercase tracking-wider font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Proses Input Massal
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={csvParsedRows.filter(r => r.isValid).length === 0}
                    onClick={handleProcessCsvImport}
                    className="px-4 py-2 bg-green-primary hover:bg-green-primary/90 disabled:bg-slate-300 text-white font-brand text-xs uppercase tracking-wider font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Eksekusi Import CSV
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
