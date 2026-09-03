import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { permissionRoles, halamanSensitif } from '../db/seed';
import { normalizeSheetSiswa } from '../db/siswaFields';
import { normalizeSheetKelas } from '../db/kelasFields';
import { normalizeSheetGuru } from '../db/guruFields';
import { normalizeSheetAset } from '../db/asetFields';
import { normalizeSheetTahunAjaran } from '../db/tahunAjaranFields';
import { normalizeSheetProfil } from '../db/profilFields';
import { normalizeSheetTarif } from '../db/tarifFields';
import { normalizeSheetTagihanSpp, normalizeSheetTagihanLain, hitungTerbayar } from '../db/tagihanHelpers';
import { normalizeSheetPembayaran } from '../db/pembayaranFields';
import { normalizeSheetPengeluaran } from '../db/pengeluaranFields';
import {
  fetchSiswaFromSheet, fetchKelasFromSheet, fetchGuruFromSheet,
  fetchTahunAjaranFromSheet, fetchProfilFromSheet, fetchTarifFromSheet, fetchAsetFromSheet,
  fetchTagihanSppFromSheet, fetchTagihanLainFromSheet, fetchPembayaranFromSheet, fetchPengeluaranFromSheet,
  setActiveTahunAjaranOnSheet, isConfigured,
} from '../services/googleSheets';
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
  { id: 'peminjaman-aset', label: 'Peminjaman Aset', grup: 'Sarpras' },
  { id: 'pemeliharaan-aset', label: 'Pemeliharaan Aset', grup: 'Sarpras' },
  { id: 'laporan-rekap-aset', label: 'Laporan Rekap Aset', grup: 'Sarpras' },
  { id: 'profil', label: 'Profil Sekolah & Tahun Ajaran', grup: 'Pengaturan' },
  { id: 'kelas', label: 'Data Kelas & Rombel', grup: 'Pengaturan' },
  { id: 'guru', label: 'Data Guru & Staff', grup: 'Pengaturan' },
  { id: 'siswa', label: 'Data Siswa', grup: 'Pengaturan' },
  { id: 'manajemen-user', label: 'Manajemen User', grup: 'Pengaturan' },
  { id: 'hakakses', label: 'Manajemen Hak Akses', grup: 'Pengaturan' },
  { id: 'koneksi-sheets', label: 'Pengaturan Koneksi Google Sheets', grup: 'Pengaturan' },
  { id: 'pengaturan-sistem', label: 'Pengaturan Sistem', grup: 'Pengaturan' },
  { id: 'log-histori', label: 'Log Histori', grup: 'Pengaturan' },
];

