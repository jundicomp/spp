import Page from '../../components/layout/Page';
import ConnectionSettings from './ConnectionSettings';
import { useAppData } from '../../context/AppContext';

export default function KoneksiSheets() {
  const { refreshSiswa, refreshTarif } = useAppData();
  return (
    <Page pageId="koneksi-sheets" title="Pengaturan Koneksi Google Sheets" path="Pengaturan / System / Pengaturan Koneksi">
      <div className="card">
        <div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          🔒 Halaman ini <strong>khusus Admin</strong>. URL dan kata sandi Apps Script mengatur akses tulis ke seluruh
          data sekolah (siswa, user, dst) — jadi sengaja dibatasi supaya tidak sembarang orang bisa mengubahnya.
        </div>
      </div>
      <ConnectionSettings onConnected={refreshSiswa} onConnectedKeuangan={refreshTarif} />
    </Page>
  );
}
