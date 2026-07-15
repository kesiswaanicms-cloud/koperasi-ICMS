/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  HelpCircle, 
  Share2, 
  Lock, 
  Unlock, 
  BookOpen, 
  RefreshCw,
  Copy,
  CheckCircle,
  FileSpreadsheet,
  Cloud,
  Database,
  Download,
  Upload,
  Settings
} from 'lucide-react';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

import { KoperasiData, Anggota, Simpanan, LabaUsaha, PengaturanSHU } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ManageMembers from './components/ManageMembers';
import ManageSavings from './components/ManageSavings';
import ManageProfit from './components/ManageProfit';
import SHUCalculator from './components/SHUCalculator';
import seedData from '../data/seed_data.json';

declare const __APP_URL__: string;

export default function App() {
  // Remote synchronization state
  const [remoteSyncUrl, setRemoteSyncUrl] = useState<string>(() => {
    return localStorage.getItem('koperasi_remote_sync_url') || '';
  });
  const [copiedSyncUrl, setCopiedSyncUrl] = useState<boolean>(false);

  const getApiUrl = (endpoint: string) => {
    // 1. Prioritize manual localStorage sync URL override
    const customSyncUrl = localStorage.getItem('koperasi_remote_sync_url');
    if (customSyncUrl && customSyncUrl.trim() !== '') {
      const base = customSyncUrl.replace(/\/$/, '');
      const cleanEndpoint = '/' + endpoint.replace(/^\//, '');
      return `${base}${cleanEndpoint}`;
    }

    // 2. Read baked-in AI Studio master URL from Vite config
    let bakedUrl = '';
    try {
      bakedUrl = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : '';
    } catch (e) {
      // ignore
    }

    // Fallback to the Google AI Studio master Shared URL if bakedUrl is empty (common in external Vercel builds)
    if (!bakedUrl || bakedUrl.trim() === '') {
      bakedUrl = 'https://ais-pre-4wuczjy7hi7powicgk6azu-477277126556.asia-east1.run.app';
    }

    // 3. Auto-detect if we are running in local/dev vs external host (Vercel)
    const isLocalOrDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.includes('.run.app') || 
      window.location.hostname.includes('asia-east1.run.app');

    // If running externally (e.g. Vercel) and has baked URL, route automatically!
    if (!isLocalOrDevelopment && bakedUrl && bakedUrl.trim() !== '') {
      const base = bakedUrl.replace(/\/$/, '');
      const cleanEndpoint = '/' + endpoint.replace(/^\//, '');
      return `${base}${cleanEndpoint}`;
    }

    // Default to relative path
    return endpoint;
  };
  // Core Cooperative state initialized from localStorage for instant, offline-safe load
  const [anggotaList, setAnggotaList] = useState<Anggota[]>(() => {
    try {
      const saved = localStorage.getItem('koperasi_local_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.anggota)) return parsed.anggota;
      }
    } catch (e) {
      console.error('Error reading anggotaList from localStorage:', e);
    }
    return (seedData as any).anggota || [];
  });

  const [simpananList, setSimpananList] = useState<Simpanan[]>(() => {
    try {
      const saved = localStorage.getItem('koperasi_local_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.simpanan)) return parsed.simpanan;
      }
    } catch (e) {
      console.error('Error reading simpananList from localStorage:', e);
    }
    return (seedData as any).simpanan || [];
  });

  const [labaUsahaList, setLabaUsahaList] = useState<LabaUsaha[]>(() => {
    try {
      const saved = localStorage.getItem('koperasi_local_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.labaUsaha)) return parsed.labaUsaha;
      }
    } catch (e) {
      console.error('Error reading labaUsahaList from localStorage:', e);
    }
    return (seedData as any).labaUsaha || [];
  });

  const [pengaturanSHU, setPengaturanSHU] = useState<PengaturanSHU>(() => {
    try {
      const saved = localStorage.getItem('koperasi_local_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pengaturanSHU) return parsed.pengaturanSHU;
      }
    } catch (e) {
      console.error('Error reading pengaturanSHU from localStorage:', e);
    }
    return (seedData as any).pengaturanSHU || {
      persenLabaPool: 45,
      persenPoolSimpanan: 60,
      persenPoolPengurus: 40
    };
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'anggota' | 'guest'>('guest');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('koperasi_local_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.anggota) && parsed.anggota.length > 0) return parsed.anggota[0].id;
      }
    } catch (e) {
      console.error(e);
    }
    return (seedData as any).anggota?.[0]?.id || '';
  });
  
  // Connection and synchronization states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Parse URL query parameter for role/mode on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') || params.get('role');
    if (modeParam === 'transparan' || modeParam === 'guest') {
      setCurrentUserRole('guest');
    } else if (modeParam === 'anggota') {
      setCurrentUserRole('anggota');
    } else if (modeParam === 'admin') {
      // Direct admin mode simulation if specifically passed
      setCurrentUserRole('admin');
    }
  }, []);

  // Save changes to Firestore
  const saveChangesToServer = async (
    updatedAnggota: Anggota[],
    updatedSimpanan: Simpanan[],
    updatedLaba: LabaUsaha[],
    updatedSettings: PengaturanSHU,
    overrideTimestamp?: number
  ) => {
    setIsSyncing(true);
    setSyncStatus('saving');
    const timestamp = overrideTimestamp || Date.now();

    const payload: KoperasiData = {
      anggota: updatedAnggota,
      simpanan: updatedSimpanan,
      labaUsaha: updatedLaba,
      pengaturanSHU: updatedSettings,
      lastUpdated: timestamp
    };

    // Keep localStorage instantly updated
    try {
      localStorage.setItem('koperasi_local_data', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    try {
      const docRef = doc(db, 'koperasi', 'utama');
      await setDoc(docRef, payload);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error syncing changes with Firestore:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch full state from backend server with optional silent background mode
  const fetchState = async (isSilent = false) => {
    // Left as no-op for compatibility with UI components.
    // Real-time synchronization is handled by onSnapshot below.
  };

  useEffect(() => {
    setIsLoading(true);
    const docRef = doc(db, 'koperasi', 'utama');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as KoperasiData;
        
        setAnggotaList(data.anggota || []);
        setSimpananList(data.simpanan || []);
        setLabaUsahaList(data.labaUsaha || []);
        setPengaturanSHU(data.pengaturanSHU || {
          persenLabaPool: 45,
          persenPoolSimpanan: 60,
          persenPoolPengurus: 40
        });
        
        try {
          localStorage.setItem('koperasi_local_data', JSON.stringify(data));
        } catch (e) {
          console.error(e);
        }

        setSelectedMemberId((prev) => {
          if (prev) return prev;
          const activeAnggota = data.anggota || [];
          return activeAnggota.length > 0 ? activeAnggota[0].id : '';
        });

        setSyncStatus('synced');
      } else {
        // Document doesn't exist, maybe first time setup
        const payload: KoperasiData = {
          anggota: anggotaList,
          simpanan: simpananList,
          labaUsaha: labaUsahaList,
          pengaturanSHU: pengaturanSHU,
          lastUpdated: Date.now()
        };
        setDoc(docRef, payload).catch(console.error);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
      setSyncStatus('error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reset database to initial seed defaults
  const handleResetData = async () => {
    if (!window.confirm('Apakah Anda yakin ingin me-reset seluruh buku kas keuangan Koperasi ICMS ke data bawaan simulasi? Semua data tambahan Anda akan terhapus.')) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('saving');
    try {
      const docRef = doc(db, 'koperasi', 'utama');
      
      const payload: KoperasiData = {
        anggota: (seedData as any).anggota || [],
        simpanan: (seedData as any).simpanan || [],
        labaUsaha: (seedData as any).labaUsaha || [],
        pengaturanSHU: (seedData as any).pengaturanSHU || {
          persenLabaPool: 45,
          persenPoolSimpanan: 60,
          persenPoolPengurus: 40
        },
        lastUpdated: Date.now()
      };
      
      await setDoc(docRef, payload);
      
      // Remove locally stored state so we start fresh from seed
      try {
        localStorage.removeItem('koperasi_local_data');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      alert('Database koperasi berhasil di-reset!');
    } catch (err) {
      console.error('Error resetting database:', err);
      setSyncStatus('error');
      alert('Gagal me-reset database koperasi.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save/disconnect remote sync server URL
  const handleSaveRemoteSyncUrl = (url: string) => {
    const trimmed = url.trim();
    if (trimmed === '') {
      localStorage.removeItem('koperasi_remote_sync_url');
      setRemoteSyncUrl('');
      alert('Sistem kembali menggunakan database default (Local Mode)');
    } else {
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        alert('URL sinkronisasi tidak valid! Harus diawali dengan http:// atau https://');
        return;
      }
      localStorage.setItem('koperasi_remote_sync_url', trimmed);
      setRemoteSyncUrl(trimmed);
      alert('Berhasil terhubung ke Master Server! Sistem akan me-refresh database.');
    }
    setTimeout(() => {
      fetchState();
    }, 150);
  };

  // Export all database contents to a local backup JSON file
  const handleExportData = () => {
    const payload: KoperasiData = {
      anggota: anggotaList,
      simpanan: simpananList,
      labaUsaha: labaUsahaList,
      pengaturanSHU: pengaturanSHU,
      lastUpdated: Date.now()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const d = new Date();
    const dateString = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
    downloadAnchor.setAttribute("download", `koperasi_icms_backup_${dateString}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import database contents from a backup JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed: KoperasiData = JSON.parse(event.target?.result as string);
          if (parsed && (Array.isArray(parsed.anggota) || Array.isArray(parsed.simpanan) || Array.isArray(parsed.labaUsaha))) {
            const confirmed = window.confirm('Apakah Anda yakin ingin menimpa seluruh database koperasi saat ini dengan data dari file cadangan ini?');
            if (confirmed) {
              const updatedAnggota = parsed.anggota || [];
              const updatedSimpanan = parsed.simpanan || [];
              const updatedLaba = parsed.labaUsaha || [];
              const updatedSettings = parsed.pengaturanSHU || {
                persenLabaPool: 45,
                persenPoolSimpanan: 60,
                persenPoolPengurus: 40
              };
              
              setAnggotaList(updatedAnggota);
              setSimpananList(updatedSimpanan);
              setLabaUsahaList(updatedLaba);
              setPengaturanSHU(updatedSettings);
              
              if (updatedAnggota.length > 0) {
                setSelectedMemberId(updatedAnggota[0].id);
              }
              
              saveChangesToServer(updatedAnggota, updatedSimpanan, updatedLaba, updatedSettings);
              alert('Data koperasi berhasil dipulihkan dari file JSON!');
            }
          } else {
            alert('Format file cadangan JSON tidak valid!');
          }
        } catch (error) {
          alert('Gagal membaca file JSON. Pastikan file valid.');
          console.error(error);
        }
      };
    }
  };

  // Wrappers to handle states and automatically push to server on updates
  const updateAnggotaList = (updater: Anggota[] | ((prev: Anggota[]) => Anggota[])) => {
    setAnggotaList((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveChangesToServer(next, simpananList, labaUsahaList, pengaturanSHU);
      return next;
    });
  };

  const updateSimpananList = (updater: Simpanan[] | ((prev: Simpanan[]) => Simpanan[])) => {
    setSimpananList((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveChangesToServer(anggotaList, next, labaUsahaList, pengaturanSHU);
      return next;
    });
  };

  const updateLabaUsahaList = (updater: LabaUsaha[] | ((prev: LabaUsaha[]) => LabaUsaha[])) => {
    setLabaUsahaList((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveChangesToServer(anggotaList, simpananList, next, pengaturanSHU);
      return next;
    });
  };

  const updateLabaAndSimpananList = (
    labaUpdater: LabaUsaha[] | ((prev: LabaUsaha[]) => LabaUsaha[]),
    simpananUpdater: Simpanan[] | ((prev: Simpanan[]) => Simpanan[])
  ) => {
    setLabaUsahaList((prevLaba) => {
      const nextLaba = typeof labaUpdater === 'function' ? labaUpdater(prevLaba) : labaUpdater;
      setSimpananList((prevSimpanan) => {
        const nextSimpanan = typeof simpananUpdater === 'function' ? simpananUpdater(prevSimpanan) : simpananUpdater;
        saveChangesToServer(anggotaList, nextSimpanan, nextLaba, pengaturanSHU);
        return nextSimpanan;
      });
      return nextLaba;
    });
  };

  const updatePengaturanSHU = (updater: PengaturanSHU | ((prev: PengaturanSHU) => PengaturanSHU)) => {
    setPengaturanSHU((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveChangesToServer(anggotaList, simpananList, labaUsahaList, next);
      return next;
    });
  };

  // Build the shareable URL
  const getShareableUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?mode=transparan`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareableUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Render correct tab view
  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            data={{ anggota: anggotaList, simpanan: simpananList, labaUsaha: labaUsahaList, pengaturanSHU }} 
            currentUserRole={currentUserRole}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );
      case 'anggota':
        return (
          <ManageMembers 
            anggotaList={anggotaList}
            setAnggotaList={updateAnggotaList}
            currentUserRole={currentUserRole}
          />
        );
      case 'simpanan':
        return (
          <ManageSavings 
            simpananList={simpananList}
            setSimpananList={updateSimpananList}
            anggotaList={anggotaList}
            currentUserRole={currentUserRole}
          />
        );
      case 'laba':
        return (
          <ManageProfit 
            labaUsahaList={labaUsahaList}
            setLabaUsahaList={updateLabaUsahaList}
            currentUserRole={currentUserRole}
            anggotaList={anggotaList}
          />
        );
      case 'shu':
        return (
          <SHUCalculator 
            data={{ anggota: anggotaList, simpanan: simpananList, labaUsaha: labaUsahaList, pengaturanSHU }}
            setPengaturanSHU={updatePengaturanSHU}
            currentUserRole={currentUserRole}
            selectedMemberId={selectedMemberId}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen paper-bg flex flex-col items-center justify-center p-4">
        <div className="bg-cream-bg border-4 border-gold-accent p-8 rounded-xl shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <Landmark className="h-12 w-12 text-green-primary animate-bounce" />
          <h3 className="font-display font-semibold text-lg text-green-primary">Membuka Buku Kas Koperasi...</h3>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Menghubungkan ke server kasir Koperasi ICMS untuk menyinkronkan transaksi kas terbaru secara real-time. Mohon tunggu.
          </p>
          <div className="w-full bg-cream-card h-1.5 rounded-full overflow-hidden border border-beige-border">
            <div className="bg-green-primary h-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-bg flex flex-col text-green-primary font-sans selection:bg-cream-card">
      {/* Dynamic top syncing status strip */}
      <div className="bg-green-primary text-white text-[10px] font-mono px-4 py-1.5 border-b border-gold-accent">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-emerald-400 animate-pulse' :
              syncStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
            }`}></span>
            <span className="tracking-wider">
              {syncStatus === 'synced' && 'KONEKSI SERVER AKTIF - DATA TERSINKRONISASI'}
              {syncStatus === 'saving' && 'MENYIMPAN PERUBAHAN KE SERVER KAS...'}
              {syncStatus === 'error' && 'WARNING: KONEKSI TIMEOUT - REKAP LOKAL DIGUNAKAN'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span>ZONA WAKTU: WIB / WITA (UTC+7/8)</span>
            {currentUserRole === 'admin' && (
              <span className="text-yellow-accent font-bold uppercase tracking-wider bg-green-primary/80 px-2 py-0.2 rounded border border-beige-border/40">
                🔒 AKUN KASIR ADMIN
              </span>
            )}
            {currentUserRole === 'anggota' && (
              <span className="text-emerald-300 font-bold uppercase tracking-wider bg-green-primary/80 px-2 py-0.2 rounded border border-beige-border/40">
                👤 AKUN ANGGOTA AKTIF
              </span>
            )}
            {currentUserRole === 'guest' && (
              <span className="text-slate-300 font-semibold uppercase tracking-wider bg-green-primary/80 px-2 py-0.2 rounded border border-beige-border/40">
                🌐 TRANSPARANSI UMUM
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary header and menu component */}
      <Header 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        anggotaList={anggotaList}
        onSync={fetchState}
        isSyncing={isSyncing}
      />

      {/* Main content viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic viewport renderer */}
        {renderCurrentTab()}



        {/* Shared Transparency Portal section (Always visible at the bottom for beautiful usability!) */}
        <div className="mt-12 bg-cream-card border-2 border-beige-border rounded-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-green-primary font-display flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-green-primary" />
                Bagikan Portal Transparansi Keuangan
              </h4>
              <p className="text-xs text-slate-600 font-sans leading-relaxed max-w-2xl">
                Setiap anggota berhak melihat rekapitulasi tabungan dan kalkulator pembagian SHU secara mandiri. Bagikan tautan khusus ini untuk memberikan akses masuk read-only instan tanpa perlu PIN Admin.
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                id="shareable-link-display"
                type="text"
                readOnly
                value={getShareableUrl()}
                className="bg-white border border-beige-border rounded text-xs px-3 py-2 w-full lg:w-80 font-mono text-slate-600 focus:outline-none"
              />
              <button
                id="copy-share-btn"
                onClick={copyShareLink}
                className="px-3.5 py-2 bg-green-primary hover:bg-gold-accent text-white rounded text-xs font-brand uppercase font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>



      </main>

      {/* Classic Cooperatives-styled double-layered footer */}
      <footer className="bg-green-primary text-[#D4C4A8] border-t-4 border-gold-accent mt-16 font-mono text-[10px]">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-display">
              <Landmark className="h-5 w-5 text-yellow-accent" />
              <span className="font-semibold text-sm text-yellow-accent">Koperasi ICMS</span>
            </div>
            <p className="font-sans leading-relaxed text-slate-300 text-justify">
              Koperasi Islamic Modern School (ICMS) didirikan untuk meningkatkan kesejahteraan finansial warga sekolah, guru, karyawan, dan pengurus secara transparan, adil, berkelanjutan, dan barokah.
            </p>
          </div>
          <div className="flex flex-col justify-between md:items-end gap-3 text-slate-300">
            <div>
              <span className="font-semibold text-white block mb-1 font-sans">Kantor Pusat Koperasi:</span>
              Gedung Utama ICMS Lantai 1, Jl. Raya Pendidikan No. 45<br />
              Email: kesiswaanicms@gmail.com
            </div>
            <div className="border-t border-beige-border/30 pt-2.5 w-full md:w-auto text-left md:text-right font-sans text-slate-400">
              &copy; {new Date().getFullYear()} Koperasi ICMS. Dikembangkan secara khusus sebagai instrumen transparansi finansial sekolah.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
