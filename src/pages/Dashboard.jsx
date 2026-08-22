import { useMemo } from 'react';
import Page from '../components/layout/Page';
import { useAppData } from '../context/AppContext';
import { formatRupiah } from '../db/helpers';

export default function Dashboard() {
  const { siswa, guru, kelas, tagihanSpp, tagihanLain, tagihanTerbayar, tahunAjaranAktif } = useAppData();

  const stats = useMemo(() => {
    const siswaAktif = siswa.filter(s => s.status === 'Aktif').length;
    let totalTagihan = 0, totalTerbayar = 0;
    tagihanSpp.forEach(t => { totalTagihan += t.nominal; totalTerbayar += tagihanTerbayar('SPP', t.id); });
    tagihanLain.forEach(t => { totalTagihan += t.nominal; totalTerbayar += tagihanTerbayar('LAIN', t.id); });
    return { siswaAktif, totalTagihan, totalTerbayar, sisa: totalTagihan - totalTerbayar };
  }, [siswa, tagihanSpp, tagihanLain, tagihanTerbayar]);

  return (
    <Page pageId="dashboard" title="Dashboard" path="Dashboard">
      <div className="info-grid" style={{ marginBottom: 20 }}>
        <div className="info-card c-green">
          <div className="info-value">{stats.siswaAktif}</div>
          <div className="info-label">Siswa Aktif</div>
          <div className="info-sub">Tahun Ajaran {tahunAjaranAktif?.label}</div>
        </div>
        <div className="info-card c-blue">
          <div className="info-value">{guru.length}</div>
          <div className="info-label">Guru &amp; Staff</div>
        </div>
        <div className="info-card c-purple">
          <div className="info-value">{kelas.length}</div>
          <div className="info-label">Kelas &amp; Rombel</div>
        </div>
        <div className="info-card c-red">
          <div className="info-value" style={{ fontSize: 17 }}>{formatRupiah(stats.sisa)}</div>
          <div className="info-label">Total Piutang</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Ringkasan Keuangan</h3><p>Seluruh tahun ajaran, seluruh siswa.</p></div>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div><div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Total Tagihan</div><div style={{ fontSize: 20, fontWeight: 800 }}>{formatRupiah(stats.totalTagihan)}</div></div>
            <div><div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Total Diterima</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(stats.totalTerbayar)}</div></div>
            <div><div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Sisa / Piutang</div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{formatRupiah(stats.sisa)}</div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          👋 Ini putaran pertama migrasi ke React — modul <strong>SPP Peserta Didik</strong> sudah dimigrasi penuh di sidebar.
          Modul lain (Keuangan, Sarpras, Pengaturan) menyusul di putaran berikutnya, mengikuti pola satu-modul-per-putaran yang sama seperti pembangunan versi HTML-nya.
        </div>
      </div>
    </Page>
  );
}
