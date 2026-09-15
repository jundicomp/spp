import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import { deleteTagihanSppFromSheet, deleteTagihanLainFromSheet, addLogEntry } from '../../services/googleSheets';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../db/helpers';
import ProgressModal from '../../components/common/ProgressModal';

// Analisis 1 kelompok (kunci) baris tagihan yg SAMA PERSIS (siswa+jenis+bulan sesuai) --
// pilih baris mana yg AMAN dihapus. Baris yg py PEMBAYARAN (pembayaran.refNo cocok)
// TIDAK PERNAH dihapus -- kalau lebih dari 1 baris dlm 1 kelompok punya pembayaran,
// itu kasus ambigu (jangan disentuh sama sekali, biar diperiksa manual).
function analisisKelompok(rows, pembayaranByRefNo) {
  const punyaPembayaran = rows.filter(r => pembayaranByRefNo.has(r.no));
  if (punyaPembayaran.length > 1) {
    return { aman: false, alasan: 'Lebih dari 1 baris dalam kelompok ini punya riwayat pembayaran -- tidak disentuh, perlu diperiksa manual.', simpan: null, hapus: [] };
  }
  if (punyaPembayaran.length === 1) {
    const simpan = punyaPembayaran[0];
    return { aman: true, alasan: null, simpan, hapus: rows.filter(r => r.no !== simpan.no) };
  }
  // Tidak ada yg py pembayaran sama sekali -- simpan yg PALING AWAL (No terkecil = pertama dibuat).
  const terurut = [...rows].sort((a, b) => Number(a.no) - Number(b.no));
  const simpan = terurut[0];
  return { aman: true, alasan: null, simpan, hapus: terurut.slice(1) };
}

