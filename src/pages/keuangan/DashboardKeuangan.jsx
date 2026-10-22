import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import RingkasanKeuanganPanel from '../../components/keuangan/RingkasanKeuanganPanel';

// Dashboard Keuangan -- halaman KHUSUS modul Keuangan (bukan ringkasan lintas-modul
// spt Dashboard utama), diletakkan di atas "Tagihan & Biaya" di menu Keuangan, v1.31.38.
// Memakai komponen RingkasanKeuanganPanel yg SAMA dgn kartu "Ringkasan Keuangan" di
// Dashboard utama -- supaya angka & grafik di kedua tempat SELALU identik (satu
// sumber logika, dua tempat pakai).
export default function DashboardKeuangan() {
  const { tahunAjaranAktif } = useAppData();

  return (
    <Page pageId="dashboard-keuangan" title="Dashboard Keuangan" path="Keuangan / Dashboard Keuangan">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>💰 Dashboard Keuangan</h3>
            <p>Infografis interaktif pemasukan, pengeluaran, saldo kas &amp; piutang tahun ajaran {tahunAjaranAktif?.label}.</p>
          </div>
        </div>
        <div className="card-body">
          <RingkasanKeuanganPanel />
        </div>
      </div>
    </Page>
  );
}
