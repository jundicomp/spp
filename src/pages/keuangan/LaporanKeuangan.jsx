import { useState } from 'react';
import Page from '../../components/layout/Page';
import RekapitulasiTab from './RekapitulasiTab';
import LabaRugiTab from './LabaRugiTab';
import CashflowTab from './CashflowTab';
import NeracaTab from './NeracaTab';
import DashboardEksekutifTab from './DashboardEksekutifTab';
import { isConfigured } from '../../services/googleSheets';

export default function LaporanKeuangan() {
  const [tab, setTab] = useState('rekap');

  return (
    <Page pageId="laporan-keuangan" title="Laporan Keuangan" path="Keuangan / Laporan Keuangan">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan.
        </div></div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'rekap' ? 'active' : ''}`} onClick={() => setTab('rekap')}>📈 REKAPITULASI</button>
          <button className={`seg-tab ${tab === 'labarugi' ? 'active' : ''}`} onClick={() => setTab('labarugi')}>📊 LABA RUGI</button>
          <button className={`seg-tab ${tab === 'cashflow' ? 'active' : ''}`} onClick={() => setTab('cashflow')}>💵 CASHFLOW</button>
          <button className={`seg-tab ${tab === 'neraca' ? 'active' : ''}`} onClick={() => setTab('neraca')}>⚖️ NERACA</button>
          <button className={`seg-tab ${tab === 'eksekutif' ? 'active' : ''}`} onClick={() => setTab('eksekutif')}>🧭 DASHBOARD EKSEKUTIF</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'rekap' && <RekapitulasiTab />}
          {tab === 'labarugi' && <LabaRugiTab />}
          {tab === 'cashflow' && <CashflowTab />}
          {tab === 'neraca' && <NeracaTab />}
          {tab === 'eksekutif' && <DashboardEksekutifTab />}
        </div>
      </div>
    </Page>
  );
}
