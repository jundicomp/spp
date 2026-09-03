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
import ProfilSekolahDanTahunAjaran from './pages/pengaturan/ProfilSekolahDanTahunAjaran';
import ManajemenUser from './pages/pengaturan/ManajemenUser';
import ManajemenHakAkses from './pages/pengaturan/ManajemenHakAkses';
import KoneksiSheets from './pages/pengaturan/KoneksiSheets';
import PengaturanSistem from './pages/pengaturan/PengaturanSistem';
import LogHistori from './pages/pengaturan/LogHistori';
import ProfilSaya from './pages/pengaturan/ProfilSaya';
import TagihanBiaya from './pages/keuangan/TagihanBiaya';
import PembayaranInvoice from './pages/keuangan/PembayaranInvoice';
import RekapTunggakan from './pages/keuangan/RekapTunggakan';
import LaporanKeuangan from './pages/keuangan/LaporanKeuangan';
import DataAset from './pages/sarpras/DataAset';
import PeminjamanAset from './pages/sarpras/PeminjamanAset';
import PemeliharaanAset from './pages/sarpras/PemeliharaanAset';
import LaporanRekapAset from './pages/sarpras/LaporanRekapAset';
import ComingSoon from './pages/ComingSoon';

const PLACEHOLDER_PAGES = [];

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
        <Route path="/profil" element={<ProfilSekolahDanTahunAjaran />} />
        <Route path="/manajemen-user" element={<ManajemenUser />} />
        <Route path="/hakakses" element={<ManajemenHakAkses />} />
        <Route path="/koneksi-sheets" element={<KoneksiSheets />} />
        <Route path="/pengaturan-sistem" element={<PengaturanSistem />} />
        <Route path="/log-histori" element={<LogHistori />} />
        <Route path="/profil-saya" element={<ProfilSaya />} />
        <Route path="/tagihan" element={<TagihanBiaya />} />
        <Route path="/pembayaran" element={<PembayaranInvoice />} />
        <Route path="/tunggakan" element={<RekapTunggakan />} />
        <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
        <Route path="/aset" element={<DataAset />} />
        <Route path="/peminjaman-aset" element={<PeminjamanAset />} />
        <Route path="/pemeliharaan-aset" element={<PemeliharaanAset />} />
        <Route path="/aset-laporan" element={<LaporanRekapAset />} />
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
