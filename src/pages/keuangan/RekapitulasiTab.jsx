import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan } from '../../db/laporanHelpers';
import { formatRupiah } from '../../db/helpers';

export default function RekapitulasiTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pembayaranLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);

  const labelDipakai = taLabel || tahunAjaranAktif?.label;
  const rekap = useMemo(() => labelDipakai ? rekapPemasukanBulanan(labelDipakai, pembayaran) : [], [labelDipakai, pembayaran]);

  const totalSetahun = useMemo(() => ({
    spp: rekap.reduce((s, r) => s + r.spp, 0),
    lain: rekap.reduce((s, r) => s + r.lain, 0),
    total: rekap.reduce((s, r) => s + r.total, 0),
  }), [rekap]);

  if (tahunAjaran.length === 0) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran. Atur dulu lewat menu Profil Sekolah &amp; Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>📈 Rekapitulasi Pemasukan</h3><p>Uang yang benar-benar diterima per bulan — Pemutihan Piutang tidak dihitung sbg pemasukan.</p></div>
        <select value={labelDipakai || ''} onChange={e => setTaLabel(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
        </select>
      </div>
      <div className="card-body">
        {!pembayaranLoaded && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {pembayaranLoaded && (
          <>
            <div className="info-grid" style={{ marginBottom: 20 }}>
              <div className="info-card c-green"><div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.spp)}</div><div className="info-label">Total SPP Setahun</div></div>
              <div className="info-card c-blue"><div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.lain)}</div><div className="info-label">Total Biaya Lain</div></div>
              <div className="info-card c-purple"><div className="info-value" style={{ fontSize: 18 }}>{formatRupiah(totalSetahun.total)}</div><div className="info-label">Total Pemasukan</div></div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Bulan</th><th>Pemasukan SPP</th><th>Pemasukan Lain</th><th>Total</th></tr></thead>
                <tbody>
                  {rekap.map(r => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td>{formatRupiah(r.spp)}</td>
                      <td>{formatRupiah(r.lain)}</td>
                      <td style={{ fontWeight: 700 }}>{formatRupiah(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800 }}>
                    <td>Total Setahun</td>
                    <td>{formatRupiah(totalSetahun.spp)}</td>
                    <td>{formatRupiah(totalSetahun.lain)}</td>
                    <td>{formatRupiah(totalSetahun.total)}</td>
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
