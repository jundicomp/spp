import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import ManualForm from './ManualForm';
import ExcelUpload from './ExcelUpload';
import StoredDataTable from './StoredDataTable';
import RombelTab from './RombelTab';
import { useAppData } from '../../context/AppContext';
import { isConfigured } from '../../services/googleSheets';

export default function DataSiswaSheets() {
  const { siswa, siswaLoaded, refreshSiswa } = useAppData();
  const [tab, setTab] = useState('tabel');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => { setRefreshKey(k => k + 1); refreshSiswa(); };

  const stats = useMemo(() => {
    const perTingkat = {};
    siswa.forEach(s => {
      const t = s.kelasTingkat || '-';
      perTingkat[t] = (perTingkat[t] || 0) + 1;
    });
    return { total: siswa.length, perTingkat };
  }, [siswa]);
  const tingkatList = Object.keys(stats.perTingkat).sort();

  return (
    <Page pageId="siswa" title="Data Siswa" path="Pengaturan / Modul / Data Siswa">
      {siswaLoaded && siswa.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 20px', background: 'var(--green-soft)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>{stats.total}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Siswa</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--muted)' }}>SEBARAN PER KELAS / TINGKAT</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tingkatList.map(t => (
                    <div key={t} style={{ padding: '6px 14px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12.5 }}>
                      Kelas {t}: <strong>{stats.perTingkat[t]}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>📋 DATA SISWA (TABEL)</button>
          <button className={`seg-tab ${tab === 'rombel' ? 'active' : ''}`} onClick={() => setTab('rombel')}>🏫 ROMBEL</button>
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>📝 TAMBAH MANUAL</button>
          <button className={`seg-tab ${tab === 'excel' ? 'active' : ''}`} onClick={() => setTab('excel')}>📊 UPLOAD EXCEL</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {!isConfigured() && (
            <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
              ℹ️ Belum tersambung ke Google Sheets. Minta <strong>Admin</strong> mengatur koneksi lewat menu
              <strong> Pengaturan &gt; System &gt; Pengaturan Koneksi</strong> dulu.
            </div></div>
          )}
          {tab === 'tabel' && <StoredDataTable refreshKey={refreshKey} />}
          {tab === 'rombel' && <RombelTab />}
          {tab === 'manual' && <ManualForm onSaved={bump} />}
          {tab === 'excel' && <ExcelUpload onSaved={bump} />}
        </div>
      </div>
    </Page>
  );
}
