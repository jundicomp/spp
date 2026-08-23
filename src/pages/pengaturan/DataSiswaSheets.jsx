import { useState } from 'react';
import Page from '../../components/layout/Page';
import ManualForm from './ManualForm';
import ExcelUpload from './ExcelUpload';
import StoredDataTable from './StoredDataTable';
import { isConfigured } from '../../services/googleSheets';

export default function DataSiswaSheets() {
  const [tab, setTab] = useState('manual');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey(k => k + 1);

  return (
    <Page pageId="siswa" title="Data Siswa (Ringkas)" path="Pengaturan / Modul / Data Siswa">
      {!isConfigured() && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets. Minta <strong>Admin</strong> mengatur koneksi lewat menu
          <strong> Pengaturan &gt; System &gt; Pengaturan Koneksi</strong> dulu.
        </div></div>
      )}
      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>📝 TAMBAH MANUAL</button>
          <button className={`seg-tab ${tab === 'excel' ? 'active' : ''}`} onClick={() => setTab('excel')}>📊 UPLOAD EXCEL</button>
          <button className={`seg-tab ${tab === 'data' ? 'active' : ''}`} onClick={() => setTab('data')}>📋 DATA TERSIMPAN</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'manual' && <ManualForm onSaved={bump} />}
          {tab === 'excel' && <ExcelUpload onSaved={bump} />}
          {tab === 'data' && <StoredDataTable refreshKey={refreshKey} />}
        </div>
      </div>
    </Page>
  );
}
