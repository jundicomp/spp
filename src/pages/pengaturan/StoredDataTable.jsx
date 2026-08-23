import { useEffect, useState, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import { SISWA_HEADERS } from '../../db/siswaFields';
import { fetchSiswaFromSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function StoredDataTable({ refreshKey }) {
  const { toast } = useAppData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured()) return;
    setLoading(true);
    try {
      const data = await fetchSiswaFromSheet();
      setRows(data);
      setLoaded(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const columns = SISWA_HEADERS.filter(h => h !== 'No').map(h => ({ key: h, label: h, accessor: (r) => r[h] }));

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Data Siswa Tersimpan</h3><p>Diambil langsung dari Google Sheets.</p></div>
        <button className="btn btn-sm" onClick={load} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat Ulang'}</button>
      </div>
      <div className="card-body">
        {!isConfigured() && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Atur koneksi Google Sheets dulu di bagian atas untuk melihat data.</p>}
        {isConfigured() && loaded && (
          <DataTable
            columns={columns}
            data={rows}
            searchFn={(r, t) => (r['Nama Lengkap'] || '').toLowerCase().includes(t) || (r['NISN'] || '').toString().includes(t)}
            emptyMessage="Belum ada data siswa di Sheet."
            rowKey={(r, i) => r['No'] ?? i}
          />
        )}
      </div>
    </div>
  );
}
