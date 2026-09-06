import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import PembayaranTab from './PembayaranTab';
import InvoiceTab from './InvoiceTab';
import { isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { formatRupiah, parseTanggalFleksibel, todayWIB } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconReceipt, IconMoney, IconCalendarClock, IconFileText, IconAlertCircle } from '../../components/common/icons';

export default function PembayaranInvoice() {
  const [tab, setTab] = useState('pembayaran');
  const { pembayaran, pembayaranLoaded, allTagihan, tagihanTerbayar, tagihanSppLoaded, tagihanLainLoaded } = useAppData();

  const ringkasan = useMemo(() => {
    const asli = pembayaranAsli(pembayaran);
    const [tahunIni, bulanIni] = todayWIB().split('-').map(Number); // yyyy-MM-dd -> [yyyy, MM]
    const bulanBerjalan = asli.filter(p => {
      const d = parseTanggalFleksibel(p.tanggalBayar);
      return d && d.getMonth() === bulanIni - 1 && d.getFullYear() === tahunIni;
    });
    const sisaList = allTagihan.map(t => t.nominal - tagihanTerbayar(t.refType, t.no)).filter(s => s > 0);
    return {
      totalTransaksi: asli.length,
      totalNominal: asli.reduce((s, p) => s + p.nominal, 0),
      nominalBulanIni: bulanBerjalan.reduce((s, p) => s + p.nominal, 0),
      totalInvoice: sisaList.length,
      totalNilaiBelumDibayar: sisaList.reduce((s, v) => s + v, 0),
    };
  }, [pembayaran, allTagihan, tagihanTerbayar]);

  const dataSiap = pembayaranLoaded && (tagihanSppLoaded || tagihanLainLoaded);

  return (
    <Page pageId="pembayaran" title="Pembayaran & Invoice" path="Keuangan / Pembayaran & Invoice">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan. Minta <strong>Admin</strong> mengatur koneksi dulu.
        </div></div>
      )}

      {dataSiap && (ringkasan.totalTransaksi > 0 || ringkasan.totalInvoice > 0) && (
        <div className="info-grid-5" style={{ marginBottom: 20 }}>
          <InfoCard icon={IconReceipt} color="c-blue" value={ringkasan.totalTransaksi} label="Total Transaksi Pembayaran" />
          <InfoCard icon={IconMoney} color="c-green" value={formatRupiah(ringkasan.totalNominal)} label="Total Nominal Dibayar" valueFontSize={20} />
          <InfoCard icon={IconCalendarClock} color="c-gold" value={formatRupiah(ringkasan.nominalBulanIni)} label="Pembayaran Bulan Ini" valueFontSize={20} />
          <InfoCard icon={IconFileText} color="c-red" value={ringkasan.totalInvoice} label="Total Invoice Belum Lunas" />
          <InfoCard icon={IconAlertCircle} color="c-red" value={formatRupiah(ringkasan.totalNilaiBelumDibayar)} label="Total Nilai Belum Dibayar" valueFontSize={20} />
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