const ADMIN_ONLY_PAGES = ['koneksi-sheets', 'pengaturan-sistem'];

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
  const [permissions, setPermissions] = useState(buildDefaultPermissions());
  const [toasts, setToasts] = useState([]);

  // ---- Data induk: SUMBER ASLINYA Google Sheets, bukan lagi data dami ----
  const siswaRes = useSheetResource(fetchSiswaFromSheet, normalizeSheetSiswa);
  const kelasRes = useSheetResource(fetchKelasFromSheet, normalizeSheetKelas);
  const guruRes = useSheetResource(fetchGuruFromSheet, normalizeSheetGuru);
  const asetRes = useSheetResource(fetchAsetFromSheet, normalizeSheetAset);
  const tahunAjaranRes = useSheetResource(fetchTahunAjaranFromSheet, normalizeSheetTahunAjaran);
  const tarifRes = useSheetResource(fetchTarifFromSheet, normalizeSheetTarif, 'keuangan');
  const tagihanSppRes = useSheetResource(fetchTagihanSppFromSheet, normalizeSheetTagihanSpp, 'keuangan');
  const tagihanLainRes = useSheetResource(fetchTagihanLainFromSheet, normalizeSheetTagihanLain, 'keuangan');
  const pembayaranRes = useSheetResource(fetchPembayaranFromSheet, normalizeSheetPembayaran, 'keuangan');
  const pengeluaranRes = useSheetResource(fetchPengeluaranFromSheet, normalizeSheetPengeluaran, 'keuangan');

  // ---- Profil Sekolah: 1 rekaman tunggal, bukan daftar ----
  const [profilSekolah, setProfilSekolahRaw] = useState(null);
  const [profilLoading, setProfilLoading] = useState(false);
  const [profilExists, setProfilExists] = useState(false);
  const refreshProfil = useCallback(async () => {
    if (!isConfigured()) { setProfilSekolahRaw(null); return; }
    setProfilLoading(true);
    try {
      const rows = await fetchProfilFromSheet();
      if (rows.length > 0) {
        setProfilSekolahRaw(normalizeSheetProfil(rows[0]));
        setProfilExists(true);
      } else {
        setProfilSekolahRaw(null);
        setProfilExists(false);
      }
    } finally {
      setProfilLoading(false);
    }
  }, []);
  useEffect(() => { refreshProfil(); }, [refreshProfil]);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const tahunAjaranAktifObj = useMemo(() => tahunAjaranRes.data.find(t => t.aktif), [tahunAjaranRes.data]);

  const siswaById = useCallback((id) => siswaRes.data.find(s => s.id === id), [siswaRes.data]);

  const allTagihan = useMemo(() => [...tagihanSppRes.data, ...tagihanLainRes.data], [tagihanSppRes.data, tagihanLainRes.data]);
  const tagihanTerbayar = useCallback((refType, refNo) => hitungTerbayar(pembayaranRes.data, refType, refNo), [pembayaranRes.data]);

  const setTahunAjaranAktif = useCallback(async (no) => {
    await setActiveTahunAjaranOnSheet(no);
    await tahunAjaranRes.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranRes.refresh]);

  const value = {
    tahunAjaran: tahunAjaranRes.data, tahunAjaranLoading: tahunAjaranRes.loading, tahunAjaranLoaded: tahunAjaranRes.loaded, refreshTahunAjaran: tahunAjaranRes.refresh,
    tahunAjaranAktif: tahunAjaranAktifObj, setTahunAjaranAktif,
    siswa: siswaRes.data, siswaLoading: siswaRes.loading, siswaError: siswaRes.error, siswaLoaded: siswaRes.loaded, refreshSiswa: siswaRes.refresh, siswaById,
    kelas: kelasRes.data, kelasLoading: kelasRes.loading, kelasError: kelasRes.error, kelasLoaded: kelasRes.loaded, refreshKelas: kelasRes.refresh,
    guru: guruRes.data, guruLoading: guruRes.loading, guruError: guruRes.error, guruLoaded: guruRes.loaded, refreshGuru: guruRes.refresh,
    aset: asetRes.data, asetLoading: asetRes.loading, asetError: asetRes.error, asetLoaded: asetRes.loaded, refreshAset: asetRes.refresh,
    tarif: tarifRes.data, tarifLoading: tarifRes.loading, tarifError: tarifRes.error, tarifLoaded: tarifRes.loaded, refreshTarif: tarifRes.refresh,
    tagihanSpp: tagihanSppRes.data, tagihanSppLoading: tagihanSppRes.loading, tagihanSppLoaded: tagihanSppRes.loaded, refreshTagihanSpp: tagihanSppRes.refresh,
    tagihanLain: tagihanLainRes.data, tagihanLainLoading: tagihanLainRes.loading, tagihanLainLoaded: tagihanLainRes.loaded, refreshTagihanLain: tagihanLainRes.refresh,
    pembayaran: pembayaranRes.data, pembayaranLoading: pembayaranRes.loading, pembayaranLoaded: pembayaranRes.loaded, refreshPembayaran: pembayaranRes.refresh,
    pengeluaran: pengeluaranRes.data, pengeluaranLoading: pengeluaranRes.loading, pengeluaranLoaded: pengeluaranRes.loaded, refreshPengeluaran: pengeluaranRes.refresh,
    allTagihan, tagihanTerbayar,
    profilSekolah, profilLoading, profilExists, refreshProfil,
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
