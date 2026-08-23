import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import SppPesertaDidik from './pages/spp/SppPesertaDidik';
import DataSiswaSheets from './pages/pengaturan/DataSiswaSheets';
import DataKelas from './pages/pengaturan/DataKelas';
import DataGuru from './pages/pengaturan/DataGuru';
import ManajemenUser from './pages/pengaturan/ManajemenUser';
import ManajemenHakAkses from './pages/pengaturan/ManajemenHakAkses';
import KoneksiSheets from './pages/pengaturan/KoneksiSheets';
import LogHistori from './pages/pengaturan/LogHistori';
import ProfilSaya from './pages/pengaturan/ProfilSaya';
import ComingSoon from './pages/ComingSoon';

const PLACEHOLDER_PAGES = [
  { path: '/tagihan', pageId: 'tagihan', title: 'Tagihan & Biaya', menu: 'Keuangan / Tagihan & Biaya' },
  { path: '/pembayaran', pageId: 'pembayaran', title: 'Pembayaran & Invoice', menu: 'Keuangan / Pembayaran & Invoice' },
  { path: '/tunggakan', pageId: 'tunggakan', title: 'Rekap Tunggakan', menu: 'Keuangan / Rekap Tunggakan' },
  { path: '/laporan-keuangan', pageId: 'laporan-keuangan', title: 'Laporan Keuangan', menu: 'Keuangan / Laporan Keuangan' },
  { path: '/aset', pageId: 'aset', title: 'Data Aset & Inventaris', menu: 'Sarpras / Data Aset & Inventaris' },
  { path: '/profil', pageId: 'profil', title: 'Profil Sekolah & Tahun Ajaran', menu: 'Pengaturan / Profil Sekolah' },
];

function Gate() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/spp" element={<SppPesertaDidik />} />
        <Route path="/siswa" element={<DataSiswaSheets />} />
        <Route path="/kelas" element={<DataKelas />} />
        <Route path="/guru" element={<DataGuru />} />
        <Route path="/manajemen-user" element={<ManajemenUser />} />
        <Route path="/hakakses" element={<ManajemenHakAkses />} />
        <Route path="/koneksi-sheets" element={<KoneksiSheets />} />
        <Route path="/log-histori" element={<LogHistori />} />
        <Route path="/profil-saya" element={<ProfilSaya />} />
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
