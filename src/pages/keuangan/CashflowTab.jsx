import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppData } from '../../context/AppContext';
import { rekapCashflowBulanan } from '../../db/laporanHelpers';
import { formatRupiah } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconTrendUp, IconTrendDown, IconMoney, IconCheckCircle, IconAlertTriangle } from '../../components/common/icons';

export default function CashflowTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pemasukanLain, pengeluaran, pembayaranLoaded, pemasukanLainLoaded, pengeluaranLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);
  const [saldoAwalInput, setSaldoAwalInput] = useState('0');

  const labelDipakai = taLabel || tahunAjaranAktif?.label;
  const saldoAwal = Number(saldoAwalInput) || 0;

  const cashflow = useMemo(
    () => labelDipakai ? rekapCashflowBulanan(labelDipakai, pembayaran, pemasukanLain, pengeluaran, saldoAwal) : [],
    [labelDipakai, pembayaran, pemasukanLain, pengeluaran, saldoAwal]
  );

  const totalSetahun = useMemo(() => ({
    kasMasuk: cashflow.reduce((s, c) => s + c.kasMasuk, 0),
    kasKeluar: cashflow.reduce((s, c) => s + c.kasKeluar, 0),
  }), [cashflow]);

  const saldoAkhirPeriode = cashflow.length > 0 ? cashflow[cashflow.length - 1].saldoAkhirBulan : saldoAwal;
  const dataSiap = pembayaranLoaded || pemasukanLainLoaded || pengeluaranLoaded;

  if (tahunAjaran.length === 0) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>💵 Cashflow &amp; Kondisi Kas</h3><p>Arus kas masuk-keluar per bulan, dan saldo kas berjalan sepanjang tahun ajaran.</p></div>
        <select value={labelDipakai || ''} onChange={e => setTaLabel(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
        </select>
      </div>
      <div className="card-body">
        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {dataSiap && (
          <>
            <div style={{ marginBottom: 18, maxWidth: 340 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Saldo Kas Awal (sebelum tahun ajaran ini, opsional)
              </label>
              <input
                type="number" value={saldoAwalInput} onChange={e => setSaldoAwalInput(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Isi kalau sekolah sudah punya sisa kas dari sebelum data ini dicatat -- kalau kosong dianggap mulai dari Rp 0.</p>
            </div>

            <div className="info-grid" style={{ marginBottom: 20 }}>
              <InfoCard icon={IconTrendUp} color="c-green" value={formatRupiah(totalSetahun.kasMasuk)} label="Total Kas Masuk Setahun" valueFontSize={17} />
              <InfoCard icon={IconTrendDown} color="c-red" value={formatRupiah(totalSetahun.kasKeluar)} label="Total Kas Keluar Setahun" valueFontSize={17} />
              <InfoCard
                icon={saldoAkhirPeriode >= 0 ? IconCheckCircle : IconAlertTriangle}
                color={saldoAkhirPeriode >= 0 ? 'c-blue' : 'c-red'}
                value={formatRupiah(saldoAkhirPeriode)}
                label="Saldo Kas Akhir Periode"
                valueFontSize={18}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Tren Saldo Kas Berjalan</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={l => String(l).split(' ')[0]} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'jt'} />
                  <Tooltip formatter={v => formatRupiah(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="saldoAkhirBulan" name="Saldo Kas" stroke="#123D22" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="table-scroll">
              <table>
                <thead><tr><th>Bulan</th><th>Kas Masuk</th><th>Kas Keluar</th><th>Net Bulan Ini</th><th>Saldo Akhir Bulan</th></tr></thead>
                <tbody>
                  <tr style={{ background: '#F6F8F5' }}>
                    <td colSpan={4} style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Saldo Awal (sebelum tahun ajaran ini)</td>
                    <td style={{ fontWeight: 700 }}>{formatRupiah(saldoAwal)}</td>
                  </tr>
                  {cashflow.map(c => (
                    <tr key={c.label}>
                      <td>{c.label}</td>
                      <td>{formatRupiah(c.kasMasuk)}</td>
                      <td>{formatRupiah(c.kasKeluar)}</td>
                      <td style={{ fontWeight: 700, color: c.netBulanIni >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>
                        {c.netBulanIni >= 0 ? '+' : ''}{formatRupiah(c.netBulanIni)}
                      </td>
                      <td style={{ fontWeight: 800, color: c.saldoAkhirBulan >= 0 ? 'var(--green-dark)' : 'var(--red)' }}>{formatRupiah(c.saldoAkhirBulan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
