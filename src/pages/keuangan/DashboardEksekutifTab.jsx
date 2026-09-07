import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan } from '../../db/laporanHelpers';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconUsers, IconTrendUp, IconTrendDown, IconCheckCircle, IconAlertTriangle, IconXCircle, IconAlertCircle } from '../../components/common/icons';

function hariTerlambat(jatuhTempo) {
  const d = parseTanggalFleksibel(jatuhTempo);
  if (!d) return 0;
  const diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function DashboardEksekutifTab() {
  const { siswa, tahunAjaran, tahunAjaranAktif, pembayaran, pengeluaran, pemasukanLain, allTagihan, tagihanTerbayar, aset } = useAppData();
  const [taLabel, setTaLabel] = useState(null);
  const labelDipakai = taLabel || tahunAjaranAktif?.label;

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const ringkasanKeuangan = useMemo(() => {
    if (!labelDipakai) return { pemasukan: 0, pengeluaran: 0, labaRugi: 0 };
    const p = rekapPemasukanBulanan(labelDipakai, pembayaran, pemasukanLain).reduce((s, r) => s + r.total, 0);
    const k = rekapPengeluaranBulanan(labelDipakai, pengeluaran).reduce((s, r) => s + r.total, 0);
    return { pemasukan: p, pengeluaran: k, labaRugi: p - k };
  }, [labelDipakai, pembayaran, pengeluaran, pemasukanLain]);

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
          <InfoCard icon={IconUsers} color="c-green" value={siswaAktif.length} label="Siswa Aktif" />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>KEUANGAN — {labelDipakai}</div>
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <InfoCard icon={IconTrendUp} color="c-blue" value={formatRupiah(ringkasanKeuangan.pemasukan)} label="Pemasukan" valueFontSize={17} />
          <InfoCard icon={IconTrendDown} color="c-red" value={formatRupiah(ringkasanKeuangan.pengeluaran)} label="Pengeluaran" valueFontSize={17} />
          <InfoCard
            icon={ringkasanKeuangan.labaRugi >= 0 ? IconCheckCircle : IconAlertTriangle}
            color={ringkasanKeuangan.labaRugi >= 0 ? 'c-green' : 'c-red'}
            value={formatRupiah(ringkasanKeuangan.labaRugi)}
            label={ringkasanKeuangan.labaRugi >= 0 ? 'Laba' : 'Rugi'}
            valueFontSize={17}
          />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>TUNGGAKAN (SEMUA TAHUN AJARAN)</div>
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <InfoCard icon={IconUsers} color="c-gold" value={tunggakan.jumlahSiswa} label="Siswa Menunggak" />
          <InfoCard icon={IconAlertCircle} color="c-red" value={formatRupiah(tunggakan.totalNominal)} label="Total Tunggakan" valueFontSize={17} />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>SARPRAS</div>
        <div className="info-grid">
          <InfoCard icon={IconCheckCircle} color="c-green" value={kondisiAset['Baik']} label="Unit Baik" />
          <InfoCard icon={IconAlertTriangle} color="c-gold" value={kondisiAset['Rusak Ringan']} label="Unit Rusak Ringan" />
          <InfoCard icon={IconXCircle} color="c-red" value={kondisiAset['Rusak Berat']} label="Unit Rusak Berat" />
        </div>
      </div>
    </div>
  );
}
