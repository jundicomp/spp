import { useMemo } from 'react';
import { statusTagihan } from '../../db/tagihanHelpers';
import { useAppData } from '../../context/AppContext';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export default function InvoiceTab() {
  const { allTagihan, tagihanTerbayar, tagihanSppLoaded, tagihanLainLoaded } = useAppData();

  const belumLunas = useMemo(() => {
    return allTagihan
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        const sisa = t.nominal - terbayar;
        return { ...t, terbayar, sisa, status: statusTagihan(t.nominal, terbayar) };
      })
      .filter(t => t.sisa > 0)
      .sort((a, b) => new Date(a.jatuhTempo) - new Date(b.jatuhTempo));
  }, [allTagihan, tagihanTerbayar]);

  const STATUS_BADGE = { 'Belum Lunas': 'badge-red', 'Sebagian': 'badge-gold' };

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>📄 Invoice — Tagihan Belum Lunas</h3><p>Semua tagihan (SPP + biaya lain) yang masih ada sisa, diurutkan dari jatuh tempo terdekat.</p></div>
      </div>
      <div className="card-body">
        {(!tagihanSppLoaded && !tagihanLainLoaded) && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {belumLunas.length === 0 && (tagihanSppLoaded || tagihanLainLoaded) && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Tidak ada tagihan yang belum lunas. 🎉</p>
        )}
        {belumLunas.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th>No</th><th>Nama Siswa</th><th>NISN</th><th>Jenis</th><th>Nominal</th><th>Sisa</th><th>Jatuh Tempo</th><th>Status</th></tr></thead>
              <tbody>
                {belumLunas.map((t, idx) => (
                  <tr key={t.id}>
                    <td>{idx + 1}</td>
                    <td>{t.namaSiswa}</td>
                    <td>{t.nisn}</td>
                    <td>{t.label}</td>
                    <td>{formatRupiah(t.nominal)}</td>
                    <td style={{ fontWeight: 700 }}>{formatRupiah(t.sisa)}</td>
                    <td>{t.jatuhTempo}</td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
