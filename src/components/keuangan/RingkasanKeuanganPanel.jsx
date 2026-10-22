import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../../context/AppContext';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan, pembayaranAsli, piutangAsOf, totalAsOf } from '../../db/laporanHelpers';
import { akunAktivaOptions } from '../../db/akunBukuBesarFields';
import { formatRupiah, formatTanggalTampil, parseTanggalFleksibel, todayWIB } from '../../db/helpers';
import InfoCard from '../common/InfoCard';
import { IconTrendUp, IconTrendDown, IconMoney, IconAlertCircle } from '../common/icons';

const WARNA_KOMPOSISI = ['#1C7A3C', '#F0B429', '#5B3E8E']; // SPP, Biaya Lain Siswa, Pemasukan Lain

// Panel "Ringkasan Keuangan" -- 5 kartu KPI + tren pemasukan/pengeluaran + komposisi
// pemasukan + pengeluaran per kategori + saldo per akun kas/bank + aktivitas terbaru.
// Diekstrak jadi komponen TERSENDIRI (bukan ditulis ulang) supaya Dashboard.jsx
// (ringkasan sekilas lintas-modul) dan DashboardKeuangan.jsx (halaman khusus modul
// Keuangan, v1.31.38) SELALU menampilkan angka & grafik yg identik -- satu sumber
// logika, dua tempat pakai.
export default function RingkasanKeuanganPanel() {
  const {
    tahunAjaranAktif, pembayaran, pembayaranLoaded, pengeluaran, pengeluaranLoaded,
    pemasukanLain, allTagihan, akun, beasiswaSiswa, beasiswaKategori,
  } = useAppData();

  // Snapshot waktu "sekarang" sekali saat panel dibuka -- dipakai utk semua perhitungan
  // "as-of hari ini" (saldo kas, piutang), SAMA seperti pola di Neraca/Buku Besar.
  const cutoffMs = useMemo(() => Date.now(), []);
  const keuanganSiap = tahunAjaranAktif && pembayaranLoaded && pengeluaranLoaded;

  const rekapKeuangan = useMemo(() => {
    if (!keuanganSiap) return null;
    const pemasukanBulanan = rekapPemasukanBulanan(tahunAjaranAktif.label, pembayaran, pemasukanLain);
    const pengeluaranBulanan = rekapPengeluaranBulanan(tahunAjaranAktif.label, pengeluaran);
    const [tahunIni, bulanIni] = todayWIB().split('-').map(Number); // yyyy-MM-dd -> [yyyy, MM]
    const bulanBerjalan = pemasukanBulanan.find(b => b.monthIdx === bulanIni - 1 && b.calYear === tahunIni);
    const pengeluaranBerjalan = pengeluaranBulanan.find(b => b.monthIdx === bulanIni - 1 && b.calYear === tahunIni);
    const dataChart = pemasukanBulanan.map((b, i) => ({
      bulan: b.label.split(' ')[0].slice(0, 3),
      Pemasukan: b.total,
      Pengeluaran: pengeluaranBulanan[i]?.total || 0,
    }));
    // Komposisi Pemasukan tahun ajaran berjalan (s.d. hari ini) -- dijumlah dari rekap
    // bulanan yg sama (bulan yg belum sampai otomatis 0 krn belum ada transaksinya).
    const komposisi = pemasukanBulanan.reduce((s, b) => ({
      spp: s.spp + b.spp, biayaLain: s.biayaLain + b.lain, lainnya: s.lainnya + b.lainnya,
    }), { spp: 0, biayaLain: 0, lainnya: 0 });
    return {
      pemasukanBulanIni: bulanBerjalan?.total || 0,
      pengeluaranBulanIni: pengeluaranBerjalan?.total || 0,
      dataChart,
      komposisi,
      bulanBerjalanLabel: bulanBerjalan?.label || '',
    };
  }, [keuanganSiap, tahunAjaranAktif, pembayaran, pengeluaran, pemasukanLain]);

  // Piutang/tunggakan "as-of hari ini" -- pakai piutangAsOf yg SAMA dgn Neraca/Buku
  // Besar (mempertimbangkan beasiswa & tagihan yg blm jatuh tempo), supaya angkanya
  // konsisten di semua laporan.
  const piutangTotal = useMemo(() => {
    return piutangAsOf(allTagihan, pembayaran, cutoffMs, beasiswaSiswa, beasiswaKategori);
  }, [allTagihan, pembayaran, cutoffMs, beasiswaSiswa, beasiswaKategori]);

  // Daftar SEMUA akun kas/bank (Kas bawaan + akun custom bertipe Aktiva) -- helper yg
  // SAMA dipakai Neraca & form pembayaran, supaya "Saldo Kas Total" di sini SELALU
  // sama dgn Neraca.
  const daftarAkunKasBank = useMemo(() => akunAktivaOptions(akun), [akun]);

  const saldoKas = useMemo(() => {
    const asli = pembayaranAsli(pembayaran);
    const saldoPerAkun = daftarAkunKasBank.map(nama => {
      const masuk = totalAsOf(asli, p => p.tanggalBayar, p => p.nominal, p => p.akun, cutoffMs, nama)
        + totalAsOf(pemasukanLain, p => p.tanggal, p => p.nominal, p => p.akun, cutoffMs, nama);
      const keluar = totalAsOf(pengeluaran, p => p.tanggal, p => p.nominal, p => p.akun, cutoffMs, nama);
      return { nama, saldo: masuk - keluar };
    });
    return { saldoPerAkun, total: saldoPerAkun.reduce((s, a) => s + a.saldo, 0) };
  }, [pembayaran, pemasukanLain, pengeluaran, daftarAkunKasBank, cutoffMs]);

  // Pengeluaran per kategori BULAN INI -- utk grafik batang horizontal.
  const pengeluaranPerKategori = useMemo(() => {
    const [tahunIni, bulanIni] = todayWIB().split('-').map(Number);
    const map = {};
    pengeluaran.forEach(p => {
      const d = parseTanggalFleksibel(p.tanggal);
      if (!d || d.getMonth() !== bulanIni - 1 || d.getFullYear() !== tahunIni) return;
      map[p.kategori] = (map[p.kategori] || 0) + p.nominal;
    });
    return Object.entries(map)
      .map(([kategori, nominal]) => ({ kategori, nominal }))
      .sort((a, b) => b.nominal - a.nominal);
  }, [pengeluaran]);

  // Aktivitas Terbaru -- gabungan Pembayaran (SPP/Biaya Lain) + Pemasukan Lain +
  // Pengeluaran, diurut tanggal terbaru dulu, diambil 8 teratas.
  const aktivitasTerbaru = useMemo(() => {
    const list = [];
    pembayaranAsli(pembayaran).forEach(p => {
      list.push({
        label: `Pembayaran ${p.refType === 'SPP' ? 'SPP' : 'Biaya Lain'} — ${p.namaSiswa || '-'}`,
        tanggal: p.tanggalBayar, nominal: p.nominal, masuk: true,
      });
    });
    pemasukanLain.forEach(p => {
      list.push({ label: `Pemasukan Lain — ${p.keterangan || p.kategori}`, tanggal: p.tanggal, nominal: p.nominal, masuk: true });
    });
    pengeluaran.forEach(p => {
      list.push({ label: `Pengeluaran — ${p.keterangan || p.kategori}`, tanggal: p.tanggal, nominal: p.nominal, masuk: false });
    });
    return list
      .map(it => ({ ...it, waktu: parseTanggalFleksibel(it.tanggal)?.getTime() || 0 }))
      .sort((a, b) => b.waktu - a.waktu)
      .slice(0, 8);
  }, [pembayaran, pemasukanLain, pengeluaran]);

  if (!keuanganSiap) {
    return <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data keuangan...</p>;
  }

  const labaRugi = rekapKeuangan.pemasukanBulanIni - rekapKeuangan.pengeluaranBulanIni;
  const totalKomposisi = rekapKeuangan.komposisi.spp + rekapKeuangan.komposisi.biayaLain + rekapKeuangan.komposisi.lainnya;
  const dataKomposisi = [
    { name: 'SPP', value: rekapKeuangan.komposisi.spp },
    { name: 'Biaya Lain Siswa', value: rekapKeuangan.komposisi.biayaLain },
    { name: 'Pemasukan Lain', value: rekapKeuangan.komposisi.lainnya },
  ].filter(d => d.value > 0);

  return (
    <>
      <div className="info-grid-5" style={{ marginBottom: 20 }}>
        <InfoCard icon={IconMoney} color="c-blue" value={formatRupiah(saldoKas.total)} label="Saldo Kas Total" valueFontSize={18} />
        <InfoCard icon={IconTrendUp} color="c-green" value={formatRupiah(rekapKeuangan.pemasukanBulanIni)} label="Pemasukan Bulan Ini" valueFontSize={18} />
        <InfoCard icon={IconTrendDown} color="c-red" value={formatRupiah(rekapKeuangan.pengeluaranBulanIni)} label="Pengeluaran Bulan Ini" valueFontSize={18} />
        <InfoCard
          icon={labaRugi >= 0 ? IconTrendUp : IconTrendDown}
          color={labaRugi >= 0 ? 'c-green' : 'c-red'}
          value={`${labaRugi >= 0 ? '+ ' : '− '}${formatRupiah(Math.abs(labaRugi))}`}
          label="Laba / Rugi Bulan Ini"
          valueFontSize={18}
        />
        <InfoCard icon={IconAlertCircle} color="c-gold" value={formatRupiah(piutangTotal)} label="Total Piutang / Tunggakan" valueFontSize={18} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '2 1 420px', minWidth: 280 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Tren Pemasukan vs Pengeluaran</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rekapKeuangan.dataChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(v) => formatRupiah(v)} />
              <Legend />
              <Bar dataKey="Pemasukan" fill="#16794a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#c0392b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Komposisi Pemasukan</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>Tahun ajaran berjalan, s.d. hari ini</p>
          {totalKomposisi === 0 ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada pemasukan tercatat.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dataKomposisi} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {dataKomposisi.map((_, i) => <Cell key={i} fill={WARNA_KOMPOSISI[i % WARNA_KOMPOSISI.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '1 1 340px', minWidth: 280 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Pengeluaran per Kategori</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>Bulan {rekapKeuangan.bulanBerjalanLabel}</p>
          {pengeluaranPerKategori.length === 0 ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada pengeluaran bulan ini.</p> : (
            <ResponsiveContainer width="100%" height={Math.max(160, pengeluaranPerKategori.length * 34)}>
              <BarChart data={pengeluaranPerKategori} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                <YAxis type="category" dataKey="kategori" tick={{ fontSize: 11.5 }} width={130} />
                <Tooltip formatter={(v) => formatRupiah(v)} />
                <Bar dataKey="nominal" fill="#1E4FA0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 240 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Saldo per Akun Kas / Bank</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>Per hari ini</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saldoKas.saldoPerAkun.map(a => (
              <div key={a.nama} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: a.saldo < 0 ? 'var(--red-soft)' : 'var(--green-soft)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{a.nama}</span>
                <strong style={{ fontSize: 13, color: a.saldo < 0 ? 'var(--red)' : 'var(--green-dark)' }}>{formatRupiah(a.saldo)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Aktivitas Terbaru</div>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>{aktivitasTerbaru.length} transaksi terakhir, tergabung dari Pembayaran, Pemasukan Lain &amp; Pengeluaran</p>
        {aktivitasTerbaru.length === 0 ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada transaksi tercatat.</p> : (
          <div>
            {aktivitasTerbaru.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < aktivitasTerbaru.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatTanggalTampil(a.tanggal)}</div>
                </div>
                <strong style={{ color: a.masuk ? 'var(--green)' : 'var(--red)' }}>{a.masuk ? '+ ' : '− '}{formatRupiah(a.nominal)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
