import { useMemo, useState, Fragment } from 'react';
import { useAppData } from '../../context/AppContext';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

// Kelompokkan baris jadi { nama, jumlah } unik -- dipakai utk daftar "nama yang
// sudah ada NISN" (biasanya panjang, jadi cukup diringkas per nama + berapa baris).
function kelompokNama(rows, getNama) {
  const map = new Map();
  rows.forEach(r => {
    const nama = getNama(r) || '(tanpa nama)';
    map.set(nama, (map.get(nama) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

// Analisis 1 sumber data (Data Siswa / Tagihan SPP / Tagihan Lain / Pembayaran) --
// pisahkan baris yg NISN-nya kosong vs terisi, siapkan daftar utk ditampilkan.
function analisisSumber({ key, label, rows, getNama, getNisn, getDetail }) {
  const adaNisn = [];
  const tidakAdaNisn = [];
  rows.forEach(r => {
    const nisn = String(getNisn(r) ?? '').trim();
    if (nisn) adaNisn.push(r); else tidakAdaNisn.push(r);
  });
  return {
    key, label,
    total: rows.length,
    jumlahAda: adaNisn.length,
    jumlahTidakAda: tidakAdaNisn.length,
    daftarTidakAda: tidakAdaNisn.map(r => ({ nama: getNama(r) || '(tanpa nama)', detail: getDetail(r) })),
    namaAdaDikelompok: kelompokNama(adaNisn, getNama),
  };
}

export default function CekDataNisnTab() {
  const { siswa, allTagihan, pembayaran } = useAppData();
  const [sudahDicek, setSudahDicek] = useState(false);
  const [terbukaAda, setTerbukaAda] = useState({}); // { [sourceKey]: true } -- toggle daftar "sudah ada NISN" per sumber

  const sumberData = useMemo(() => ([
    { key: 'siswa', label: '👦 Data Siswa', rows: siswa, getNama: s => s.nama, getNisn: s => s.nisn, getDetail: s => `Kelas ${s.kelasTingkat || '-'}${s.rombel ? ' ' + s.rombel : ''}` },
    { key: 'tagihanSpp', label: '🧾 Tagihan SPP', rows: allTagihan.filter(t => t.refType === 'SPP'), getNama: t => t.namaSiswa, getNisn: t => t.nisn, getDetail: t => `SPP ${t.bulan} ${t.tahunKalender} — No=${t.no}` },
    { key: 'tagihanLain', label: '🧾 Tagihan Biaya Lain', rows: allTagihan.filter(t => t.refType === 'LAIN'), getNama: t => t.namaSiswa, getNisn: t => t.nisn, getDetail: t => `${t.label} — No=${t.no}` },
    { key: 'pembayaran', label: '💳 Pembayaran', rows: pembayaran, getNama: p => p.namaSiswa, getNisn: p => p.nisn, getDetail: p => `${p.jenis || p.refType} — ${formatRupiah(p.nominal)} — No=${p.no}` },
  ]), [siswa, allTagihan, pembayaran]);

  const hasil = useMemo(() => sumberData.map(analisisSumber), [sumberData]);

  const totalTidakAda = hasil.reduce((s, h) => s + h.jumlahTidakAda, 0);
  const totalAda = hasil.reduce((s, h) => s + h.jumlahAda, 0);
  const totalSemua = hasil.reduce((s, h) => s + h.total, 0);

  return (
    <div>
      <div className="card" style={{ background: 'var(--gold-soft)', marginBottom: 18 }}>
        <div className="card-body" style={{ fontSize: 12.5, color: '#8a5b00' }}>
          ⚠️ Alat ini memindai <strong>Data Siswa, Tagihan SPP, Tagihan Biaya Lain, dan Pembayaran</strong> untuk
          mencari baris yang kolom <strong>NISN</strong>-nya kosong. Baris dengan NISN kosong berisiko salah
          dicocokkan (mis. pembayaran nyasar ke tagihan siswa lain kalau nomor tagihannya kebetulan sama) — cek
          &amp; lengkapi NISN-nya langsung di Google Sheets kalau ditemukan.
        </div>
      </div>

      {!sudahDicek && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Klik tombol di bawah untuk memindai {totalSemua} baris data dan mengecek kelengkapan NISN.
            </p>
            <button className="btn btn-primary" onClick={() => setSudahDicek(true)}>🔍 Cek NISN &amp; Nama Sekarang</button>
          </div>
        </div>
      )}

      {sudahDicek && (
        <>
          <div className="info-grid" style={{ marginBottom: 18 }}>
            <div className="card"><div className="card-body">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-dark)' }}>{totalAda}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Baris Sudah Ada NISN</div>
            </div></div>
            <div className="card"><div className="card-body">
              <div style={{ fontSize: 24, fontWeight: 800, color: totalTidakAda > 0 ? 'var(--red)' : 'var(--green-dark)' }}>{totalTidakAda}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Baris TIDAK Ada NISN</div>
            </div></div>
            <div className="card"><div className="card-body">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-dark)' }}>{totalSemua}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total Baris Diperiksa</div>
            </div></div>
          </div>

          {hasil.map(h => (
            <div className="card" key={h.key} style={{ marginBottom: 18 }}>
              <div className="card-head" style={{ alignItems: 'center' }}>
                <div>
                  <h3>{h.label}</h3>
                  <p>{h.total} baris diperiksa</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-green">Ada NISN: {h.jumlahAda}</span>
                  <span className={`badge ${h.jumlahTidakAda > 0 ? 'badge-red' : 'badge-green'}`}>Tanpa NISN: {h.jumlahTidakAda}</span>
                </div>
              </div>
              <div className="card-body table-scroll">
                {h.jumlahTidakAda === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 16 }}>
                    ✅ Semua baris di sumber ini sudah punya NISN.
                  </p>
                ) : (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Nama TANPA NISN ({h.jumlahTidakAda})
                    </div>
                    <table style={{ marginBottom: 14 }}>
                      <thead><tr><th>Nama</th><th>Detail</th></tr></thead>
                      <tbody>
                        {h.daftarTidakAda.map((r, i) => (
                          <tr key={i}><td>{r.nama}</td><td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.detail}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                <button className="btn btn-sm" onClick={() => setTerbukaAda(t => ({ ...t, [h.key]: !t[h.key] }))}>
                  {terbukaAda[h.key] ? 'Tutup daftar nama yang sudah ada NISN' : `Lihat ${h.namaAdaDikelompok.length} nama yang sudah ada NISN`}
                </button>
                {terbukaAda[h.key] && (
                  <table style={{ marginTop: 10 }}>
                    <thead><tr><th>Nama</th><th>Jumlah Baris</th></tr></thead>
                    <tbody>
                      {h.namaAdaDikelompok.map((r, i) => (
                        <Fragment key={i}>
                          <tr><td>{r.nama}</td><td>{r.jumlah}</td></tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
