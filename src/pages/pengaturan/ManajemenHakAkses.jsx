import Page from '../../components/layout/Page';
import { Fragment, useState } from 'react';
import { useAppData } from '../../context/AppContext';

const GRUP_ORDER = ['Umum', 'SPP', 'Keuangan', 'Sarpras', 'Pengaturan'];

export default function ManajemenHakAkses() {
  const { HAK_AKSES_PAGES, HAK_AKSES_TABS, permissionRoles, halamanSensitif, ADMIN_ONLY_PAGES, permissions, setPermission, toast } = useAppData();
  const [terbuka, setTerbuka] = useState({}); // { [pageId]: true } -- halaman mana yg tabnya sedang ditampilkan

  function toggle(role, itemId, checked, label) {
    setPermission(role, itemId, checked);
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
          <div><h3>🔐 Manajemen Hak Akses</h3><p>Centang menu yang boleh diakses tiap role. Klik ▸ di samping menu utk atur sampai level tab di dalamnya.</p></div>
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
                    {pages.map(p => {
                      const tabsHalamanIni = HAK_AKSES_TABS[p.id];
                      const punyaTab = tabsHalamanIni && tabsHalamanIni.length > 0;
                      const sedangTerbuka = !!terbuka[p.id];
                      return (
                        <Fragment key={p.id}>
                          <tr>
                            <td>
                              {punyaTab ? (
                                <button
                                  onClick={() => setTerbuka(t => ({ ...t, [p.id]: !t[p.id] }))}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontSize: 13, color: 'var(--text)' }}
                                >
                                  <span style={{ fontSize: 10, color: 'var(--muted)', width: 10, display: 'inline-block' }}>{sedangTerbuka ? '▾' : '▸'}</span>
                                  {p.label}
                                </button>
                              ) : (
                                <span style={{ paddingLeft: 16 }}>{p.label}</span>
                              )}
                            </td>
                            {permissionRoles.map(role => {
                              const locked = isLocked(role, p.id);
                              const checked = permissions[role]?.[p.id];
                              return (
                                <td key={role} style={{ textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={!!checked}
                                    disabled={locked}
                                    onChange={e => toggle(role, p.id, e.target.checked, p.label)}
                                    style={{ width: 16, height: 16, accentColor: 'var(--green)' }}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                          {punyaTab && sedangTerbuka && tabsHalamanIni.map(tabInfo => {
                            const itemId = `${p.id}.${tabInfo.id}`;
                            return (
                              <tr key={itemId} style={{ background: '#FAFBFA' }}>
                                <td style={{ paddingLeft: 40, fontSize: 12.5, color: 'var(--muted)' }}>↳ {tabInfo.label}</td>
                                {permissionRoles.map(role => {
                                  const pageLocked = isLocked(role, p.id);
                                  const pageChecked = permissions[role]?.[p.id] !== false;
                                  const tabChecked = permissions[role]?.[itemId];
                                  // Tab tidak bisa dicentang kalau halaman induknya sendiri tidak diizinkan.
                                  const disabled = pageLocked || !pageChecked;
                                  return (
                                    <td key={role} style={{ textAlign: 'center' }}>
                                      <input
                                        type="checkbox"
                                        checked={tabChecked !== false}
                                        disabled={disabled}
                                        onChange={e => toggle(role, itemId, e.target.checked, `${p.label} — ${tabInfo.label}`)}
                                        style={{ width: 14, height: 14, accentColor: 'var(--gold)' }}
                                        title={disabled && !pageLocked ? 'Aktifkan dulu akses halamannya' : undefined}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
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
            Admin saja, bahkan Kepala Sekolah tidak bisa diberi akses ke situ. Centang di bawah menu (↳) hanya bisa
            diaktifkan kalau menu induknya sendiri sudah diizinkan.
          </p>
        </div>
      </div>
    </Page>
  );
}
