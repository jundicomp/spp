import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan, pembayaranAsli, bulanTahunAjaran } from '../../db/laporanHelpers';
import { KATEGORI_PENGELUARAN_OPTIONS } from '../../db/pengeluaranFields';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconTrendUp, IconTrendDown, IconCheckCircle, IconAlertTriangle } from '../../components/common/icons';

export default function LabaRugiTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pengeluaran, pemasukanLain, pembayaranLoaded, pengeluaranLoaded, pemasukanLainLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);
  const [bulanIdx, setBulanIdx] = useState(null); // null = "Semua Bulan" (tabel ringkas)

  const labelDipakai = taLabel || tahunAjaranAktif?.label;
  const bulanList = useMemo(() => labelDipakai ? bulanTahunAjaran(labelDipakai) : [], [labelDipakai]);
  const bulanTerpilih = bulanIdx !== null ? bulanList[bulanIdx] : null;

  const gabungan = useMemo(() => {
    if (!labelDipakai) return [];
    const pemasukan = rekapPemasukanBulanan(labelDipakai, pembayaran, pemasukanLain);
    const pengeluaranBulan = rekapPengeluaranBulanan(labelDipakai, pengeluaran);
    return pemasukan.map((p, i) => ({
      label: p.label,
      pemasukan: p.total,
      pengeluaran: pengeluaranBulan[i].total,
      labaRugi: p.total - pengeluaranBulan[i].total,
    }));
  }, [labelDipakai, pembayaran, pengeluaran, pemasukanLain]);

  const totalSetahun = useMemo(() => ({
    pemasukan: gabungan.reduce((s, g) => s + g.pemasukan, 0),
    pengeluaran: gabungan.reduce((s, g) => s + g.pengeluaran, 0),
    labaRugi: gabungan.reduce((s, g) => s + g.labaRugi, 0),
  }), [gabungan]);

  // Rincian utk 1 BULAN SPESIFIK -- disusun VERTIKAL (Pendapatan lalu Pengeluaran lalu
  // Laba/Rugi), persis gaya Neraca, bukan tabel ringkas 12-baris.
  const rincianBulan = useMemo(() => {
    if (!bulanTerpilih) return null;
    const dalamBulan = (tglRaw) => {
      const d = parseTanggalFleksibel(tglRaw);
      return d && d.getMonth() === bulanTerpilih.monthIdx && d.getFullYear() === bulanTerpilih.calYear;
    };
    const asli = pembayaranAsli(pembayaran).filter(p => dalamBulan(p.tanggalBayar));
    const spp = asli.filter(p => p.refType === 'SPP').reduce((s, p) => s + p.nominal, 0);
    const biayaLainSiswa = asli.filter(p => p.refType === 'LAIN').reduce((s, p) => s + p.nominal, 0);
    const pemasukanLainBulan = pemasukanLain.filter(p => dalamBulan(p.tanggal)).reduce((s, p) => s + p.nominal, 0);
    const totalPendapatan = spp + biayaLainSiswa + pemasukanLainBulan;

    const pengeluaranBulan = pengeluaran.filter(p => dalamBulan(p.tanggal));
    const perKategori = KATEGORI_PENGELUARAN_OPTIONS.map(k => ({
      kategori: k,
      nominal: pengeluaranBulan.filter(p => p.kategori === k).reduce((s, p) => s + p.nominal, 0),
    }));
    const totalPengeluaran = perKategori.reduce((s, k) => s + k.nominal, 0);

    return { spp, biayaLainSiswa, pemasukanLainBulan, totalPendapatan, perKategori, totalPengeluaran, labaRugi: totalPendapatan - totalPengeluaran };
  }, [bulanTerpilih, pembayaran, pemasukanLain, pengeluaran]);

  const dataSiap = pembayaranLoaded || pengeluaranLoaded || pemasukanLainLoaded;

  if (tahunAjaran.length === 0) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>📊 Laba Rugi</h3><p>{bulanTerpilih ? `Rincian ${bulanTerpilih.label}.` : 'Selisih pemasukan sungguhan dan pengeluaran, per bulan.'}</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={labelDipakai || ''} onChange={e => { setTaLabel(e.target.value); setBulanIdx(null); }} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
          </select>
          <select value={bulanIdx === null ? '' : bulanIdx} onChange={e => setBulanIdx(e.target.value === '' ? null : Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            <option value="">Semua Bulan (Ringkas)</option>
            {bulanList.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
          </select>
        </div>
      </div>
      <div className="card-body">
        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}

        {dataSiap && !bulanTerpilih && (
          <>
            <div className="info-grid" style={{ marginBottom: 20 }}>
              <InfoCard icon={IconTrendUp} color="c-green" value={formatRupiah(totalSetahun.pemasukan)} label="Total Pemasukan" valueFontSize={18} />
              <InfoCard icon={IconTrendDown} color="c-red" value={formatRupiah(totalSetahun.pengeluaran)} label="Total Pengeluaran" valueFontSize={18} />
              <InfoCard
                icon={totalSetahun.labaRugi >= 0 ? IconCheckCircle : IconAlertTriangle}
                color={totalSetahun.labaRugi >= 0 ? 'c-blue' : 'c-red'}
                value={formatRupiah(totalSetahun.labaRugi)}
                label={totalSetahun.labaRugi >= 0 ? 'Laba Setahun' : 'Rugi Setahun'}
                valueFontSize={18}
              />
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Laba / Rugi</th></tr></thead>
                <tbody>
                  {gabungan.map(g => (
                    <tr key={g.label}>
                      <td>{g.label}</td>
                      <td>{formatRupiah(g.pemasukan)}</td>
                      <td>{formatRupiah(g.pengeluaran)}</td>
                      <td style={{ fontWeight: 700, color: g.labaRugi >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>
                        {g.labaRugi >= 0 ? '+' : ''}{formatRupiah(g.labaRugi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800 }}>
                    <td>Total Setahun</td>
                    <td>{formatRupiah(totalSetahun.pemasukan)}</td>
                    <td>{formatRupiah(totalSetahun.pengeluaran)}</td>
                    <td style={{ color: totalSetahun.labaRugi >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>
                      {totalSetahun.labaRugi >= 0 ? '+' : ''}{formatRupiah(totalSetahun.labaRugi)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {dataSiap && bulanTerpilih && rincianBulan && (
          <div className="table-scroll">
            <table>
              <thead><tr><th colSpan={2}>PENDAPATAN</th></tr></thead>
              <tbody>
                <tr><td>Pendapatan SPP</td><td style={{ fontWeight: 700 }}>{formatRupiah(rincianBulan.spp)}</td></tr>
                <tr><td>Pendapatan Biaya Lain Siswa</td><td style={{ fontWeight: 700 }}>{formatRupiah(rincianBulan.biayaLainSiswa)}</td></tr>
                <tr><td>Pendapatan Lain-lain (Non-Siswa)</td><td style={{ fontWeight: 700 }}>{formatRupiah(rincianBulan.pemasukanLainBulan)}</td></tr>
                <tr style={{ fontWeight: 800, background: '#F6F8F5' }}><td>Total Pendapatan</td><td>{formatRupiah(rincianBulan.totalPendapatan)}</td></tr>
              </tbody>
              <thead><tr><th colSpan={2}>PENGELUARAN (BEBAN)</th></tr></thead>
              <tbody>
                {rincianBulan.perKategori.map(k => (
                  <tr key={k.kategori}><td>Beban {k.kategori}</td><td style={{ fontWeight: 700 }}>{formatRupiah(k.nominal)}</td></tr>
                ))}
                <tr style={{ fontWeight: 800, background: '#F6F8F5' }}><td>Total Pengeluaran</td><td>{formatRupiah(rincianBulan.totalPengeluaran)}</td></tr>
              </tbody>
              <thead><tr><th colSpan={2}>LABA / RUGI BERSIH</th></tr></thead>
              <tbody>
                <tr style={{ fontWeight: 800, background: rincianBulan.labaRugi >= 0 ? 'var(--green-soft)' : '#F8E7E3' }}>
                  <td>Total Pendapatan dikurangi Total Pengeluaran</td>
                  <td style={{ color: rincianBulan.labaRugi >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>
                    {rincianBulan.labaRugi >= 0 ? '+' : ''}{formatRupiah(rincianBulan.labaRugi)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
