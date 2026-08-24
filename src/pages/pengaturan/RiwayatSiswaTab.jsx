import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { STATUS_SISWA_OPTIONS } from '../../db/siswaFields';

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
    const list = filterStatus === 'Semua' ? siswaNonaktif : siswaNonaktif.filter(s => s.status === filterStatus);
    return list.slice().sort((a, b) => a.nama.localeCompare(b.nama));
  }, [siswaNonaktif, filterStatus]);

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Riwayat Siswa</h3><p>Siswa yang sudah Lulus, Pindah, atau Berhenti — datanya tetap tersimpan untuk riwayat/audit, tidak ikut dihitung atau ditagih lagi.</p></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
          <option value="Semua">Semua Status</option>
          {STATUS_NONAKTIF.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
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
          <div className="table-scroll">
            <table>
              <thead><tr><th>No</th><th>NISN</th><th>Nama Lengkap</th><th>Kelas Terakhir</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>{s.nisn || '-'}</td>
                    <td>{s.nama}</td>
                    <td>{s.kelasTingkat || '-'}</td>
                    <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-muted'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
