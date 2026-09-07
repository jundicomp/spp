import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan } from '../../db/laporanHelpers';
import { formatRupiah } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconGraduationCap, IconMoney, IconTrendUp } from '../../components/common/icons';

export default function RekapitulasiTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pemasukanLain, pembayaranLoaded, pemasukanLainLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);

  const labelDipakai = taLabel || tahunAjaranAktif?.label;
  const rekap = useMemo(() => labelDipakai ? rekapPemasukanBulanan(labelDipakai, pembayaran, pemasukanLain) : [], [labelDipakai, pembayaran, pemasukanLain]);

  const totalSetahun = useMemo(() => ({
    spp: rekap.reduce((s, r) => s + r.spp, 0),
    lain: rekap.reduce((s, r) => s + r.lain, 0),
    lainnya: rekap.reduce((s, r) => s + r.lainnya, 0),
    total: rekap.reduce((s, r) => s + r.total, 0),
  }), [rekap]);

  const dataSiap = pembayaranLoaded || pemasukanLainLoaded;

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
        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {dataSiap && (
          <>
            <div className="info-grid" style={{ marginBottom: 20 }}>
              <InfoCard icon={IconGraduationCap} color="c-green" value={formatRupiah(totalSetahun.spp)} label="Total SPP Setahun" valueFontSize={17} />
              <InfoCard icon={IconMoney} color="c-blue" value={formatRupiah(totalSetahun.lain)} label="Total Biaya Lain Siswa" valueFontSize={17} />
              <InfoCard icon={IconMoney} color="c-gold" value={formatRupiah(totalSetahun.lainnya)} label="Total Pemasukan Lain (Non-Siswa)" valueFontSize={17} />
              <InfoCard icon={IconTrendUp} color="c-purple" value={formatRupiah(totalSetahun.total)} label="Total Pemasukan" valueFontSize={17} />
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Bulan</th><th>SPP</th><th>Biaya Lain Siswa</th><th>Pemasukan Lain (Non-Siswa)</th><th>Total</th></tr></thead>
                <tbody>
                  {rekap.map(r => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td>{formatRupiah(r.spp)}</td>
                      <td>{formatRupiah(r.lain)}</td>
                      <td>{formatRupiah(r.lainnya)}</td>
                      <td style={{ fontWeight: 700 }}>{formatRupiah(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800 }}>
                    <td>Total Setahun</td>
                    <td>{formatRupiah(totalSetahun.spp)}</td>
                    <td>{formatRupiah(totalSetahun.lain)}</td>
                    <td>{formatRupiah(totalSetahun.lainnya)}</td>
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