export default function BersihkanDuplikat() {
  const { allTagihan, pembayaran, tarif, siswa, refreshTagihanSpp, refreshTagihanLain, toast } = useAppData();
  const { currentUser } = useAuth();
  const [memproses, setMemproses] = useState(false);
  const [progress, setProgress] = useState(null);
  const [sudahDihapusKali, setSudahDihapusKali] = useState(0);

  const pembayaranByRefNo = useMemo(() => {
    const map = new Map(); // key: `${refType}-${refNo}` -> true
    pembayaran.forEach(p => map.set(`${p.refType}-${p.refNo}`, true));
    return map;
  }, [pembayaran]);

  const kelompokDuplikat = useMemo(() => {
    // Kunci kelompok: SPP -> nisn+bulan+tahunKalender. LAIN -> nisn+label (jenis biaya).
    const map = new Map();
    allTagihan.forEach(t => {
      const kunci = t.refType === 'SPP'
        ? `SPP|${t.nisn}|${t.bulan}|${t.tahunKalender}`
        : `LAIN|${t.nisn}|${t.label}`;
      if (!map.has(kunci)) map.set(kunci, []);
      map.get(kunci).push(t);
    });
    const hasil = [];
    map.forEach((rows, kunci) => {
      if (rows.length <= 1) return; // bukan duplikat
      const punyaPembayaranMap = new Map();
      rows.forEach(r => { punyaPembayaranMap.set(r.no, pembayaranByRefNo.has(`${r.refType}-${r.no}`)); });
      const cekPembayaran = { has: (no) => punyaPembayaranMap.get(no) };
      const analisis = analisisKelompok(rows, cekPembayaran);
      hasil.push({ kunci, refType: rows[0].refType, nisn: rows[0].nisn, namaSiswa: rows[0].namaSiswa, label: rows[0].label, bulan: rows[0].bulan, tahunKalender: rows[0].tahunKalender, jumlahBaris: rows.length, ...analisis });
    });
    return hasil.sort((a, b) => b.jumlahBaris - a.jumlahBaris);
  }, [allTagihan, pembayaranByRefNo]);

  const kelompokAman = kelompokDuplikat.filter(k => k.aman);
  const kelompokAmbigu = kelompokDuplikat.filter(k => !k.aman);
  const totalBarisAkanDihapus = kelompokAman.reduce((s, k) => s + k.hapus.length, 0);

  // Diagnosa TERPISAH dari duplikat: tagihan Biaya Lain yg NISN-nya SEKARANG di kelas
  // yg TIDAK cocok dgn tarif yg tarifnya spesifik (bukan "Semua Kelas"). Ini BUKAN
  // duplikat, tapi kemungkinan besar dari: tarif dulu "Semua Kelas" (kena semua siswa),
  // BELAKANGAN diubah jadi spesifik 1 kelas -- tagihan yg SUDAH TERLANJUR terbit ke
  // kelas lain TIDAK otomatis ikut berubah/hilang (memang begitu perilakunya -- tagihan
  // itu rekaman independen, bukan tersambung langsung ke tarif).
  const siswaByNisn = useMemo(() => { const m = new Map(); siswa.forEach(s => m.set(s.nisn, s)); return m; }, [siswa]);
  const tagihanSalahKelas = useMemo(() => {
    const hasil = [];
    allTagihan.filter(t => t.refType === 'LAIN').forEach(t => {
      // Cari SEMUA tarif dgn nama jenis yg SAMA utk tahun ajaran itu -- kalau ADA yg
      // spesifik-kelas (bukan Semua Kelas) DAN kelas siswa itu SEKARANG tidak cocok
      // dgn tarif spesifik manapun utk jenis itu, tandai.
      const tarifSejenis = tarif.filter(x => x.jenis === t.label && x.tahunAjaran === t.tahunAjaran);
      const adaYangSpesifik = tarifSejenis.some(x => x.kelasTingkat !== 'Semua Kelas');
      if (!adaYangSpesifik) return; // tarifnya emang "Semua Kelas" -- wajar semua kelas kena
      const s = siswaByNisn.get(t.nisn);
      if (!s) return;
      const cocok = tarifSejenis.some(x => x.kelasTingkat === s.kelasTingkat);
      if (!cocok) {
        const kelasSeharusnya = tarifSejenis.filter(x => x.kelasTingkat !== 'Semua Kelas').map(x => x.kelasTingkat).join(', ');
        hasil.push({ ...t, kelasSeharusnya, kelasSiswaSekarang: s.kelasTingkat, punyaPembayaran: pembayaranByRefNo.has(`LAIN-${t.no}`) });
      }
    });
    return hasil;
  }, [allTagihan, tarif, siswaByNisn, pembayaranByRefNo]);

  async function bersihkanSemua() {
    if (totalBarisAkanDihapus === 0) return;
    if (!confirm(`Akan menghapus ${totalBarisAkanDihapus} baris duplikat dari ${kelompokAman.length} kelompok. Baris yang punya riwayat pembayaran TIDAK akan dihapus. Lanjutkan?`)) return;

    setMemproses(true);
    const semuaHapus = [];
    kelompokAman.forEach(k => k.hapus.forEach(r => semuaHapus.push(r)));
    setProgress({ current: 0, total: semuaHapus.length, label: 'Menghapus baris duplikat' });

    let sukses = 0;
    for (let i = 0; i < semuaHapus.length; i++) {
      const r = semuaHapus[i];
      try {
        if (r.refType === 'SPP') await deleteTagihanSppFromSheet(r.no);
        else await deleteTagihanLainFromSheet(r.no);
        sukses++;
      } catch (err) {
        // lanjut ke baris berikutnya walau 1 gagal -- laporkan total di akhir
      }
      setProgress({ current: i + 1, total: semuaHapus.length, label: 'Menghapus baris duplikat' });
    }

    await addLogEntry({
      username: currentUser.username,
      namaUser: currentUser.nama,
      aksi: 'Bersihkan Duplikat',
      modul: 'Tagihan & Biaya',
      detail: `Menghapus ${sukses} baris tagihan duplikat dari ${kelompokAman.length} kelompok (SPP & Biaya Lain)`,
    });

    await refreshTagihanSpp();
    await refreshTagihanLain();
    setSudahDihapusKali(k => k + sukses);
    toast(`${sukses} baris duplikat berhasil dihapus.`);
    setMemproses(false);
    setProgress(null);
  }

  async function hapusSatuSalahKelas(t) {
    if (t.punyaPembayaran) { toast('Tagihan ini sudah ada riwayat pembayarannya, tidak bisa dihapus dari sini.', 'error'); return; }
    if (!confirm(`Hapus tagihan "${t.label}" milik ${t.namaSiswa} (kelas ${t.kelasSiswaSekarang}, seharusnya cuma kelas ${t.kelasSeharusnya})?`)) return;
    try {
      await deleteTagihanLainFromSheet(t.no);
      await refreshTagihanLain();
      toast('Tagihan berhasil dihapus.');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <Page pageId="bersihkan-duplikat" title="Bersihkan Data Duplikat" path="Keuangan / Bersihkan Data Duplikat">
      <div className="card" style={{ background: 'var(--gold-soft)', marginBottom: 18 }}>
        <div className="card-body" style={{ fontSize: 12.5, color: '#8a5b00' }}>
          ⚠️ Alat ini memindai tagihan SPP &amp; Biaya Lain yang <strong>persis sama</strong> (siswa + jenis/bulan yang
          sama) dan menghapus baris berlebih, menyisakan <strong>1 baris saja</strong>. Baris yang sudah punya riwayat
          pembayaran <strong>tidak pernah dihapus</strong> — kalau lebih dari 1 baris dalam 1 kelompok sama-sama sudah
          dibayar, kelompok itu dilewati (perlu diperiksa manual) demi keamanan data.
        </div>
      </div>

      <div className="info-grid" style={{ marginBottom: 18 }}>
        <div className="card"><div className="card-body">
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{kelompokDuplikat.length}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Kelompok Duplikat Ditemukan</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{totalBarisAkanDihapus}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Baris Akan Dihapus (Aman)</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>{kelompokAmbigu.length}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Kelompok Ambigu (Dilewati)</div>
        </div></div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Daftar Kelompok Duplikat</h3><p>Urut dari yang paling banyak duplikatnya.</p></div>
          <button className="btn btn-primary" onClick={bersihkanSemua} disabled={memproses || totalBarisAkanDihapus === 0}>
            {memproses ? 'Membersihkan...' : `🧹 Hapus ${totalBarisAkanDihapus} Baris Duplikat`}
          </button>
        </div>
        <div className="card-body table-scroll">
          {kelompokDuplikat.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
              ✅ Tidak ditemukan tagihan duplikat. Data Anda bersih!
            </p>
          )}
          {kelompokDuplikat.length > 0 && (
            <table>
              <thead>
                <tr><th>NISN</th><th>Nama Siswa</th><th>Jenis / Bulan</th><th>Jumlah Baris</th><th>Status</th></tr>
              </thead>
              <tbody>
                {kelompokDuplikat.map(k => (
                  <tr key={k.kunci}>
                    <td>{k.nisn}</td>
                    <td>{k.namaSiswa}</td>
                    <td>{k.refType === 'SPP' ? `SPP ${k.bulan} ${k.tahunKalender}` : k.label}</td>
                    <td style={{ fontWeight: 700 }}>{k.jumlahBaris} baris</td>
                    <td>
                      {k.aman ? (
                        <span className="badge badge-green">Simpan 1, hapus {k.hapus.length}</span>
                      ) : (
                        <span className="badge badge-red" title={k.alasan}>⚠️ Ambigu — dilewati</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {progress && <ProgressModal title={progress.label} current={progress.current} total={progress.total} />}

      {tagihanSalahKelas.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div>
              <h3>⚠️ Tagihan Biaya Lain yang Tidak Sesuai Kelas Tarif Saat Ini</h3>
              <p>
                Ini <strong>bukan</strong> duplikat, tapi tagihan yang kelas siswanya sekarang tidak cocok dengan
                Tarif yang berlaku. Biasanya terjadi kalau Tarif tadinya "Semua Kelas" lalu diubah jadi kelas
                spesifik <em>setelah</em> tagihan sudah terlanjur terbit — tagihan yang sudah ada tidak ikut berubah
                otomatis. Periksa satu-satu sebelum menghapus.
              </p>
            </div>
          </div>
          <div className="card-body table-scroll">
            <table>
              <thead>
                <tr><th>NISN</th><th>Nama Siswa</th><th>Jenis Biaya</th><th>Kelas Siswa Sekarang</th><th>Tarif Berlaku Untuk Kelas</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {tagihanSalahKelas.map(t => (
                  <tr key={`${t.refType}-${t.no}`}>
                    <td>{t.nisn}</td>
                    <td>{t.namaSiswa}</td>
                    <td>{t.label}</td>
                    <td>Kelas {t.kelasSiswaSekarang}</td>
                    <td>Kelas {t.kelasSeharusnya}</td>
                    <td>
                      {t.punyaPembayaran ? (
                        <span className="badge badge-green" title="Sudah dibayar, tidak bisa dihapus dari sini">Sudah dibayar</span>
                      ) : (
                        <button className="btn btn-sm" onClick={() => hapusSatuSalahKelas(t)}>🗑️ Hapus</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Page>
  );
}
