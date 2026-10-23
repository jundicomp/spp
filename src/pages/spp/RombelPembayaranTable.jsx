import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { nominalEfektifTagihan } from '../../db/beasiswaFields';
import { statusTagihan } from '../../db/tagihanHelpers';
import { bulanTahunAjaran } from '../../db/laporanHelpers';
import { BULAN_ID, BULAN_SHORT } from '../../db/helpers';
import { exportToExcel } from '../../utils/exportTable';

// "Rekap Pembayaran per Rombel" -- ceklist Lunas/Belum per siswa x per bulan,
// 1 rombel per layar (bukan semua siswa sekaligus, supaya tabelnya tetap muat
// & enak dibaca walau sekolahnya banyak rombel). Ditambahkan di Dashboard SPP
// sejak v1.31.16 atas permintaan langsung, lihat CHANGELOG. Sejak v1.31.38 jadi
// kartu MANDIRI (judul + toolbar sendiri, bukan lagi dibungkus card dari luar
// oleh DashboardSpp.jsx) supaya filter Tahun Ajaran & tombol Export Excel punya
// tempat yg jelas, konsisten dgn pola kartu "Info SPP per Bulan".
export default function RombelPembayaranTable() {
  const { siswa, kelas, allTagihan, tagihanTerbayar, beasiswaSiswa, beasiswaKategori, tahunAjaran, tahunAjaranAktif, profilSekolah } = useAppData();

  // Filter Tahun Ajaran -- default ikut TA aktif, tapi bisa dipilih manual ke TA
  // lain (mis. lihat rekap tahun ajaran lampau). Pola SAMA dgn NeracaTab/laporan
  // keuangan lain: state null = "ikut TA aktif", baru di-override kalau user pilih.
  const [taLabelSel, setTaLabelSel] = useState(null);
  const taLabel = taLabelSel || tahunAjaranAktif?.label;

  const daftarTahunAjaran = useMemo(() => {
    return tahunAjaran.slice().sort((a, b) => b.label.localeCompare(a.label, 'id', { numeric: true }));
  }, [tahunAjaran]);

  const daftarRombel = useMemo(() => {
    return kelas.slice().sort((a, b) => {
      const t = String(a.tingkat).localeCompare(String(b.tingkat), 'id', { numeric: true });
      return t !== 0 ? t : String(a.namaKelas).localeCompare(String(b.namaKelas), 'id', { numeric: true });
    });
  }, [kelas]);

  const [rombelIdx, setRombelIdx] = useState(0);
  const idxAman = Math.min(rombelIdx, Math.max(daftarRombel.length - 1, 0));
  const rombelAktif = daftarRombel[idxAman];

  const bulanList = useMemo(() => (taLabel ? bulanTahunAjaran(taLabel) : []), [taLabel]);

  const siswaRombel = useMemo(() => {
    if (!rombelAktif) return [];
    return siswa
      .filter(s => s.kelasTingkat === rombelAktif.tingkat && s.rombel === rombelAktif.namaKelas)
      .slice()
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswa, rombelAktif]);

  // Semua siswa (lintas rombel) terurut sama persis spt urutan navigasi rombel --
  // dipakai KHUSUS utk Export Excel (supaya 1 file berisi SEMUA rombel sekaligus,
  // bukan cuma rombel yg sedang tampil di layar).
  const siswaSemuaRombel = useMemo(() => {
    const list = [];
    daftarRombel.forEach(r => {
      siswa
        .filter(s => s.kelasTingkat === r.tingkat && s.rombel === r.namaKelas)
        .slice()
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
        .forEach(s => list.push({ ...s, _rombelLabel: `Kelas ${r.tingkat} — ${r.namaKelas}` }));
    });
    return list;
  }, [siswa, daftarRombel]);

  // Peta status SPP per siswa per bulan, dihitung 1 kali dari SELURUH tagihan SPP
  // tahun ajaran YG DIPILIH -- bukan per-baris tabel -- supaya pindah2 rombel
  // (Next/Prev) tetap cepat & angkanya konsisten dgn grafik2 Dashboard SPP di atasnya.
  const statusBulananPerSiswa = useMemo(() => {
    if (!taLabel) return {};
    const cutoffMs = Date.now();
    const map = {};
    allTagihan
      .filter(t => t.refType === 'SPP' && t.tahunAjaran === taLabel)
      .forEach(t => {
        const monthIdx = BULAN_ID.indexOf(t.bulan);
        if (monthIdx < 0) return;
        const terbayarMentah = tagihanTerbayar(t.refType, t.no, t.nisn);
        const { nominalEfektif } = nominalEfektifTagihan(t, beasiswaSiswa, beasiswaKategori, cutoffMs, terbayarMentah);
        const terbayar = Math.min(terbayarMentah, nominalEfektif);
        if (!map[t.nisn]) map[t.nisn] = {};
        const prev = map[t.nisn][monthIdx] || { nominalEfektif: 0, terbayar: 0 };
        map[t.nisn][monthIdx] = { nominalEfektif: prev.nominalEfektif + nominalEfektif, terbayar: prev.terbayar + terbayar };
      });
    return map;
  }, [allTagihan, taLabel, tagihanTerbayar, beasiswaSiswa, beasiswaKategori]);

  function statusSel(nisn, monthIdx) {
    const cell = statusBulananPerSiswa[nisn]?.[monthIdx];
    if (!cell) return null; // belum ada tagihan SPP bulan itu (blm diterbitkan / siswa blm terdaftar bulan itu)
    return statusTagihan(cell.nominalEfektif, cell.terbayar);
  }

  // % Lunas per siswa -- dari SELURUH bulan yg ADA tagihan di tahun ajaran ini (bulan
  // tanpa tagihan tidak dihitung sbg pembagi), supaya rombel yg baru berjalan beberapa
  // bulan tidak tampak rendah persentasenya. Selalu ditulis angka "100%" dkk -- BUKAN
  // ceklist -- supaya tetap jelas terbaca sbg persentase di semua kondisi.
  function pctLunas(nisn) {
    let adaTagihan = 0;
    let lunas = 0;
    bulanList.forEach(b => {
      const status = statusSel(nisn, b.monthIdx);
      if (!status) return;
      adaTagihan += 1;
      if (status === 'Lunas') lunas += 1;
    });
    if (adaTagihan === 0) return null;
    return Math.round((lunas / adaTagihan) * 100);
  }

  // Export Excel -- SEMUA rombel sekaligus (bukan cuma yg sedang tampil di layar).
  // Sejak v1.31.40, kolom per-bulan diisi NOMINAL (angka), bukan kata status lagi --
  // kalau Lunas diisi nominal tagihan bulan itu, kalau belum/baru sebagian diisi 0 --
  // supaya bisa langsung dijumlah/difilter di Excel. Kolom "Total" (jumlah 12 bulan)
  // ditambahkan SEBELUM kolom "% Lunas". Baris terakhir = total semua siswa per bulan
  // + total keseluruhan + rata-rata % Lunas.
  function exportExcelRombel() {
    const headers = ['NISN', 'Nama Lengkap', 'Kelas / Rombel', ...bulanList.map(b => BULAN_SHORT[b.monthIdx]), 'Total', '% Lunas'];
    let totalAdaTagihan = 0;
    let totalLunas = 0;
    let grandTotal = 0;
    const totalPerBulan = {};
    bulanList.forEach(b => { totalPerBulan[BULAN_SHORT[b.monthIdx]] = 0; });
    const rows = siswaSemuaRombel.map(s => {
      const row = { 'NISN': s.nisn || '-', 'Nama Lengkap': s.nama, 'Kelas / Rombel': s._rombelLabel };
      let totalSiswa = 0;
      bulanList.forEach(b => {
        const status = statusSel(s.nisn, b.monthIdx);
        const nilai = status === 'Lunas' ? (statusBulananPerSiswa[s.nisn]?.[b.monthIdx]?.nominalEfektif || 0) : 0;
        row[BULAN_SHORT[b.monthIdx]] = nilai;
        totalSiswa += nilai;
        totalPerBulan[BULAN_SHORT[b.monthIdx]] += nilai;
        if (status) {
          totalAdaTagihan += 1;
          if (status === 'Lunas') totalLunas += 1;
        }
      });
      row['Total'] = totalSiswa;
      grandTotal += totalSiswa;
      const pct = pctLunas(s.nisn);
      row['% Lunas'] = pct === null ? '-' : `${pct}%`;
      return row;
    });
    const footer = {
      'NISN': 'TOTAL SEMUA SISWA',
      ...totalPerBulan,
      'Total': grandTotal,
      '% Lunas': totalAdaTagihan > 0 ? `${Math.round((totalLunas / totalAdaTagihan) * 100)}%` : '-',
    };
    exportToExcel(
      headers, rows, `Rekap Pembayaran SPP per Rombel - ${taLabel.replace('/', '-')}`,
      [profilSekolah?.nama || 'MI Ikhlasiyah', 'Rekap Pembayaran SPP per Rombel', `Tahun Ajaran ${taLabel}`],
      footer
    );
  }

  if (!taLabel) {
    return (
      <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
        <div className="card-head"><div><h3 style={{ fontSize: 13.5 }}>📋 Rekap Pembayaran SPP per Rombel</h3></div></div>
        <div className="card-body"><p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran yang diaktifkan.</p></div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
      <div className="card-head">
        <div>
          <h3 style={{ fontSize: 13.5 }}>📋 Rekap Pembayaran SPP per Rombel</h3>
          <p>Ceklist hijau = sudah lunas bulan itu, silang merah = belum/baru sebagian</p>
        </div>
        <div className="card-toolbar">
          <select
            value={taLabel}
            onChange={e => { setTaLabelSel(e.target.value); setRombelIdx(0); }}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}
            title="Filter Tahun Ajaran"
          >
            {daftarTahunAjaran.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
          </select>
          <button type="button" className="btn btn-sm" onClick={exportExcelRombel} disabled={daftarRombel.length === 0}>📊 Export Excel</button>
        </div>
      </div>
      <div className="card-body">
        {daftarRombel.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada data Rombel. Atur dulu lewat menu <strong>Data Kelas &amp; Rombel</strong>.</p>
        ) : (
          <>
            <div className="rb-toolbar">
              <button type="button" className="btn btn-sm" onClick={() => setRombelIdx(i => Math.max(0, i - 1))} disabled={idxAman === 0}>◀ Sebelumnya</button>
              <select value={idxAman} onChange={e => setRombelIdx(Number(e.target.value))}>
                {daftarRombel.map((r, i) => <option key={r.id} value={i}>Kelas {r.tingkat} — Rombel {r.namaKelas}</option>)}
              </select>
              <button type="button" className="btn btn-sm" onClick={() => setRombelIdx(i => Math.min(daftarRombel.length - 1, i + 1))} disabled={idxAman === daftarRombel.length - 1}>Berikutnya ▶</button>
              <span className="rb-toolbar-info">{siswaRombel.length} siswa di rombel ini</span>
            </div>

            {siswaRombel.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada siswa yang terdaftar di rombel ini.</p>
            ) : (
              <div className="table-scroll">
                <table className="rb-table">
                  <thead>
                    <tr>
                      <th>No</th><th>NISN</th><th>Nama Lengkap</th><th>Rombel</th>
                      {bulanList.map(b => <th key={b.monthIdx}>{BULAN_SHORT[b.monthIdx]}</th>)}
                      <th>% Lunas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaRombel.map((s, i) => {
                      const pct = pctLunas(s.nisn);
                      return (
                        <tr key={s.id}>
                          <td>{i + 1}</td>
                          <td>{s.nisn || '-'}</td>
                          <td>{s.nama}</td>
                          <td>{s.rombel}</td>
                          {bulanList.map(b => {
                            const status = statusSel(s.nisn, b.monthIdx);
                            const judul = `${b.label} — ${status || 'Belum ada tagihan'}`;
                            return (
                              <td key={b.monthIdx} title={judul}>
                                {status === 'Lunas' && <span className="rb-yes">✓</span>}
                                {(status === 'Sebagian' || status === 'Belum Lunas') && <span className="rb-no">✕</span>}
                                {!status && <span className="rb-none">–</span>}
                              </td>
                            );
                          })}
                          <td title={pct === null ? 'Belum ada tagihan' : `${pct}% bulan sudah lunas`}>
                            {pct === null && <span className="rb-none">–</span>}
                            {pct !== null && <span className={'rb-pct' + (pct === 100 ? ' rb-pct-full' : '')}>{pct}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="rb-legend">
              <span><span className="rb-yes">✓</span> Sudah Lunas</span>
              <span><span className="rb-no">✕</span> Belum Lunas / Baru Sebagian</span>
              <span><span className="rb-none">–</span> Belum Ada Tagihan Bulan Itu</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
