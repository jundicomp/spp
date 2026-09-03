import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan } from '../../db/laporanHelpers';
import { formatRupiah } from '../../db/helpers';

export default function LabaRugiTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pengeluaran, pembayaranLoaded, pengeluaranLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);

  const labelDipakai = taLabel || tahunAjaranAktif?.label;

  const gabungan = useMemo(() => {
    if (!labelDipakai) return [];
    const pemasukan = rekapPemasukanBulanan(labelDipakai, pembayaran);
    const pengeluaranBulan = rekapPengeluaranBulanan(labelDipakai, pengeluaran);
    return pemasukan.map((p, i) => ({
      label: p.label,
      pemasukan: p.total,
      pengeluaran: pengeluaranBulan[i].total,
      labaRugi: p.total - pengeluaranBulan[i].total,
    }));
  }, [labelDipakai, pembayaran, pengeluaran]);

  const totalSetahun = useMemo(() => ({
    pemasukan: gabungan.reduce((s, g) => s + g.pemasukan, 0),
    pengeluaran: gabungan.reduce((s, g) => s + g.pengeluaran, 0),
    labaRugi: gabungan.reduce((s, g) => s + g.labaRugi, 0),
  }), [gabungan]);

  const dataSiap = pembayaranLoaded || pengeluaranLoaded;

  if (tahunAjaran.length === 0) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>📊 Laba Rugi</h3><p>Selisih pemasukan sungguhan dan pengeluaran, per bulan.</p></div>
        <select value={labelDipakai || ''} onChange={e => setTaLabel(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
        </select>
      </div>
      <div className="card-body">
        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {dataSiap && (
          <>
            <div className="info-grid" style={{ marginBottom: 20 }}>
              <div className="info-card c-green"><div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.pemasukan)}</div><div className="info-label">Total Pemasukan</div></div>
              <div className="info-card c-red"><div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.pengeluaran)}</div><div className="info-label">Total Pengeluaran</div></div>
              <div className={`info-card ${totalSetahun.labaRugi >= 0 ? 'c-blue' : 'c-red'}`}>
                <div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.labaRugi)}</div>
                <div className="info-label">{totalSetahun.labaRugi >= 0 ? 'Laba Setahun' : 'Rugi Setahun'}</div>
              </div>
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
      </div>
    </div>
  );
}
