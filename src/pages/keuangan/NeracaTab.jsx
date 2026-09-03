import { useMemo } from 'react';
import { useAppData } from '../../context/AppContext';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { formatRupiah } from '../../db/helpers';

export default function NeracaTab() {
  const { pembayaran, pengeluaran, allTagihan, tagihanTerbayar, pembayaranLoaded, pengeluaranLoaded } = useAppData();

  const ringkasan = useMemo(() => {
    const totalPemasukan = pembayaranAsli(pembayaran).reduce((s, p) => s + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((s, p) => s + p.nominal, 0);
    const kas = totalPemasukan - totalPengeluaran;

    const piutang = allTagihan.reduce((s, t) => {
      const terbayar = tagihanTerbayar(t.refType, t.no);
      const sisa = t.nominal - terbayar;
      return s + (sisa > 0 ? sisa : 0);
    }, 0);

    const totalAktiva = kas + piutang;
    return { kas, piutang, totalAktiva };
  }, [pembayaran, pengeluaran, allTagihan, tagihanTerbayar]);

  const dataSiap = pembayaranLoaded || pengeluaranLoaded;

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Neraca (Sederhana)</h3><p>Posisi keuangan kumulatif sejak awal pencatatan, bukan per tahun ajaran.</p></div>
      </div>
      <div className="card-body">
        <div className="card" style={{ background: 'var(--gold-soft)', marginBottom: 18 }}>
          <div className="card-body" style={{ fontSize: 12.5, color: '#8a5b00' }}>
            Versi sederhana. Aplikasi ini belum mencatat nilai (harga) aset tetap (meja, proyektor, dst -- cuma jumlah unit)
            dan belum ada modul pencatatan kewajiban/utang. Neraca ini hanya menghitung Kas (kumulatif pemasukan dikurangi
            pengeluaran) dan Piutang Siswa (tagihan yang belum lunas) -- bukan neraca akuntansi penuh.
          </div>
        </div>

        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {dataSiap && (
          <div className="table-scroll">
            <table>
              <thead><tr><th colSpan={2}>AKTIVA</th></tr></thead>
              <tbody>
                <tr><td>Kas (kumulatif pemasukan dikurangi pengeluaran)</td><td style={{ fontWeight: 700 }}>{formatRupiah(ringkasan.kas)}</td></tr>
                <tr><td>Piutang Siswa (tagihan belum lunas)</td><td style={{ fontWeight: 700 }}>{formatRupiah(ringkasan.piutang)}</td></tr>
                <tr style={{ fontWeight: 800, background: '#F6F8F5' }}><td>Total Aktiva</td><td>{formatRupiah(ringkasan.totalAktiva)}</td></tr>
              </tbody>
              <thead><tr><th colSpan={2}>KEWAJIBAN</th></tr></thead>
              <tbody>
                <tr><td style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Belum ada modul pencatatan kewajiban/utang</td><td>{formatRupiah(0)}</td></tr>
              </tbody>
              <thead><tr><th colSpan={2}>MODAL / EKUITAS BERSIH</th></tr></thead>
              <tbody>
                <tr style={{ fontWeight: 800, background: 'var(--green-soft)' }}><td>Total Aktiva dikurangi Total Kewajiban</td><td style={{ color: 'var(--green-dark)' }}>{formatRupiah(ringkasan.totalAktiva)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
