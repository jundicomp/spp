import Page from '../../components/layout/Page';
import { Fragment } from 'react';
import { useAppData } from '../../context/AppContext';

const GRUP_ORDER = ['Umum', 'SPP', 'Keuangan', 'Sarpras', 'Pengaturan'];

export default function ManajemenHakAkses() {
  const { HAK_AKSES_PAGES, permissionRoles, halamanSensitif, ADMIN_ONLY_PAGES, permissions, setPermissions, toast } = useAppData();

  function toggle(role, pageId, checked) {
    setPermissions(prev => ({ ...prev, [role]: { ...prev[role], [pageId]: checked } }));
    const label = HAK_AKSES_PAGES.find(p => p.id === pageId)?.label || pageId;
    toast(`Hak akses ${role} untuk "${label}" ${checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
  }

  function isLocked(role, pageId) {
    if (ADMIN_ONLY_PAGES.includes(pageId)) return role !== 'Admin'; // admin-only: yang lain terkunci OFF permanen
    if (halamanSensitif.includes(pageId)) return role === 'Kepala Sekolah' || role === 'Admin'; // selalu ON, tak bisa dicabut
    return false;
  }

  return (
    <Page pageId="hakakses" title="Manajemen Hak Akses" path="Pengaturan / User / Manajemen Hak Akses">
      <div className="card">
        <div className="card-head">
          <div><h3>🔐 Manajemen Hak Akses</h3><p>Centang menu yang boleh diakses tiap role. Berlaku langsung untuk sesi login berikutnya.</p></div>
        </div>
        <div className="card-body table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Menu</th>
                {permissionRoles.map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {GRUP_ORDER.map(grup => {
                const pages = HAK_AKSES_PAGES.filter(p => p.grup === grup);
                if (pages.length === 0) return null;
                return (
                  <Fragment key={grup}>
                    <tr>
                      <td colSpan={permissionRoles.length + 1} style={{ background: 'var(--green-soft)', color: 'var(--green-dark)', fontWeight: 800, textTransform: 'uppercase', fontSize: 11.5 }}>{grup}</td>
                    </tr>
                    {pages.map(p => (
                      <tr key={p.id}>
                        <td>{p.label}</td>
                        {permissionRoles.map(role => {
                          const locked = isLocked(role, p.id);
                          const checked = permissions[role]?.[p.id];
                          return (
                            <td key={role} style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={!!checked}
                                disabled={locked}
                                onChange={e => toggle(role, p.id, e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: 'var(--green)' }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0 }}>
            ⚠️ Kepala Sekolah &amp; Admin selalu punya akses penuh ke halaman sensitif (Manajemen User, Hak Akses, Log
            Penghapusan) — tidak bisa dicabut lewat sini. <strong>Pengaturan Koneksi Google Sheets</strong> khusus
            Admin saja, bahkan Kepala Sekolah tidak bisa diberi akses ke situ.
          </p>
        </div>
      </div>
    </Page>
  );
}
