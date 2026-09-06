import { useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { hitungUsia } from '../../db/helpers';
import { exportToExcel } from '../../utils/exportTable';
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
    return list.map(s => {
      const usia = hitungUsia(s.tanggalLahir);
      const lp = s.jenisKelamin === 'Laki-laki' ? 'L' : s.jenisKelamin === 'Perempuan' ? 'P' : '-';
      const wali = waliKelasByTingkat[s.kelasTingkat] || 'Belum ditentukan';
      return { ...s, usiaLabel: usia !== null ? `${usia} tahun` : '-', lp, wali };
    });
  }, [siswaAktif, filterKelas, waliKelasByTingkat]);

  const columns = [
    { key: 'nisn', label: 'NISN', accessor: r => r.nisn || '-' },
    { key: 'nama', label: 'Nama Lengkap', accessor: r => r.nama, sortable: true },
    { key: 'nik', label: 'NIK', accessor: r => r.nik || '-' },
    { key: 'usiaLabel', label: 'Usia', accessor: r => r.usiaLabel },
    { key: 'lp', label: 'L/P', accessor: r => r.lp },
    { key: 'wali', label: 'Wali Kelas', render: r => <span style={waliKelasByTingkat[r.kelasTingkat] ? undefined : { color: 'var(--muted)', fontStyle: 'italic' }}>{r.wali}</span> },
  ];

  function exportExcelRombel() {
    const headers = ['NISN', 'Nama Lengkap', 'NIK', 'Usia', 'L/P', 'Wali Kelas'];
    const rows = filtered.map(s => ({ NISN: s.nisn || '-', 'Nama Lengkap': s.nama, NIK: s.nik || '-', Usia: s.usiaLabel, 'L/P': s.lp, 'Wali Kelas': s.wali }));
    const judul = filterKelas === 'Semua' ? 'Rombel - Semua Kelas' : `Rombel - Kelas ${filterKelas}`;
    exportToExcel(headers, rows, judul, judul);
  }

  return (
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
  );
}
