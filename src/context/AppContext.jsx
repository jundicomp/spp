import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { tahunAjaranList, permissionRoles, halamanSensitif } from '../db/seed';
import { normalizeSheetSiswa } from '../db/siswaFields';
import { normalizeSheetKelas } from '../db/kelasFields';
import { normalizeSheetGuru } from '../db/guruFields';
import { fetchSiswaFromSheet, fetchKelasFromSheet, fetchGuruFromSheet } from '../services/googleSheets';
import useSheetResource from '../hooks/useSheetResource';

const AppDataContext = createContext(null);

const HAK_AKSES_PAGES = [
  { id: 'dashboard', label: 'Dashboard', grup: 'Umum' },
  { id: 'profil-saya', label: 'Profil Saya', grup: 'Umum' },
  { id: 'spp', label: 'SPP Peserta Didik', grup: 'SPP' },
  { id: 'tagihan', label: 'Tagihan & Biaya', grup: 'Keuangan' },
  { id: 'pembayaran', label: 'Pembayaran & Invoice', grup: 'Keuangan' },
  { id: 'tunggakan', label: 'Rekap Tunggakan', grup: 'Keuangan' },
  { id: 'laporan-keuangan', label: 'Laporan Keuangan', grup: 'Keuangan' },
  { id: 'aset', label: 'Data Aset & Inventaris', grup: 'Sarpras' },
  { id: 'profil', label: 'Profil Sekolah & Tahun Ajaran', grup: 'Pengaturan' },
  { id: 'kelas', label: 'Data Kelas & Rombel', grup: 'Pengaturan' },
  { id: 'guru', label: 'Data Guru & Staff', grup: 'Pengaturan' },
  { id: 'siswa', label: 'Data Siswa', grup: 'Pengaturan' },
  { id: 'manajemen-user', label: 'Manajemen User', grup: 'Pengaturan' },
  { id: 'hakakses', label: 'Manajemen Hak Akses', grup: 'Pengaturan' },
  { id: 'koneksi-sheets', label: 'Pengaturan Koneksi Google Sheets', grup: 'Pengaturan' },
  { id: 'log-histori', label: 'Log Histori', grup: 'Pengaturan' },
];

const ADMIN_ONLY_PAGES = ['koneksi-sheets'];

function buildDefaultPermissions() {
  const perms = {};
  permissionRoles.forEach(role => {
    perms[role] = {};
    HAK_AKSES_PAGES.forEach(p => {
      if (ADMIN_ONLY_PAGES.includes(p.id)) {
        perms[role][p.id] = role === 'Admin';
      } else {
        perms[role][p.id] = !(halamanSensitif.includes(p.id) && !['Kepala Sekolah', 'Admin'].includes(role));
      }
    });
  });
  return perms;
}

export function AppProvider({ children }) {
  const [tahunAjaran, setTahunAjaran] = useState(tahunAjaranList);
  const [permissions, setPermissions] = useState(buildDefaultPermissions());
  const [toasts, setToasts] = useState([]);

  // ---- Data induk: SUMBER ASLINYA Google Sheets, bukan lagi data dami ----
  const siswaRes = useSheetResource(fetchSiswaFromSheet, normalizeSheetSiswa);
  const kelasRes = useSheetResource(fetchKelasFromSheet, normalizeSheetKelas);
  const guruRes = useSheetResource(fetchGuruFromSheet, normalizeSheetGuru);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const tahunAjaranAktifObj = useMemo(() => tahunAjaran.find(t => t.aktif), [tahunAjaran]);

  const siswaById = useCallback((id) => siswaRes.data.find(s => s.id === id), [siswaRes.data]);

  const setTahunAjaranAktif = useCallback((id) => {
    setTahunAjaran(list => list.map(t => ({ ...t, aktif: t.id === id })));
  }, []);

  const value = {
    tahunAjaran, setTahunAjaran, tahunAjaranAktif: tahunAjaranAktifObj, setTahunAjaranAktif,
    siswa: siswaRes.data, siswaLoading: siswaRes.loading, siswaError: siswaRes.error, siswaLoaded: siswaRes.loaded, refreshSiswa: siswaRes.refresh, siswaById,
    kelas: kelasRes.data, kelasLoading: kelasRes.loading, kelasError: kelasRes.error, kelasLoaded: kelasRes.loaded, refreshKelas: kelasRes.refresh,
    guru: guruRes.data, guruLoading: guruRes.loading, guruError: guruRes.error, guruLoaded: guruRes.loaded, refreshGuru: guruRes.refresh,
    permissions, setPermissions,
    toast, toasts,
    HAK_AKSES_PAGES, permissionRoles, halamanSensitif, ADMIN_ONLY_PAGES,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData harus dipakai di dalam <AppProvider>');
  return ctx;
}
