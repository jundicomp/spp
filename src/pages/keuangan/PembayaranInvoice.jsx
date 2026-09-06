import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import PembayaranTab from './PembayaranTab';
import InvoiceTab from './InvoiceTab';
import { isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { formatRupiah, parseTanggalFleksibel, todayWIB } from '../../db/helpers';

export default function PembayaranInvoice() {
  const [tab, setTab] = useState('pembayaran');
  const { pembayaran, pembayaranLoaded } = useAppData();

  const ringkasan = useMemo(() => {
    const asli = pembayaranAsli(pembayaran);
    const [tahunIni, bulanIni] = todayWIB().split('-').map(Number); // yyyy-MM-dd -> [yyyy, MM]
    const bulanBerjalan = asli.filter(p => {
      const d = parseTanggalFleksibel(p.tanggalBayar);
      return d && d.getMonth() === bulanIni - 1 && d.getFullYear() === tahunIni;
    });
    return {
      totalTransaksi: asli.length,
      totalNominal: asli.reduce((s, p) => s + p.nominal, 0),
      nominalBulanIni: bulanBerjalan.reduce((s, p) => s + p.nominal, 0),
    };
  }, [pembayaran]);

  return (
    <Page pageId="pembayaran" title="Pembayaran & Invoice" path="Keuangan / Pembayaran & Invoice">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan. Minta <strong>Admin</strong> mengatur koneksi dulu.
        </div></div>
      )}

      {pembayaranLoaded && ringkasan.totalTransaksi > 0 && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-blue"><div className="info-value">{ringkasan.totalTransaksi}</div><div className="info-label">Total Transaksi Pembayaran</div></div>
          <div className="info-card c-green"><div className="info-value" style={{ fontSize: 20 }}>{formatRupiah(ringkasan.totalNominal)}</div><div className="info-label">Total Nominal Dibayar</div></div>
          <div className="info-card c-gold"><div className="info-value" style={{ fontSize: 20 }}>{formatRupiah(ringkasan.nominalBulanIni)}</div><div className="info-label">Pembayaran Bulan Ini</div></div>
        </div>
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
