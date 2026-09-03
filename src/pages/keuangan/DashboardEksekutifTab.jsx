import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan } from '../../db/laporanHelpers';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';

function hariTerlambat(jatuhTempo) {
  const d = parseTanggalFleksibel(jatuhTempo);
  if (!d) return 0;
  const diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function DashboardEksekutifTab() {
  const { siswa, tahunAjaran, tahunAjaranAktif, pembayaran, pengeluaran, allTagihan, tagihanTerbayar, aset } = useAppData();
  const [taLabel, setTaLabel] = useState(null);
  const labelDipakai = taLabel || tahunAjaranAktif?.label;

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const ringkasanKeuangan = useMemo(() => {
    if (!labelDipakai) return { pemasukan: 0, pengeluaran: 0, labaRugi: 0 };
    const p = rekapPemasukanBulanan(labelDipakai, pembayaran).reduce((s, r) => s + r.total, 0);
    const k = rekapPengeluaranBulanan(labelDipakai, pengeluaran).reduce((s, r) => s + r.total, 0);
    return { pemasukan: p, pengeluaran: k, labaRugi: p - k };
  }, [labelDipakai, pembayaran, pengeluaran]);

  const tunggakan = useMemo(() => {
    const overdue = allTagihan
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        const sisa = t.nominal - terbayar;
        return { ...t, sisa, terlambat: hariTerlambat(t.jatuhTempo) };
      })
      .filter(t => t.sisa > 0 && t.terlambat > 0);
    const siswaSet = new Set(overdue.map(t => t.nisn));
    return { jumlahSiswa: siswaSet.size, totalNominal: overdue.reduce((s, t) => s + t.sisa, 0) };
  }, [allTagihan, tagihanTerbayar]);

  const kondisiAset = useMemo(() => {
    const t = { Baik: 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };
    aset.forEach(a => { t[a.kondisi] = (t[a.kondisi] || 0) + a.jumlah; });
    return t;
  }, [aset]);

  if (tahunAjaran.length === 0) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Dashboard Eksekutif</h3><p>Ringkasan lintas modul untuk satu tahun ajaran.</p></div>
        <select value={labelDipakai || ''} onChange={e => setTaLabel(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
        </select>
      </div>
      <div className="card-body">
        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>SISWA</div>
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-green"><div className="info-value">{siswaAktif.length}</div><div className="info-label">Siswa Aktif</div></div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>KEUANGAN — {labelDipakai}</div>
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-blue"><div className="info-value" style={{ fontSize: 17 }}>{formatRupiah(ringkasanKeuangan.pemasukan)}</div><div className="info-label">Pemasukan</div></div>
          <div className="info-card c-red"><div className="info-value" style={{ fontSize: 17 }}>{formatRupiah(ringkasanKeuangan.pengeluaran)}</div><div className="info-label">Pengeluaran</div></div>
          <div className={`info-card ${ringkasanKeuangan.labaRugi >= 0 ? 'c-green' : 'c-red'}`}><div className="info-value" style={{ fontSize: 17 }}>{formatRupiah(ringkasanKeuangan.labaRugi)}</div><div className="info-label">{ringkasanKeuangan.labaRugi >= 0 ? 'Laba' : 'Rugi'}</div></div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>TUNGGAKAN (SEMUA TAHUN AJARAN)</div>
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-gold"><div className="info-value">{tunggakan.jumlahSiswa}</div><div className="info-label">Siswa Menunggak</div></div>
          <div className="info-card c-red"><div className="info-value" style={{ fontSize: 17 }}>{formatRupiah(tunggakan.totalNominal)}</div><div className="info-label">Total Tunggakan</div></div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>SARPRAS</div>
        <div className="info-grid">
          <div className="info-card c-green"><div className="info-value">{kondisiAset['Baik']}</div><div className="info-label">Unit Baik</div></div>
          <div className="info-card c-gold"><div className="info-value">{kondisiAset['Rusak Ringan']}</div><div className="info-label">Unit Rusak Ringan</div></div>
          <div className="info-card c-red"><div className="info-value">{kondisiAset['Rusak Berat']}</div><div className="info-label">Unit Rusak Berat</div></div>
        </div>
      </div>
    </div>
  );
}
