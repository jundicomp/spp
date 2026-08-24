import { useState } from 'react';
import Page from '../../components/layout/Page';
import PembayaranTab from './PembayaranTab';
import InvoiceTab from './InvoiceTab';
import { isConfigured } from '../../services/googleSheets';

export default function PembayaranInvoice() {
  const [tab, setTab] = useState('pembayaran');

  return (
    <Page pageId="pembayaran" title="Pembayaran & Invoice" path="Keuangan / Pembayaran & Invoice">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan. Minta <strong>Admin</strong> mengatur koneksi dulu.
        </div></div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'pembayaran' ? 'active' : ''}`} onClick={() => setTab('pembayaran')}>💳 PEMBAYARAN</button>
          <button className={`seg-tab ${tab === 'invoice' ? 'active' : ''}`} onClick={() => setTab('invoice')}>📄 INVOICE</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'pembayaran' && <PembayaranTab />}
          {tab === 'invoice' && <InvoiceTab />}
        </div>
      </div>
    </Page>
  );
}
