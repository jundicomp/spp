import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Page from '../components/layout/Page';
import { useAppData } from '../context/AppContext';
import NotifikasiSiswaPerluTindakLanjut from '../components/common/NotifikasiSiswaPerluTindakLanjut';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan, pembayaranAsli, piutangAsOf, totalAsOf } from '../db/laporanHelpers';
import { akunAktivaOptions } from '../db/akunBukuBesarFields';
import { formatRupiah, formatTanggalTampil, parseTanggalFleksibel, todayWIB } from '../db/helpers';
import InfoCard from '../components/common/InfoCard';
import {
  IconGraduationCap, IconBuilding, IconUsers, IconTrendUp, IconTrendDown, IconMoney,
  IconAlertCircle, IconLayers, IconBox, IconCheckCircle, IconAlertTriangle, IconXCircle,
} from '../components/common/icons';

const WARNA_LP = ['#2563eb', '#7e3af2']; // Laki-laki, Perempuan
const WARNA_KONDISI = ['#16794a', '#c9962c', '#c0392b']; // Baik, Rusak Ringan, Rusak Berat
const WARNA_KOMPOSISI = ['#1C7A3C', '#F0B429', '#5B3E8E']; // SPP, Biaya Lain Siswa, Pemasukan Lain

export default function Dashboard() {
  const {
    siswa, siswaLoading, siswaError, siswaLoaded, refreshSiswa, kelas, guru, tahunAjaranAktif,
    aset, asetLoaded, allTagihan, pembayaran, pembayaranLoaded, pengeluaran, pengeluaranLoaded, pemasukanLain,
    akun, beasiswaSiswa, beasiswaKategori,
  } = useAppData();

  // Snapshot waktu "sekarang" sekali saat halaman dibuka -- dipakai utk semua
  // perhitungan "as-of hari ini" (saldo kas, piutang) di bawah, SAMA seperti pola
  // yg sudah dipakai Neraca/Buku Besar (lihat laporanHelpers.piutangAsOf/totalAsOf).
  const cutoffMs = useMemo(() => Date.now(), []);

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const stats = useMemo(() => {
    const perTingkat = {};
    const perGender = { 'Laki-laki': 0, 'Perempuan': 0, '-': 0 };
    siswaAktif.forEach(s => {
      const t = s.kelasTingkat || '-';
      perTingkat[t] = (perTingkat[t] || 0) + 1;
      const g = s.jenisKelamin === 'Laki-laki' || s.jenisKelamin === 'Perempuan' ? s.jenisKelamin : '-';
      perGender[g] += 1;
    });
    return { total: siswaAktif.length, perTingkat, perGender };
  }, [siswaAktif]);

  const tingkatList = Object.keys(stats.perTingkat).sort();
  const dataChartKelas = tingkatList.map(t => ({ kelas: `Kelas ${t}`, Siswa: stats.perTingkat[t] }));
  const dataChartGender = [
    { name: 'Laki-laki', value: stats.perGender['Laki-laki'] },
    { name: 'Perempuan', value: stats.perGender['Perempuan'] },
  ].filter(d => d.value > 0);

  // ==== Ringkasan Keuangan (bulan berjalan + tren 12 bulan, sesuai Laporan Keuangan) ====
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
  // Besar (mempertimbangkan beasiswa & tagihan yg blm jatuh tempo), bukan hitungan
  // mentah sebelumnya, supaya angkanya konsisten di semua laporan.
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

  // ==== Ringkasan Sarpras (sesuai Laporan Rekap Aset) ====
  const sarprasStats = useMemo(() => {
    return {
      totalJenis: aset.length,
      totalUnit: aset.reduce((s, a) => s + a.total, 0),
      baik: aset.reduce((s, a) => s + a.baik, 0),
      rr: aset.reduce((s, a) => s + a.rusakRingan, 0),
      rb: aset.reduce((s, a) => s + a.rusakBerat, 0),
    };
  }, [aset]);
  const dataChartKondisi = [
    { name: 'Baik', value: sarprasStats.baik },
    { name: 'Rusak Ringan', value: sarprasStats.rr },
    { name: 'Rusak Berat', value: sarprasStats.rb },
  ].filter(d => d.value > 0);

  return (
    <Page pageId="dashboard" title="Dashboard" path="Dashboard">
      <NotifikasiSiswaPerluTindakLanjut />

      {(kelas.length > 0 || guru.length > 0) && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <InfoCard icon={IconGraduationCap} color="c-blue" value={guru.filter(g => g.status === 'Aktif').length} label="Guru & Staff Aktif" />
          <InfoCard icon={IconBuilding} color="c-purple" value={kelas.length} label="Kelas & Rombel" />
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>📋 Data Siswa</h3><p>Diambil langsung dari Google Sheets — tahun ajaran aktif {tahunAjaranAktif?.label}.</p></div>
          <button className="btn btn-sm" onClick={refreshSiswa} disabled={siswaLoading}>{siswaLoading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
        <div className="card-body">
          {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data siswa...</p>}
          {siswaError && <p style={{ color: 'var(--red)', fontSize: 13 }}>Gagal memuat: {siswaError}</p>}
          {!siswaLoading && siswaLoaded && siswaAktif.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada siswa aktif tersimpan. Tambahkan lewat menu Data Siswa.</p>
          )}
          {siswaLoaded && siswaAktif.length > 0 && (
            <>
              <div className="info-grid" style={{ marginBottom: 20 }}>
                <InfoCard icon={IconUsers} color="c-green" value={stats.total} label="Total Siswa Aktif" />
                <InfoCard icon={IconUsers} color="c-blue" value={stats.perGender['Laki-laki']} label="Laki-laki" />
                <InfoCard icon={IconUsers} color="c-purple" value={stats.perGender['Perempuan']} label="Perempuan" />
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={{ flex: '2 1 340px', minWidth: 280 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Sebaran per Kelas / Tingkat</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dataChartKelas}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="kelas" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Siswa" fill="#16794a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Jenis Kelamin</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dataChartGender} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {dataChartGender.map((_, i) => <Cell key={i} fill={WARNA_LP[i % WARNA_LP.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Sebaran per Kelas / Tingkat (angka)</div>
              <div className="kelas-grid">
                {tingkatList.map((t, i) => {
                  const gradients = [
                    'linear-gradient(135deg, var(--green), var(--green-dark))',
                    'linear-gradient(135deg, #3868C9, #123a7a)',
                    'linear-gradient(135deg, var(--purple), var(--purple-dark))',
                    'linear-gradient(135deg, #E0645F, #8f2c1f)',
                    'linear-gradient(135deg, #D9A441, #8a5b00)',
                    'linear-gradient(135deg, #16794a, #0d4a2c)',
                  ];
                  return (
                    <div key={t} className="kelas-card" style={{ background: gradients[i % gradients.length] }}>
                      <div className="val">{stats.perTingkat[t]}</div>
                      <div className="lbl">Kelas {t}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>💰 Ringkasan Keuangan</h3><p>Pemasukan vs pengeluaran sepanjang tahun ajaran {tahunAjaranAktif?.label}.</p></div></div>
        <div className="card-body">
          {!keuanganSiap && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data keuangan...</p>}
          {keuanganSiap && (() => {
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
          })()}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>🏫 Ringkasan Sarpras</h3><p>Kondisi aset & inventaris sekolah.</p></div></div>
        <div className="card-body">
          {!asetLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data aset...</p>}
          {asetLoaded && sarprasStats.totalJenis === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada data aset tersimpan.</p>}
          {asetLoaded && sarprasStats.totalJenis > 0 && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <InfoCard icon={IconLayers} color="c-purple" value={sarprasStats.totalJenis} label="Jenis Aset" style={{ minWidth: 130 }} />
                <InfoCard icon={IconBox} color="c-blue" value={sarprasStats.totalUnit} label="Total Unit" style={{ minWidth: 130 }} />
                <InfoCard icon={IconCheckCircle} color="c-green" value={sarprasStats.baik} label="Baik" style={{ minWidth: 130 }} />
                <InfoCard icon={IconAlertTriangle} color="c-gold" value={sarprasStats.rr} label="Rusak Ringan" style={{ minWidth: 130 }} />
                <InfoCard icon={IconXCircle} color="c-red" value={sarprasStats.rb} label="Rusak Berat" style={{ minWidth: 130 }} />
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 220, maxWidth: 320 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dataChartKondisi} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {dataChartKondisi.map((_, i) => <Cell key={i} fill={WARNA_KONDISI[i % WARNA_KONDISI.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
