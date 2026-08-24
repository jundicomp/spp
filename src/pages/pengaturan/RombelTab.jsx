import { useMemo, useState } from 'react';
import { hitungUsia } from '../../db/helpers';
import { useAppData } from '../../context/AppContext';

export default function RombelTab() {
  const { siswa, siswaLoading, siswaLoaded, kelas } = useAppData();
  const [filterKelas, setFilterKelas] = useState('Semua');

  // Rombel hanya utk siswa Aktif -- yg Lulus/Pindah/Berhenti ada di tab Riwayat Siswa.
  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const waliKelasByTingkat = useMemo(() => {
    const map = {};
    kelas.forEach(k => { if (k.tingkat && k.waliKelas) map[k.tingkat] = k.waliKelas; });
    return map;
  }, [kelas]);

  const daftarKelas = useMemo(() => {
    const set = new Set(siswaAktif.map(s => s.kelasTingkat).filter(Boolean));
    return Array.from(set).sort();
  }, [siswaAktif]);

  const filtered = useMemo(() => {
    const list = filterKelas === 'Semua' ? siswaAktif : siswaAktif.filter(s => s.kelasTingkat === filterKelas);
    return list.slice().sort((a, b) => a.nama.localeCompare(b.nama));
  }, [siswaAktif, filterKelas]);

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Rombel (Rombongan Belajar)</h3><p>Daftar siswa dikelompokkan per kelas/tingkat.</p></div>
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          <option value="Semua">Semua Kelas</option>
          {daftarKelas.map(k => <option key={k} value={k}>Kelas {k}</option>)}
        </select>
      </div>
      <div className="card-body">
        {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data...</p>}
        {siswaLoaded && filtered.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Tidak ada siswa untuk filter ini.</p>}
        {siswaLoaded && filtered.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>No</th><th>NISN</th><th>Nama Lengkap</th><th>NIK</th><th>Usia</th><th>L/P</th><th>Wali Kelas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const usia = hitungUsia(s.tanggalLahir);
                  const lp = s.jenisKelamin === 'Laki-laki' ? 'L' : s.jenisKelamin === 'Perempuan' ? 'P' : '-';
                  const wali = waliKelasByTingkat[s.kelasTingkat];
                  return (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>{s.nisn || '-'}</td>
                      <td>{s.nama}</td>
                      <td>{s.nik || '-'}</td>
                      <td>{usia !== null ? `${usia} tahun` : '-'}</td>
                      <td>{lp}</td>
                      <td style={wali ? undefined : { color: 'var(--muted)', fontStyle: 'italic' }}>{wali || 'Belum ditentukan'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
