import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import SppPesertaDidik from './pages/spp/SppPesertaDidik';
import ComingSoon from './pages/ComingSoon';

const PLACEHOLDER_PAGES = [
  { path: '/tagihan', pageId: 'tagihan', title: 'Tagihan & Biaya', menu: 'Keuangan / Tagihan & Biaya' },
  { path: '/pembayaran', pageId: 'pembayaran', title: 'Pembayaran & Invoice', menu: 'Keuangan / Pembayaran & Invoice' },
  { path: '/tunggakan', pageId: 'tunggakan', title: 'Rekap Tunggakan', menu: 'Keuangan / Rekap Tunggakan' },
  { path: '/laporan-keuangan', pageId: 'laporan-keuangan', title: 'Laporan Keuangan', menu: 'Keuangan / Laporan Keuangan' },
  { path: '/aset', pageId: 'aset', title: 'Data Aset & Inventaris', menu: 'Sarpras / Data Aset & Inventaris' },
  { path: '/profil', pageId: 'profil', title: 'Profil Sekolah & Tahun Ajaran', menu: 'Pengaturan / Profil Sekolah' },
  { path: '/kelas', pageId: 'kelas', title: 'Data Kelas & Rombel', menu: 'Pengaturan / Data Kelas & Rombel' },
  { path: '/guru', pageId: 'guru', title: 'Data Guru & Staff', menu: 'Pengaturan / Data Guru & Staff' },
  { path: '/siswa', pageId: 'siswa', title: 'Data Siswa (Ringkas)', menu: 'Pengaturan / Data Siswa' },
  { path: '/manajemen-user', pageId: 'manajemen-user', title: 'Manajemen User', menu: 'Pengaturan / User / Manajemen User' },
  { path: '/hakakses', pageId: 'hakakses', title: 'Manajemen Hak Akses', menu: 'Pengaturan / User / Manajemen Hak Akses' },
];

function Gate() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/spp" element={<SppPesertaDidik />} />
        {PLACEHOLDER_PAGES.map(p => (
          <Route key={p.path} path={p.path} element={<ComingSoon pageId={p.pageId} title={p.title} path={p.menu} />} />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </AppProvider>
    </HashRouter>
  );
}
