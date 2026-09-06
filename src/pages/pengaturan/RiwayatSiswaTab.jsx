import { useMemo, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { useAppData } from '../../context/AppContext';
import { STATUS_SISWA_OPTIONS } from '../../db/siswaFields';
import { exportToExcel } from '../../utils/exportTable';

const STATUS_NONAKTIF = STATUS_SISWA_OPTIONS.filter(s => s !== 'Aktif'); // ['Lulus','Pindah','Berhenti']

const STATUS_BADGE = {
  Lulus: 'badge-green',
  Pindah: 'badge-blue',
  Berhenti: 'badge-red',
};

export default function RiwayatSiswaTab() {
  const { siswa, siswaLoading, siswaLoaded } = useAppData();
  const [filterStatus, setFilterStatus] = useState('Semua');

  const siswaNonaktif = useMemo(
    () => siswa.filter(s => STATUS_NONAKTIF.includes(s.status || 'Aktif')),
    [siswa]
  );

  const jumlahPerStatus = useMemo(() => {
    const map = {};
    STATUS_NONAKTIF.forEach(st => { map[st] = siswaNonaktif.filter(s => s.status === st).length; });
    return map;
  }, [siswaNonaktif]);

  const filtered = useMemo(() => {
    return filterStatus === 'Semua' ? siswaNonaktif : siswaNonaktif.filter(s => s.status === filterStatus);
  }, [siswaNonaktif, filterStatus]);

  const columns = [
    { key: 'nisn', label: 'NISN', accessor: r => r.nisn || '-' },
    { key: 'nama', label: 'Nama Lengkap', accessor: r => r.nama, sortable: true },
    { key: 'kelasTingkat', label: 'Kelas Terakhir', accessor: r => r.kelasTingkat || '-' },
    { key: 'status', label: 'Status', render: r => <span className={`badge ${STATUS_BADGE[r.status] || 'badge-muted'}`}>{r.status}</span>, sortable: true },
  ];

  function exportExcelRiwayat() {
    const headers = ['NISN', 'Nama Lengkap', 'Kelas Terakhir', 'Status'];
    const rows = filtered.map(s => ({ NISN: s.nisn || '-', 'Nama Lengkap': s.nama, 'Kelas Terakhir': s.kelasTingkat || '-', Status: s.status }));
    const judul = filterStatus === 'Semua' ? 'Riwayat Siswa - Semua Status' : `Riwayat Siswa - ${filterStatus}`;
    exportToExcel(headers, rows, judul, judul);
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Riwayat Siswa</h3><p>Siswa yang sudah Lulus, Pindah, atau Berhenti — datanya tetap tersimpan untuk riwayat/audit, tidak ikut dihitung atau ditagih lagi.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            <option value="Semua">Semua Status</option>
            {STATUS_NONAKTIF.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <button className="btn btn-sm" onClick={exportExcelRiwayat} disabled={filtered.length === 0}>📊 Excel</button>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {STATUS_NONAKTIF.map(st => (
            <div key={st} style={{ padding: '8px 16px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
              {st}: <strong>{jumlahPerStatus[st] || 0}</strong>
            </div>
          ))}
        </div>

        {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data...</p>}
        {siswaLoaded && filtered.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada siswa dengan status ini.</p>}
        {siswaLoaded && filtered.length > 0 && (
          <DataTable
            columns={columns}
            data={filtered}
            searchFn={(r, t) => (r.nama || '').toLowerCase().includes(t) || (r.nisn || '').includes(t)}
            emptyMessage="Tidak ada siswa yang cocok dengan pencarian ini."
            rowKey={r => r.id}
          />
        )}
      </div>
    </div>
  );
}
