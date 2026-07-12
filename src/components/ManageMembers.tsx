/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  UserCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Anggota } from '../types';

interface ManageMembersProps {
  anggotaList: Anggota[];
  setAnggotaList: React.Dispatch<React.SetStateAction<Anggota[]>>;
  currentUserRole: 'admin' | 'anggota' | 'guest';
}

export default function ManageMembers({ 
  anggotaList, 
  setAnggotaList, 
  currentUserRole 
}: ManageMembersProps) {
  const isAdmin = currentUserRole === 'admin';

  // State for Form Add/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [namaInput, setNamaInput] = useState('');
  const [jabatanInput, setJabatanInput] = useState<'Anggota' | 'Pengurus'>('Anggota');
  const [bobotInput, setBobotInput] = useState<number>(0);

  // Validation state
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Form submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaInput.trim()) {
      setErrorMsg('Nama anggota tidak boleh kosong.');
      return;
    }

    const cleanedBobot = jabatanInput === 'Anggota' ? 0 : Number(bobotInput);
    if (cleanedBobot < 0 || cleanedBobot > 100) {
      setErrorMsg('Bobot pengurus harus bernilai antara 0 sampai 100.');
      return;
    }

    if (isEditing && editingId) {
      // Edit
      setAnggotaList(prev => prev.map(m => {
        if (m.id === editingId) {
          return {
            ...m,
            nama: namaInput.trim(),
            jabatan: jabatanInput,
            bobotPengurus: cleanedBobot
          };
        }
        return m;
      }));
      setIsEditing(false);
      setEditingId(null);
    } else {
      // Add
      const newId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newMember: Anggota = {
        id: newId,
        nama: namaInput.trim(),
        jabatan: jabatanInput,
        bobotPengurus: cleanedBobot
      };
      setAnggotaList(prev => [...prev, newMember]);
    }

    // Reset inputs
    setNamaInput('');
    setJabatanInput('Anggota');
    setBobotInput(0);
  };

  // Start edit flow
  const handleStartEdit = (member: Anggota) => {
    setIsEditing(true);
    setEditingId(member.id);
    setNamaInput(member.nama);
    setJabatanInput(member.jabatan);
    setBobotInput(member.bobotPengurus);
    setErrorMsg('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNamaInput('');
    setJabatanInput('Anggota');
    setBobotInput(0);
    setErrorMsg('');
  };

  // Delete member
  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus anggota "${name}"? Seluruh data simpanannya di subtotal juga akan terpengaruh.`)) {
      setAnggotaList(prev => prev.filter(m => m.id !== id));
    }
  };

  // Summary counts
  const totalBobot = anggotaList
    .filter(m => m.jabatan === 'Pengurus')
    .reduce((sum, m) => sum + m.bobotPengurus, 0);

  return (
    <div id="anggota-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Form Column - Left (Only shown/enabled for admin) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs">
          <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3 mb-4 uppercase tracking-wider">
            <UserPlus className="h-5 w-5 text-green-primary" />
            {isEditing ? 'Ubah Data Anggota' : 'Daftarkan Anggota'}
          </h3>

          {isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded font-medium font-mono">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1.5">
                  Nama Lengkap:
                </label>
                <input
                  id="member-name-input"
                  type="text"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full bg-white border border-beige-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-green-primary focus:border-green-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary mb-1.5">
                  Jabatan Koperasi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="role-option-anggota"
                    type="button"
                    onClick={() => {
                      setJabatanInput('Anggota');
                      setBobotInput(0);
                    }}
                    className={`py-2 text-xs font-semibold rounded border transition-all ${
                      jabatanInput === 'Anggota'
                        ? 'bg-green-primary text-white border-green-primary'
                        : 'bg-white text-slate-600 border-beige-border hover:bg-cream-bg'
                    }`}
                  >
                    Anggota Biasa
                  </button>
                  <button
                    id="role-option-pengurus"
                    type="button"
                    onClick={() => setJabatanInput('Pengurus')}
                    className={`py-2 text-xs font-semibold rounded border transition-all ${
                      jabatanInput === 'Pengurus'
                        ? 'bg-green-primary text-white border-green-primary'
                        : 'bg-white text-slate-600 border-beige-border hover:bg-cream-bg'
                    }`}
                  >
                    Pengurus Koperasi
                  </button>
                </div>
              </div>

              {jabatanInput === 'Pengurus' && (
                <div className="bg-cream-bg p-3.5 rounded border border-beige-border animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-green-primary">
                      Bobot Pembagian SHU (%):
                    </label>
                    <span className="font-mono text-xs font-bold text-green-primary bg-white px-2 py-0.5 rounded border border-beige-border">
                      {bobotInput} %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                    Proporsi andil kerja pengurus dalam manajemen untuk pembagian pool porsi jasa pengurus.
                  </p>
                  <input
                    id="member-weight-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={bobotInput}
                    onChange={(e) => setBobotInput(Number(e.target.value))}
                    className="w-full accent-green-primary"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>0% (Min)</span>
                    <span>50%</span>
                    <span>100% (Maks)</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold uppercase py-2.5 rounded transition-all flex items-center justify-center gap-1 font-brand"
                  >
                    <X className="h-4 w-4" /> Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-green-primary hover:bg-green-primary/90 text-white text-xs font-semibold uppercase py-2.5 rounded transition-all shadow-sm flex items-center justify-center gap-1 font-brand"
                >
                  <Check className="h-4 w-4" /> {isEditing ? 'Simpan' : 'Daftarkan'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-cream-bg text-slate-800 p-4 rounded-lg border border-beige-border text-xs space-y-2">
              <AlertTriangle className="h-5 w-5 text-gold-accent mb-1 animate-bounce" />
              <p className="font-semibold font-brand text-green-primary uppercase tracking-wider">Mode Terbatas (Read-Only)</p>
              <p className="leading-relaxed text-slate-600">
                Anda login sebagai <span className="font-bold uppercase text-green-primary">{currentUserRole === 'anggota' ? 'Anggota' : 'Tamu'}</span>. Pendaftaran dan perubahan data pengurus hanya bisa dilakukan oleh <span className="font-bold text-gold-accent">Admin</span>.
              </p>
            </div>
          )}
        </div>

        {/* Informational card on totals */}
        <div className="bg-cream-card border-2 border-beige-border rounded-xl p-4 font-sans text-xs text-slate-600">
          <h4 className="font-semibold text-green-primary mb-2 font-brand uppercase tracking-wider text-[11px]">Ringkasan Statistik Anggota</h4>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between border-b border-dashed border-beige-border/50 pb-1">
              <span className="font-sans text-slate-500">Total Anggota:</span>
              <span className="font-bold text-green-primary">{anggotaList.length} orang</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-beige-border/50 pb-1">
              <span className="font-sans text-slate-500">Pengurus Aktif:</span>
              <span className="font-bold text-green-primary">{anggotaList.filter(m => m.jabatan === 'Pengurus').length} orang</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-sans text-slate-500">Total Akumulasi Bobot:</span>
              <span className="font-bold text-gold-accent">{totalBobot} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Members List Table - Right */}
      <div className="lg:col-span-8 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-semibold font-display text-green-primary flex items-center gap-2 border-b border-beige-border pb-3 mb-4 uppercase tracking-wider">
          <Users className="h-5 w-5 text-gold-accent" />
          Daftar Buku Induk Anggota Koperasi
        </h3>

        <div className="overflow-x-auto border border-beige-border rounded-lg">
          <table className="min-w-full divide-y border-collapse divide-beige-border">
            <thead className="bg-cream-bg text-gold-accent text-xs font-sans uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-b border-r border-beige-border">Anggota</th>
                <th className="px-4 py-3 text-center font-bold border-b border-r border-beige-border">Jabatan</th>
                <th className="px-4 py-3 text-center font-bold border-b border-r border-beige-border">Bobot Kerja SHU</th>
                {isAdmin && <th className="px-4 py-3 text-center font-bold border-b border-beige-border w-24">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-beige-border text-xs">
              {anggotaList.map((member) => (
                <tr key={member.id} className="hover:bg-cream-bg transition-all border-b border-beige-border">
                  <td className="px-4 py-3 border-r border-beige-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-cream-bg p-1.5 rounded-full text-gold-accent border border-beige-border/50">
                        <UserCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-green-primary font-brand text-sm">{member.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-beige-border">
                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase font-brand ${
                      member.jabatan === 'Pengurus' 
                        ? 'bg-green-primary/10 text-green-primary border border-green-primary/20' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {member.jabatan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono border-r border-beige-border">
                    {member.jabatan === 'Pengurus' ? (
                      <span className="font-bold text-green-primary bg-green-primary/5 px-2 py-0.5 rounded border border-green-primary/10">
                        {member.bobotPengurus}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          id={`edit-member-${member.id}`}
                          onClick={() => handleStartEdit(member)}
                          className="p-1.5 text-slate-600 hover:text-green-primary bg-slate-50 hover:bg-cream-bg rounded border border-beige-border hover:border-green-primary transition-all cursor-pointer"
                          title="Ubah Anggota"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-member-${member.id}`}
                          onClick={() => handleDeleteMember(member.id, member.nama)}
                          className="p-1.5 text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded border border-beige-border hover:border-red-300 transition-all cursor-pointer"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {anggotaList.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-400">
                    Belum ada anggota yang terdaftar di sistem.
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
