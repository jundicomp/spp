import Page from '../../components/layout/Page';
import useTabAccess from '../../hooks/useTabAccess';
import CekDataDuplikatTab from './CekDataDuplikatTab';
import CekDataNisnTab from './CekDataNisnTab';
import CekDataKeuanganTab from './CekDataKeuanganTab';

// Dulu "Bersihkan Data Duplikat" (1 halaman penuh, tanpa tab). Sekarang jadi
// "Cek Data dan Sistem" dgn 3 tab: Cek Data Duplikat (isi lama, dipindah ke
// CekDataDuplikatTab.jsx apa adanya), Cek Data NISN (CekDataNisnTab.jsx), &
// Cek Data Keuangan (baru, CekDataKeuanganTab.jsx).
// pageId hak akses TETAP "bersihkan-duplikat" (lihat catatan di CekDataDuplikatTab.jsx).
export default function CekDataSistem() {
  const { tab, setTab, bolehTab } = useTabAccess('bersihkan-duplikat', ['duplikat', 'nisn', 'keuangan']);

  return (
    <Page pageId="bersihkan-duplikat" title="Cek Data dan Sistem" path="Keuangan / Cek Data dan Sistem">
      <div className="card">
        <div className="seg-tabs">
          {bolehTab('duplikat') && <button className={`seg-tab ${tab === 'duplikat' ? 'active' : ''}`} onClick={() => setTab('duplikat')}>🧹 CEK DATA DUPLIKAT</button>}
          {bolehTab('nisn') && <button className={`seg-tab ${tab === 'nisn' ? 'active' : ''}`} onClick={() => setTab('nisn')}>🆔 CEK DATA NISN</button>}
          {bolehTab('keuangan') && <button className={`seg-tab ${tab === 'keuangan' ? 'active' : ''}`} onClick={() => setTab('keuangan')}>💰 CEK DATA KEUANGAN</button>}
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'duplikat' && bolehTab('duplikat') && <CekDataDuplikatTab />}
          {tab === 'nisn' && bolehTab('nisn') && <CekDataNisnTab />}
          {tab === 'keuangan' && bolehTab('keuangan') && <CekDataKeuanganTab />}
        </div>
      </div>
    </Page>
  );
}
