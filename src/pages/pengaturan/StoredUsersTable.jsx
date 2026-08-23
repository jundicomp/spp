import { useEffect, useState, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import { fetchUsersFromSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function StoredUsersTable({ refreshKey }) {
  const { toast } = useAppData();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured()) return;
    setLoading(true);
    try {
      const data = await fetchUsersFromSheet();
      setRows(data);
      setLoaded(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const columns = [
    { key: 'Nama', label: 'Nama', accessor: r => r['Nama'] },
    { key: 'Role', label: 'Role', accessor: r => r['Role'] },
    { key: 'Username', label: 'Username', accessor: r => r['Username'] },
    { key: 'Password', label: 'Password', render: r => (showPassword ? r['Password'] : '••••••••') },
    { key: 'Email', label: 'Email', accessor: r => r['Email'] || '-' },
  ];

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Daftar User (Google Sheets)</h3><p>Akun ini bisa langsung dipakai login.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setShowPassword(s => !s)}>{showPassword ? '🙈 Sembunyikan' : '👁 Tampilkan'} Password</button>
          <button className="btn btn-sm" onClick={load} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
      </div>
      <div className="card-body">
        {!isConfigured() && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Atur koneksi Google Sheets dulu untuk melihat data ini.</p>}
        {isConfigured() && loaded && (
          <DataTable
            columns={columns}
            data={rows}
            searchFn={(r, t) => (r['Nama'] || '').toLowerCase().includes(t) || (r['Username'] || '').toLowerCase().includes(t)}
            emptyMessage="Belum ada user tersimpan di Sheet."
            rowKey={(r, i) => r['No'] ?? i}
          />
        )}
      </div>
    </div>
  );
}
