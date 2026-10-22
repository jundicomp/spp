import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { statusTagihan } from '../../db/tagihanHelpers';
import { nominalEfektifTagihan } from '../../db/beasiswaFields';
import { bulanTahunAjaran } from '../../db/laporanHelpers';
import { BULAN_ID, formatRupiah, formatTanggalTampil, parseTanggalFleksibel } from '../../db/helpers';
import InfoCard from '../../components/common/InfoCard';
import { IconMoney, IconCheckCircle, IconAlertTriangle } from '../../components/common/icons';

const STATUS_WARNA = {
  Lunas: { bg: 'var(--green-soft)', fg: 'var(--green-dark)' },
  Sebagian: { bg: 'var(--gold-soft)', fg: '#8a5b00' },
  'Belum Lunas': { bg: 'var(--red-soft)', fg: 'var(--red)' },
};

function StatusBadge({ status }) {
  const w = STATUS_WARNA[status] || { bg: '#F0F2EF', fg: 'var(--muted)' };
  return <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: w.bg, color: w.fg, whiteSpace: 'nowrap' }}>{status}</span>;
}

// "Info SPP per Bulan" -- 12 kartu (1 per bulan Tahun Ajaran aktif, Juli-Juni), tiap
// kartu bisa diklik utk buka rincian per Kelas/Tingkat, lalu tiap baris kelas bisa
// diklik lagi utk buka daftar siswanya (status Lunas/Sebagian/Belum Lunas + tanggal
// bayar terakhir). Khusus tagihan SPP (Biaya Lain tidak punya kolom "Bulan", jadi
// tidak relevan di sini -- lihat normalizeSheetTagihanLain di tagihanHelpers.js).
// Disetujui lewat mockup (lihat CHANGELOG) sebelum dibangun.
export default function InfoSppBulanan() {
  const { siswa, allTagihan, pembayaran, tagihanTerbayar, beasiswaSiswa, beasiswaKategori, tahunAjaranAktif } = useAppData();
  const taLabel = tahunAjaranAktif?.label;
  const [bulanTerbuka, setBulanTerbuka] = useState(null); // `${monthIdx}-${calYear}` atau null
  const [kelasTerbuka, setKelasTerbuka] = useState(null); // tingkat (string) atau null

  const siswaByNisn = useMemo(() => {
    const m = {};
    siswa.forEach(s => { if (s.nisn) m[s.nisn] = s; });
    return m;
  }, [siswa]);

  // Tanggal bayar TERAKHIR per tagihan (refType-refNo) -- dibaca 1x dari seluruh
  // riwayat Pembayaran, bukan di-scan ulang per baris tagihan, supaya tetap cepat
  // walau datanya sudah banyak.
  const tanggalBayarTerakhirByRefNo = useMemo(() => {
    const map = new Map();
    pembayaran.forEach(p => {
      const key = `${p.refType}-${p.refNo}`;
      const d = parseTanggalFleksibel(p.tanggalBayar);
      if (!d) return;
      const prev = map.get(key);
      if (!prev || d.getTime() > prev.d) map.set(key, { d: d.getTime(), raw: p.tanggalBayar });
    });
    return map;
  }, [pembayaran]);

  const dataBulanan = useMemo(() => {
    if (!taLabel) return [];
    const cutoffMs = Date.now();
    const now = new Date();
    const bulanList = bulanTahunAjaran(taLabel);

    const tagihanSppEfektif = allTagihan
      .filter(t => t.refType === 'SPP' && t.tahunAjaran === taLabel)
      .map(t => {
        const terbayarMentah = tagihanTerbayar(t.refType, t.no, t.nisn);
        const { nominalEfektif } = nominalEfektifTagihan(t, beasiswaSiswa, beasiswaKategori, cutoffMs, terbayarMentah);
        const terbayar = Math.min(terbayarMentah, nominalEfektif); // clamp: kelebihan bayar tdk bikin % lebih dari 100
        return {
          ...t, nominalEfektif, terbayar,
          monthIdx: BULAN_ID.indexOf(t.bulan),
          tingkat: siswaByNisn[t.nisn]?.kelasTingkat || 'Lainnya',
          status: statusTagihan(nominalEfektif, terbayar),
          tanggalBayarTerakhir: tanggalBayarTerakhirByRefNo.get(`SPP-${t.no}`)?.raw || null,
        };
      });

    return bulanList.map(b => {
      const key = `${b.monthIdx}-${b.calYear}`;
      const akanDatang = new Date(b.calYear, b.monthIdx, 1) > now;
      const rows = tagihanSppEfektif.filter(t => t.monthIdx === b.monthIdx && Number(t.tahunKalender) === b.calYear);
      const tagihan = rows.reduce((s, t) => s + t.nominalEfektif, 0);
      const terbayar = rows.reduce((s, t) => s + t.terbayar, 0);
      const tunggakan = Math.max(0, tagihan - terbayar);
      const persen = tagihan > 0 ? (terbayar / tagihan * 100) : 0;

      const perKelasMap = {};
      rows.forEach(t => {
        if (!perKelasMap[t.tingkat]) perKelasMap[t.tingkat] = { tingkat: t.tingkat, nisnSet: new Set(), tagihan: 0, terbayar: 0, siswa: [] };
        const k = perKelasMap[t.tingkat];
        k.nisnSet.add(t.nisn);
        k.tagihan += t.nominalEfektif;
        k.terbayar += t.terbayar;
        k.siswa.push(t);
      });
      const perKelas = Object.values(perKelasMap)
        .map(k => ({
          tingkat: k.tingkat,
          jumlahSiswa: k.nisnSet.size,
          tagihan: k.tagihan,
          terbayar: k.terbayar,
          tunggakan: Math.max(0, k.tagihan - k.terbayar),
          persen: k.tagihan > 0 ? (k.terbayar / k.tagihan * 100) : 0,
          siswa: k.siswa.slice().sort((a, b) => a.namaSiswa.localeCompare(b.namaSiswa, 'id')),
        }))
        .sort((a, b) => String(a.tingkat).localeCompare(String(b.tingkat), 'id', { numeric: true }));

      return { ...b, key, akanDatang, tagihan, terbayar, tunggakan, persen, jumlahBaris: rows.length, perKelas };
    });
  }, [taLabel, allTagihan, tagihanTerbayar, beasiswaSiswa, beasiswaKategori, siswaByNisn, tanggalBayarTerakhirByRefNo]);

  const totalTagihanTahun = dataBulanan.reduce((s, b) => s + b.tagihan, 0);
  const totalTerbayarTahun = dataBulanan.reduce((s, b) => s + b.terbayar, 0);
  const totalTunggakanTahun = dataBulanan.reduce((s, b) => s + b.tunggakan, 0);

  function klikBulan(b) {
    setBulanTerbuka(t => (t === b.key ? null : b.key));
    setKelasTerbuka(null); // ganti bulan -- tutup detail kelas yg mungkin masih terbuka
  }
  function klikKelas(tingkat) {
    setKelasTerbuka(t => (t === tingkat ? null : tingkat));
  }

  if (!taLabel) return null;
  if (dataBulanan.every(b => b.jumlahBaris === 0)) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><div><h3>📅 Info SPP per Bulan</h3><p>Status lunas/belum per bulan, per kelas, per siswa.</p></div></div>
        <div className="card-body"><p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada tagihan SPP yang diterbitkan tahun ajaran ini.</p></div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-head">
        <div><h3>📅 Info SPP per Bulan</h3><p>Klik sebuah bulan untuk rincian per kelas, lalu klik sebuah kelas untuk daftar siswanya.</p></div>
      </div>
      <div className="card-body">
        <div className="info-grid" style={{ marginBottom: 18 }}>
          <InfoCard icon={IconMoney} color="c-blue" value={formatRupiah(totalTagihanTahun)} label="Total Tagihan Tahun Ini" />
          <InfoCard icon={IconCheckCircle} color="c-green" value={formatRupiah(totalTerbayarTahun)} label="Sudah Terbayar" />
          <InfoCard icon={IconAlertTriangle} color="c-red" value={formatRupiah(totalTunggakanTahun)} label="Tunggakan (bulan lampau & berjalan)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dataBulanan.map(b => {
            const terbuka = bulanTerbuka === b.key;
            const sudahMulai = !b.akanDatang;
            return (
              <div key={b.key} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', opacity: b.akanDatang && b.jumlahBaris === 0 ? .65 : 1 }}>
                <div
                  onClick={() => (sudahMulai || b.jumlahBaris > 0) && klikBulan(b)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 18px', cursor: (sudahMulai || b.jumlahBaris > 0) ? 'pointer' : 'default', background: terbuka ? 'var(--green-soft)' : '#fff', flexWrap: 'wrap' }}
                >
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--green-dark)' }}>{b.label}</div>
                    {b.jumlahBaris > 0 ? (
                      <div style={{ fontSize: 11, fontWeight: 700, color: b.persen >= 90 ? 'var(--green)' : (b.persen >= 60 ? '#8a5b00' : 'var(--red)') }}>{b.persen.toFixed(0)}% lunas</div>
                    ) : (
                      <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>{b.akanDatang ? 'Akan datang' : 'Belum diterbitkan'}</span>
                    )}
                  </div>
                  <div style={{ flex: '1 1 160px', height: 9, borderRadius: 6, background: 'var(--red-soft)', overflow: 'hidden', minWidth: 100 }}>
                    <div style={{ width: `${b.persen}%`, height: '100%', background: b.persen >= 60 ? 'var(--green)' : 'var(--gold)' }} />
                  </div>
                  {b.jumlahBaris > 0 && (
                    <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      <div><div style={{ fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(b.tagihan)}</div>Tagihan</div>
                      <div><div style={{ fontWeight: 700, color: 'var(--green-dark)' }}>{formatRupiah(b.terbayar)}</div>Terbayar</div>
                      <div><div style={{ fontWeight: 700, color: 'var(--red)' }}>{formatRupiah(b.tunggakan)}</div>Tunggakan</div>
                    </div>
                  )}
                  {b.jumlahBaris > 0 && <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>{terbuka ? '▾' : '▸'}</span>}
                </div>

                {terbuka && b.perKelas.length > 0 && (
                  <div style={{ padding: '6px 18px 14px', background: '#FAFBFA', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', margin: '10px 0 6px' }}>Rincian per Kelas — {b.label}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {b.perKelas.map(k => {
                        const kTerbuka = kelasTerbuka === k.tingkat;
                        return (
                          <div key={k.tingkat}>
                            <div
                              onClick={() => klikKelas(k.tingkat)}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: kTerbuka ? 'var(--green-soft)' : 'transparent', flexWrap: 'wrap' }}
                            >
                              <div style={{ minWidth: 90, fontSize: 13, fontWeight: 700 }}>Kelas {k.tingkat}</div>
                              <div style={{ minWidth: 68, fontSize: 11, color: 'var(--muted)' }}>{k.jumlahSiswa} siswa</div>
                              <div style={{ flex: '1 1 100px', height: 7, borderRadius: 5, background: 'var(--red-soft)', overflow: 'hidden' }}>
                                <div style={{ width: `${k.persen}%`, height: '100%', background: k.persen >= 60 ? 'var(--green)' : 'var(--gold)' }} />
                              </div>
                              <div style={{ minWidth: 38, fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>{k.persen.toFixed(0)}%</div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                <span>{formatRupiah(k.tagihan)} tagihan</span>
                                <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>{formatRupiah(k.terbayar)} terbayar</span>
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{kTerbuka ? '▾' : '▸'}</span>
                            </div>

                            {kTerbuka && (
                              <div style={{ padding: '4px 12px 10px 24px' }}>
                                <div className="table-scroll">
                                  <table>
                                    <thead><tr><th>NISN</th><th>Nama Siswa</th><th>Nominal</th><th>Terbayar</th><th>Status</th><th>Tanggal Bayar Terakhir</th></tr></thead>
                                    <tbody>
                                      {k.siswa.map(s => (
                                        <tr key={s.no}>
                                          <td>{s.nisn || '-'}</td>
                                          <td>{s.namaSiswa}</td>
                                          <td>{formatRupiah(s.nominalEfektif)}</td>
                                          <td>{formatRupiah(s.terbayar)}</td>
                                          <td><StatusBadge status={s.status} /></td>
                                          <td>{s.tanggalBayarTerakhir ? formatTanggalTampil(s.tanggalBayarTerakhir) : '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
