import { useState } from 'react';
import Page from '../../components/layout/Page';
import ConnectionSettings from './ConnectionSettings';
import ManualForm from './ManualForm';
import ExcelUpload from './ExcelUpload';
import StoredDataTable from './StoredDataTable';

export default function DataSiswaSheets() {
  const [tab, setTab] = useState('manual');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey(k => k + 1);

  return (
    <Page pageId="siswa" title="Data Siswa (Ringkas)" path="Pengaturan / Modul / Data Siswa">
      <ConnectionSettings onConnected={bump} />

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
