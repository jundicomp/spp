import { useEffect, useState, useCallback } from 'react';
import Page from '../../components/layout/Page';
import DataTable from '../../components/common/DataTable';
import { fetchLogFromSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { initials, avatarColor } from '../../db/helpers';

export default function ProfilSaya() {
  const { toast } = useAppData();
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured() || !currentUser) return;
    setLoading(true);
    try {
      const data = await fetchLogFromSheet();
      const mine = data.filter(r => r['Username'] === currentUser.username).reverse();
      setRows(mine);
      setLoaded(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, currentUser]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'Waktu', label: 'Waktu', accessor: r => r['Waktu'] },
    { key: 'Aksi', label: 'Aksi', accessor: r => r['Aksi'] },
    { key: 'Modul', label: 'Modul', accessor: r => r['Modul'] },
    { key: 'Detail', label: 'Detail', accessor: r => r['Detail'] },
  ];

  return (
    <Page pageId="profil-saya" title="Profil Saya" path="Profil Saya">
      <div className="card">
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarColor(currentUser?.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {initials(currentUser?.nama || '?')}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 19 }}>{currentUser?.nama}</h2>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {currentUser?.role} &nbsp;·&nbsp; Username: {currentUser?.username} &nbsp;·&nbsp; {currentUser?.email || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Riwayat Aktivitas Saya</h3><p>Semua edit/hapus data yang pernah Anda lakukan.</p></div>
          <button className="btn btn-sm" onClick={load} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
        <div className="card-body">
          {!isConfigured() && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum tersambung ke Google Sheets.</p>}
          {isConfigured() && loaded && (
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage="Belum ada aktivitas tercatat untuk akun ini."
              rowKey={(r, i) => r['No'] ?? i}
            />
          )}
        </div>
      </div>
    </Page>
  );
}
