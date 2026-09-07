import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { pembayaranAsli, bulanTahunAjaran } from '../../db/laporanHelpers';
import { AKUN_BAWAAN } from '../../db/akunBukuBesarFields';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';

// Hitung total nominal transaksi yg tanggalnya <= cutoff (as-of suatu titik waktu),
// OPSIONAL difilter ke akun kas/bank tertentu -- dipakai supaya Neraca bisa menampilkan
// SETIAP akun kas/bank secara terpisah (bukan digabung jadi 1 angka "Kas" saja).
function totalAsOf(items, getTanggal, getNominal, getAkun, cutoffMs, akunNama) {
  return items.reduce((s, it) => {
    const d = parseTanggalFleksibel(getTanggal(it));
    if (!d || d.getTime() > cutoffMs) return s;
    if (akunNama !== undefined) {
      const akunItem = getAkun(it) || 'Kas'; // data lama tanpa field akun -> fallback Kas
      if (akunItem !== akunNama) return s;
    }
    return s + getNominal(it);
  }, 0);
}

export default function NeracaTab() {
  const { tahunAjaran, tahunAjaranAktif, pembayaran, pengeluaran, pemasukanLain, allTagihan, akun, pembayaranLoaded, pengeluaranLoaded, pemasukanLainLoaded } = useAppData();
  const [taLabel, setTaLabel] = useState(null);
  const [bulanIdx, setBulanIdx] = useState(null); // null = "Sampai Hari Ini"

  const labelDipakai = taLabel || tahunAjaranAktif?.label;
  const bulanList = useMemo(() => labelDipakai ? bulanTahunAjaran(labelDipakai) : [], [labelDipakai]);
  const bulanTerpilih = bulanIdx !== null ? bulanList[bulanIdx] : null;

  const cutoffMs = useMemo(() => {
    const now = Date.now();
    if (!bulanTerpilih) return now;
    const akhirBulan = new Date(bulanTerpilih.calYear, bulanTerpilih.monthIdx + 1, 1).getTime() - 1;
    return Math.min(akhirBulan, now);
  }, [bulanTerpilih]);

  // Daftar SEMUA akun kas/bank (Kas bawaan + akun custom bertipe Aktiva) -- SEMUA
  // ditampilkan sbg baris terpisah di Neraca, TERMASUK yg saldonya 0 atau yg baru
  // saja dibuat, supaya user bisa lihat semua akun yg ada tanpa terkecuali.
  const daftarAkunKasBank = useMemo(() => {
    const bawaan = AKUN_BAWAAN.filter(a => a.isKasBank).map(a => ({ nama: a.nama, custom: false }));
    const custom = akun.filter(a => a.jenis === 'Aktiva').map(a => ({ nama: a.nama, custom: true }));
    return [...bawaan, ...custom];
  }, [akun]);

  const ringkasan = useMemo(() => {
    const asli = pembayaranAsli(pembayaran);

    const saldoPerAkun = daftarAkunKasBank.map(a => {
      const masuk = totalAsOf(asli, p => p.tanggalBayar, p => p.nominal, p => p.akun, cutoffMs, a.nama)
        + totalAsOf(pemasukanLain, p => p.tanggal, p => p.nominal, p => p.akun, cutoffMs, a.nama);
      const keluar = totalAsOf(pengeluaran, p => p.tanggal, p => p.nominal, p => p.akun, cutoffMs, a.nama);
      return { nama: a.nama, saldo: masuk - keluar };
    });
    const totalKas = saldoPerAkun.reduce((s, a) => s + a.saldo, 0);

    const piutang = allTagihan.reduce((s, t) => {
      const jt = parseTanggalFleksibel(t.jatuhTempo);
      if (!jt || jt.getTime() > cutoffMs) return s;
      const dibayarSampaiCutoff = pembayaran
        .filter(p => p.refType === t.refType && p.refNo === t.no && p.metode !== 'Pemutihan Piutang')
        .filter(p => { const d = parseTanggalFleksibel(p.tanggalBayar); return d && d.getTime() <= cutoffMs; })
        .reduce((sum, p) => sum + p.nominal, 0);
      const sisa = t.nominal - dibayarSampaiCutoff;
      return s + (sisa > 0 ? sisa : 0);
    }, 0);

    const totalAktiva = totalKas + piutang;
    return { saldoPerAkun, totalKas, piutang, totalAktiva };
  }, [pembayaran, pengeluaran, pemasukanLain, allTagihan, cutoffMs, daftarAkunKasBank]);

  const dataSiap = pembayaranLoaded || pengeluaranLoaded || pemasukanLainLoaded;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Neraca (Sederhana)</h3>
          <p>{bulanTerpilih ? `Posisi keuangan per akhir ${bulanTerpilih.label}.` : 'Posisi keuangan kumulatif sampai hari ini.'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={labelDipakai || ''} onChange={e => { setTaLabel(e.target.value); setBulanIdx(null); }} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            {tahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
          </select>
          <select value={bulanIdx === null ? '' : bulanIdx} onChange={e => setBulanIdx(e.target.value === '' ? null : Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            <option value="">Sampai Hari Ini</option>
            {bulanList.map((b, i) => <option key={b.label} value={i}>Per Akhir {b.label}</option>)}
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="card" style={{ background: 'var(--gold-soft)', marginBottom: 18 }}>
          <div className="card-body" style={{ fontSize: 12.5, color: '#8a5b00' }}>
            Versi sederhana. Aplikasi ini belum mencatat nilai (harga) aset tetap (meja, proyektor, dst -- cuma jumlah unit)
            dan belum ada modul pencatatan kewajiban/utang. Neraca ini menampilkan SEMUA akun kas/bank yang ada (termasuk
            yang baru dibuat di Buku Besar, walau saldonya masih 0) dan Piutang Siswa -- bukan neraca akuntansi penuh.
          </div>
        </div>

        {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
        {dataSiap && (
          <div className="table-scroll">
            <table>
              <thead><tr><th colSpan={2}>AKTIVA</th></tr></thead>
              <tbody>
                {ringkasan.saldoPerAkun.map(a => (
                  <tr key={a.nama}><td>{a.nama}</td><td style={{ fontWeight: 700 }}>{formatRupiah(a.saldo)}</td></tr>
                ))}
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
