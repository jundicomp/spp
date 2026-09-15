import { useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { hitungUsia } from '../../db/helpers';
import { exportToExcel } from '../../utils/exportTable';
import { useAppData } from '../../context/AppContext';
import { fetchSiswaFromSheet, updateSiswaInSheet } from '../../services/googleSheets';
import SaveProgressModal from '../../components/common/SaveProgressModal';

function PindahRombelMassal() {
  const { siswa, kelas, refreshSiswa, toast } = useAppData();
  const [rombelTujuan, setRombelTujuan] = useState('');
  const [filterKelasSumber, setFilterKelasSumber] = useState('Semua');
  const [subTab, setSubTab] = useState('belum'); // 'belum' | 'sudah' -- blm/sudah ada Rombel
  const [cari, setCari] = useState('');
  const [terpilih, setTerpilih] = useState({}); // { [siswaId]: true }
  const [memproses, setMemproses] = useState(false);
  const [phase, setPhase] = useState(null);

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const daftarKelasSumber = useMemo(() => {
    const set = new Set(siswaAktif.map(s => s.kelasTingkat).filter(Boolean));
    return Array.from(set).sort();
  }, [siswaAktif]);

  // Dipisah dulu berdasar Kelas & sudah/belum py Rombel -- SEBELUM pencarian nama/NISN,
  // supaya hitungan jumlah di label tab (Belum/Sudah) ikut Filter Kelas yg dipilih.
  const siswaSesuaiFilterAtas = useMemo(() => {
    return siswaAktif.filter(s => filterKelasSumber === 'Semua' || s.kelasTingkat === filterKelasSumber);
  }, [siswaAktif, filterKelasSumber]);

  const belumAdaRombel = useMemo(() => siswaSesuaiFilterAtas.filter(s => !s.rombel), [siswaSesuaiFilterAtas]);
  const sudahAdaRombel = useMemo(() => siswaSesuaiFilterAtas.filter(s => !!s.rombel), [siswaSesuaiFilterAtas]);
  const sumberSubTab = subTab === 'belum' ? belumAdaRombel : sudahAdaRombel;

  const hasilCari = useMemo(() => {
    if (!cari.trim()) return sumberSubTab;
    const t = cari.trim().toLowerCase();
    return sumberSubTab.filter(s => s.nama.toLowerCase().includes(t) || s.nisn.includes(t));
  }, [sumberSubTab, cari]);

  const jumlahTerpilih = Object.values(terpilih).filter(Boolean).length;

  function toggleSatu(id, checked) {
    setTerpilih(prev => ({ ...prev, [id]: checked }));
  }
  function toggleSemuaHasil(checked) {
    const next = { ...terpilih };
    hasilCari.forEach(s => { next[s.id] = checked; });
    setTerpilih(next);
  }
  const semuaHasilTercentang = hasilCari.length > 0 && hasilCari.every(s => terpilih[s.id]);

  async function pindahkan() {
    if (!rombelTujuan) { toast('Pilih rombel tujuan dulu.', 'error'); return; }
    const daftarNisn = siswaAktif.filter(s => terpilih[s.id]).map(s => s.nisn);
    if (daftarNisn.length === 0) { toast('Pilih minimal 1 siswa dulu.', 'error'); return; }
    const rombel = kelas.find(k => k.id === rombelTujuan);
    if (!rombel) { toast('Rombel tujuan tidak ditemukan.', 'error'); return; }

    setMemproses(true);
    setPhase('saving');
    try {
      // Ambil data MENTAH terbaru langsung dari Sheet (bukan dari state ternormalisasi)
      // supaya field lain siswa (alamat, dst) tidak ikut hilang saat ditulis ulang --
      // updateInSheet menimpa SATU BARIS PENUH sesuai header, jadi field yg tdk
      // disebut akan kosong kalau kita cuma kirim sebagian.
      const rawRows = await fetchSiswaFromSheet();
      let sukses = 0;
      for (const nisn of daftarNisn) {
        const raw = rawRows.find(r => String(r['NISN'] ?? '').trim() === nisn);
        if (!raw) continue;
        await updateSiswaInSheet({ ...raw, 'Kelas/Tingkat': rombel.tingkat, Rombel: rombel.namaKelas });
        sukses++;
      }
      setPhase('done');
      await new Promise(r => setTimeout(r, 1000));
      toast(`${sukses} siswa berhasil dipindahkan ke Kelas ${rombel.tingkat} Rombel ${rombel.namaKelas}.`);
      setTerpilih({});
      refreshSiswa();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setMemproses(false);
      setPhase(null);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>🔀 Pindah Rombel Massal</h3><p>Pilih beberapa siswa sekaligus, lalu pindahkan ke rombel (ruang kelas) tujuan.</p></div>
      </div>
      <div className="card-body">
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>Filter Kelas (Sumber)</label>
            <select value={filterKelasSumber} onChange={e => { setFilterKelasSumber(e.target.value); setTerpilih({}); }}>
              <option value="Semua">Semua Kelas</option>
              {daftarKelasSumber.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Rombel Tujuan</label>
            <select value={rombelTujuan} onChange={e => setRombelTujuan(e.target.value)}>
              <option value="">— pilih rombel tujuan —</option>
              {kelas.slice().sort((a, b) => a.tingkat.localeCompare(b.tingkat)).map(k => (
                <option key={k.id} value={k.id}>Kelas {k.tingkat} — Rombel {k.namaKelas}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cari Siswa</label>
            <input type="text" value={cari} onChange={e => setCari(e.target.value)} placeholder="Nama atau NISN..." />
          </div>
        </div>

        <div className="seg-tabs" style={{ marginBottom: 14 }}>
          <button className={`seg-tab ${subTab === 'belum' ? 'active' : ''}`} onClick={() => { setSubTab('belum'); setTerpilih({}); }}>
            ⚠️ BELUM ADA ROMBEL ({belumAdaRombel.length})
          </button>
          <button className={`seg-tab ${subTab === 'sudah' ? 'active' : ''}`} onClick={() => { setSubTab('sudah'); setTerpilih({}); }}>
            ✅ SUDAH ADA ROMBEL ({sudahAdaRombel.length})
          </button>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input type="checkbox" checked={semuaHasilTercentang} onChange={e => toggleSemuaHasil(e.target.checked)} style={{ width: 15, height: 15 }} />
                </th>
                <th style={{ width: 50 }}>No</th>
                <th>NISN</th>
                <th>Nama</th>
                <th>Jenis Kelamin</th>
                <th>Rombel Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              {hasilCari.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>Tidak ada siswa yang cocok.</td></tr>
              )}
              {hasilCari.map((s, idx) => (
                <tr key={s.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={!!terpilih[s.id]} onChange={e => toggleSatu(s.id, e.target.checked)} style={{ width: 15, height: 15 }} />
                  </td>
                  <td>{idx + 1}</td>
                  <td>{s.nisn || '-'}</td>
                  <td>{s.nama}</td>
                  <td>{s.jenisKelamin || '-'}</td>
                  <td>{s.rombel ? s.rombel : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>belum ada</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{jumlahTerpilih} siswa dipilih</span>
          <button className="btn btn-primary" onClick={pindahkan} disabled={memproses || jumlahTerpilih === 0 || !rombelTujuan}>
            {memproses ? 'Memindahkan...' : `Pindahkan (${jumlahTerpilih})`}
          </button>
        </div>
      </div>
      {phase && <SaveProgressModal phase={phase} />}
    </div>
  );
}

export default function RombelTab() {
  const { siswa, siswaLoading, siswaLoaded, kelas } = useAppData();
  const [filterKelas, setFilterKelas] = useState('Semua');

  // Rombel hanya utk siswa Aktif -- yg Lulus/Pindah/Berhenti ada di tab Riwayat Siswa.
  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  // Dicocokkan per ROMBEL spesifik (tingkat+namaKelas), BUKAN cuma tingkat -- 1
  // tingkat bisa py beberapa rombel (1A, 1B) dgn wali kelas BEDA-BEDA.
  const waliKelasByRombel = useMemo(() => {
    const map = {};
    kelas.forEach(k => { if (k.tingkat && k.namaKelas && k.waliKelas) map[`${k.tingkat}|${k.namaKelas}`] = k.waliKelas; });
    return map;
  }, [kelas]);

  const daftarKelas = useMemo(() => {
    const set = new Set(siswaAktif.map(s => s.kelasTingkat).filter(Boolean));
    return Array.from(set).sort();
  }, [siswaAktif]);

  const filtered = useMemo(() => {
    const list = filterKelas === 'Semua' ? siswaAktif : siswaAktif.filter(s => s.kelasTingkat === filterKelas);
    return list.map(s => {
      const usia = hitungUsia(s.tanggalLahir);
      const lp = s.jenisKelamin === 'Laki-laki' ? 'L' : s.jenisKelamin === 'Perempuan' ? 'P' : '-';
      const wali = waliKelasByRombel[`${s.kelasTingkat}|${s.rombel}`] || 'Belum ditentukan';
      return { ...s, usiaLabel: usia !== null ? `${usia} tahun` : '-', lp, wali };
    });
  }, [siswaAktif, filterKelas, waliKelasByRombel]);

  const columns = [
    { key: 'nisn', label: 'NISN', accessor: r => r.nisn || '-' },
    { key: 'nama', label: 'Nama Lengkap', accessor: r => r.nama, sortable: true },
    { key: 'nik', label: 'NIK', accessor: r => r.nik || '-' },
    { key: 'usiaLabel', label: 'Usia', accessor: r => r.usiaLabel },
    { key: 'lp', label: 'L/P', accessor: r => r.lp },
    { key: 'rombel', label: 'Rombel', accessor: r => r.rombel || '-' },
    { key: 'wali', label: 'Wali Kelas', render: r => <span style={waliKelasByRombel[`${r.kelasTingkat}|${r.rombel}`] ? undefined : { color: 'var(--muted)', fontStyle: 'italic' }}>{r.wali}</span> },
  ];

  function exportExcelRombel() {
    const headers = ['NISN', 'Nama Lengkap', 'NIK', 'Usia', 'L/P', 'Rombel', 'Wali Kelas'];
    const rows = filtered.map(s => ({ NISN: s.nisn || '-', 'Nama Lengkap': s.nama, NIK: s.nik || '-', Usia: s.usiaLabel, 'L/P': s.lp, Rombel: s.rombel || '-', 'Wali Kelas': s.wali }));
    const judul = filterKelas === 'Semua' ? 'Rombel - Semua Kelas' : `Rombel - Kelas ${filterKelas}`;
    exportToExcel(headers, rows, judul, judul);
  }

  return (
    <>
      <PindahRombelMassal />

      <div className="card">
        <div className="card-head">
          <div><h3>Rombel (Rombongan Belajar)</h3><p>Daftar siswa dikelompokkan per kelas/tingkat.</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
              <option value="Semua">Semua Kelas</option>
              {daftarKelas.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
            <button className="btn btn-sm" onClick={exportExcelRombel} disabled={filtered.length === 0}>📊 Excel</button>
          </div>
        </div>
        <div className="card-body">
          {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data...</p>}
          {siswaLoaded && filtered.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Tidak ada siswa untuk filter ini.</p>}
          {siswaLoaded && filtered.length > 0 && (
            <DataTable
              columns={columns}
              data={filtered}
              searchFn={(r, t) => (r.nama || '').toLowerCase().includes(t) || (r.nisn || '').includes(t) || (r.nik || '').includes(t)}
              emptyMessage="Tidak ada siswa yang cocok dengan pencarian ini."
              rowKey={r => r.id}
            />
          )}
        </div>
      </div>
    </>
  );
}
