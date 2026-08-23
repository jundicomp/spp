import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  tahunAjaranList, kelasList, guruList, siswaList, tarifList,
  tagihanSppList, tagihanLainList, pembayaranSeed, asetSeed,
  profilSekolahSeed, permissionRoles, halamanSensitif, usersSeed,
} from '../db/seed';

const AppDataContext = createContext(null);

const HAK_AKSES_PAGES = [
  { id: 'dashboard', label: 'Dashboard', grup: 'Umum' },
  { id: 'spp', label: 'SPP Peserta Didik', grup: 'SPP' },
  { id: 'tagihan', label: 'Tagihan & Biaya', grup: 'Keuangan' },
  { id: 'pembayaran', label: 'Pembayaran & Invoice', grup: 'Keuangan' },
  { id: 'tunggakan', label: 'Rekap Tunggakan', grup: 'Keuangan' },
  { id: 'laporan-keuangan', label: 'Laporan Keuangan', grup: 'Keuangan' },
  { id: 'aset', label: 'Data Aset & Inventaris', grup: 'Sarpras' },
  { id: 'profil', label: 'Profil Sekolah & Tahun Ajaran', grup: 'Pengaturan' },
  { id: 'kelas', label: 'Data Kelas & Rombel', grup: 'Pengaturan' },
  { id: 'guru', label: 'Data Guru & Staff', grup: 'Pengaturan' },
  { id: 'siswa', label: 'Data Siswa (Ringkas)', grup: 'Pengaturan' },
  { id: 'manajemen-user', label: 'Manajemen User', grup: 'Pengaturan' },
  { id: 'hakakses', label: 'Manajemen Hak Akses', grup: 'Pengaturan' },
  { id: 'koneksi-sheets', label: 'Pengaturan Koneksi Google Sheets', grup: 'Pengaturan' },
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
  const [kelas] = useState(kelasList);
  const [guru] = useState(guruList);
  const [siswa] = useState(siswaList);
  const [tarif, setTarif] = useState(tarifList);
  const [tagihanSpp] = useState(tagihanSppList);
  const [tagihanLain] = useState(tagihanLainList);
  const [pembayaran, setPembayaran] = useState(pembayaranSeed);
  const [aset] = useState(asetSeed);
  const [profilSekolah, setProfilSekolah] = useState(profilSekolahSeed);
  const [users, setUsers] = useState(usersSeed);
  const [permissions, setPermissions] = useState(buildDefaultPermissions());
  const [pemutihan, setPemutihan] = useState([]);
  const [logHapus, setLogHapus] = useState([]);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const tahunAjaranAktifObj = useMemo(() => tahunAjaran.find(t => t.aktif), [tahunAjaran]);

  const siswaById = useCallback((id) => siswa.find(s => s.id === id), [siswa]);
  const kelasById = useCallback((id) => kelas.find(k => k.id === id), [kelas]);

  const tagihanTerbayar = useCallback((refType, refId) => {
    return pembayaran.filter(p => p.refType === refType && p.refId === refId).reduce((s, p) => s + p.nominal, 0);
  }, [pembayaran]);

  const setTahunAjaranAktif = useCallback((id) => {
    setTahunAjaran(list => list.map(t => ({ ...t, aktif: t.id === id })));
  }, []);

  const value = {
    tahunAjaran, setTahunAjaran, tahunAjaranAktif: tahunAjaranAktifObj, setTahunAjaranAktif,
    kelas, guru, siswa, tarif, setTarif,
    tagihanSpp, tagihanLain, pembayaran, setPembayaran,
    aset, profilSekolah, setProfilSekolah,
    users, setUsers, permissions, setPermissions,
    pemutihan, setPemutihan, logHapus, setLogHapus,
    siswaById, kelasById, tagihanTerbayar,
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
