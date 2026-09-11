import { useState } from 'react';
import Page from '../../components/layout/Page';
import BeasiswaKategoriTab from './BeasiswaKategoriTab';
import BeasiswaSiswaTab from './BeasiswaSiswaTab';
import { isConfigured } from '../../services/googleSheets';

export default function BeasiswaPage() {
  const [tab, setTab] = useState('kategori');

  return (
    <Page pageId="beasiswa" title="Beasiswa" path="Keuangan / Beasiswa">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan.
        </div></div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'kategori' ? 'active' : ''}`} onClick={() => setTab('kategori')}>🏷️ KATEGORI BEASISWA</button>
          <button className={`seg-tab ${tab === 'siswa' ? 'active' : ''}`} onClick={() => setTab('siswa')}>👥 SISWA PENERIMA</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'kategori' && <BeasiswaKategoriTab />}
          {tab === 'siswa' && <BeasiswaSiswaTab />}
        </div>
      </div>
    </Page>
  );
}
