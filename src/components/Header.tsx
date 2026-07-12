/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Eye, RefreshCw, Landmark, BookOpen } from 'lucide-react';
import { Anggota } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole: 'admin' | 'anggota' | 'guest';
  setCurrentUserRole: (role: 'admin' | 'anggota' | 'guest') => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  anggotaList: Anggota[];
  onSync: () => void;
  isSyncing: boolean;
}

export default function Header({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
  selectedMemberId,
  setSelectedMemberId,
  anggotaList,
  onSync,
  isSyncing
}: HeaderProps) {
  const [pinInput, setPinInput] = useState('');
  const [showPinError, setShowPinError] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Buku Kas / Utama' },
    { id: 'anggota', label: 'Buku Anggota' },
    { id: 'simpanan', label: 'Ledger Simpanan' },
    { id: 'laba', label: 'Laba Usaha' },
    { id: 'shu', label: 'Kalkulator SHU' }
  ];

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple secure PIN matching: admin123
    if (pinInput === 'admin123' || pinInput === '12345') {
      setCurrentUserRole('admin');
      setIsPinModalOpen(false);
      setPinInput('');
      setShowPinError(false);
    } else {
      setShowPinError(true);
    }
  };

  const handleRoleChange = (role: 'admin' | 'anggota' | 'guest') => {
    if (role === 'admin') {
      setIsPinModalOpen(true);
    } else {
      setCurrentUserRole(role);
      if (role === 'anggota' && anggotaList.length > 0 && !selectedMemberId) {
        setSelectedMemberId(anggotaList[0].id);
      }
    }
  };

  return (
    <header id="app-header" className="bg-green-primary text-white shadow-xl border-b-4 border-gold-accent">
      {/* Top Identity bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-cream-bg p-2.5 rounded-lg shadow-inner border border-gold-accent">
            <Landmark className="h-9 w-9 text-green-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] bg-gold-accent text-white font-bold px-2 py-0.5 rounded uppercase font-brand">
                Koperasi Sekolah
              </span>
              <span className="text-[10px] font-mono bg-green-primary/60 text-yellow-accent px-2 py-0.5 rounded border border-beige-border/20">
                Sistem Real-Time v1.0
              </span>
            </div>
            <h1 className="text-2xl font-semibold font-display tracking-tight text-yellow-accent">
              Koperasi ICMS <span className="text-sm font-sans font-normal text-beige-border/90 block sm:inline sm:ml-2">| Transparansi & Keuangan</span>
            </h1>
          </div>
        </div>

        {/* Access Rights Control Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-green-primary/50 p-2.5 rounded-lg border border-beige-border/30 w-full md:w-auto">
          <span className="text-xs font-medium text-yellow-accent font-brand uppercase tracking-wider block w-full mb-1 sm:mb-0 sm:w-auto sm:mr-1">
            Hak Akses:
          </span>
          
          <div className="flex rounded-md shadow-sm w-full sm:w-auto">
            {/* Guest / Transparansi */}
            <button
              id="role-btn-guest"
              onClick={() => handleRoleChange('guest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-l-md border transition-all ${
                currentUserRole === 'guest'
                  ? 'bg-gold-accent border-gold-accent text-white shadow-inner'
                  : 'bg-green-primary border-beige-border/40 text-[#D4C4A8] hover:bg-green-primary/80'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Transparan (Umum)
            </button>

            {/* Member */}
            <button
              id="role-btn-anggota"
              onClick={() => handleRoleChange('anggota')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-t border-b transition-all ${
                currentUserRole === 'anggota'
                  ? 'bg-gold-accent border-gold-accent text-white shadow-inner'
                  : 'bg-green-primary border-beige-border/40 text-[#D4C4A8] hover:bg-green-primary/80'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Anggota
            </button>

            {/* Admin */}
            <button
              id="role-btn-admin"
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-r-md border transition-all ${
                currentUserRole === 'admin'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-inner'
                  : 'bg-green-primary border-beige-border/40 text-[#D4C4A8] hover:bg-green-primary/80'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </button>
          </div>

          {/* Sync Button */}
          <button
            id="sync-btn"
            onClick={onSync}
            disabled={isSyncing}
            title="Sinkronisasi Data dengan Server"
            className="p-1.5 bg-green-primary hover:bg-green-primary/80 text-[#D4C4A8] hover:text-white rounded-md border border-beige-border/40 flex items-center justify-center transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Member Selection strip (if role is anggota) */}
      {currentUserRole === 'anggota' && (
        <div className="bg-gold-accent text-white py-2 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-brand tracking-wider uppercase font-semibold">
              ✨ Profil Anggota Terpilih:
            </span>
            <div className="flex items-center gap-2">
              <select
                id="select-member-profile"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-green-primary text-yellow-accent text-xs font-medium py-1 px-3 rounded border border-amber-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-200"
              >
                {anggotaList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.jabatan})
                  </option>
                ))}
              </select>
              <span className="text-[11px] bg-green-primary/90 px-2.5 py-0.5 rounded text-amber-200">
                Mode Lihat Saja
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="bg-green-primary/95 border-t border-beige-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-brand uppercase tracking-wider font-semibold rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cream-bg text-green-primary shadow-md border-b-2 border-gold-accent'
                      : 'text-[#D4C4A8] hover:text-white hover:bg-green-primary/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin Login Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-cream-bg rounded-xl shadow-2xl border-2 border-gold-accent max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-green-primary text-white p-4 flex items-center justify-between border-b-2 border-gold-accent">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-yellow-accent" />
                <h3 className="font-semibold font-display text-lg text-yellow-accent">Konfirmasi Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="text-[#D4C4A8] hover:text-white text-sm"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="p-6">
              <p className="text-xs text-slate-600 mb-4 leading-relaxed font-sans">
                Gunakan hak akses Admin untuk mengubah data simpanan, anggota, dan laba usaha. 
                <br />
                <span className="font-semibold text-green-primary">PIN Default: admin123 atau 12345</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-xs font-brand uppercase tracking-wider font-semibold text-slate-700 mb-2">
                  Masukkan PIN / Sandi Admin:
                </label>
                <input
                  id="admin-pin-input"
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setShowPinError(false);
                  }}
                  autoFocus
                  placeholder="••••••••"
                  className="w-full bg-white border border-beige-border rounded px-3 py-2 text-center text-lg font-mono tracking-widest focus:ring-1 focus:ring-green-primary focus:outline-none"
                />
                {showPinError && (
                  <p id="pin-error-msg" className="text-red-600 text-xs mt-1.5 font-sans font-medium">
                    ⚠️ PIN salah! Silakan coba lagi.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 bg-cream-card hover:bg-slate-300 text-slate-800 text-xs font-semibold uppercase py-2 rounded border border-beige-border/40"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-primary hover:bg-green-primary/95 text-white text-xs font-semibold uppercase py-2 rounded shadow"
                >
                  Login Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
