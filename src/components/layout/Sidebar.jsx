import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppContext';
import { NAV_STRUCTURE, groupHasAccess } from './navConfig';
import ScrollFade from './ScrollFade';
import pkg from '../../../package.json';

const Arrow = () => (
  <svg className="nav-group-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
);

const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);

// __BUILD_TIME__ ditanam Vite saat "npm run build" dijalankan (lihat vite.config.js) --
// bukan variabel biasa, jadi TIDAK BOLEH dihapus meski terlihat "undefined" di editor.
function formatWaktuBuild(isoString) {
  try {
    const d = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    return formatter.format(d) + ' WIB';
  } catch {
    return '-';
  }
}

function NavGroup({ id, label, children, sub, open, onToggle }) {
  return (
    <div className={`nav-group ${sub ? 'nav-subgroup' : ''} ${open ? 'open' : ''}`}>
      <div className="nav-group-header" onClick={() => onToggle(id)}>
        <span>{label}</span>
        <Arrow />
      </div>
      <div className="nav-group-items">{children}</div>
    </div>
  );
}

function Item({ to, children, canAccess }) {
  if (canAccess === false) return null;
  return (
    <NavLink to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      {children}
    </NavLink>
  );
}

// ---- Rail ikon ciutan (desktop) -- dipakai HANYA saat sidebar di-collapse lewat
// tombol hamburger. Memakai sumber menu "mesin" (NAV_STRUCTURE/groupHasAccess) yg
// SAMA dipakai TabletRail, tapi dgn CSS sendiri (.sidebar-rail-*) krn .rail-* bawaan
// TabletRail sengaja disembunyikan paksa di lebar layar desktop (lihat theme.css,
// @media min-width:1025px) sehingga tidak bisa dipakai ulang langsung di sini.
function SidebarRailIcon({ node, active, onClick }) {
  return (
    <button type="button" className={'sidebar-rail-icon-btn' + (active ? ' active' : '')} onClick={onClick} title={node.label}>
      <span className="sidebar-rail-icon-emoji">{node.icon}</span>
    </button>
  );
}

function SidebarRailLinks({ node, canAccess }) {
  if (node.items) {
    return node.items
      .filter((it) => canAccess(it.pageId))
      .map((it) => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => 'sidebar-rail-link' + (isActive ? ' active' : '')}>
          {it.label}
        </NavLink>
      ));
  }
  if (node.subgroups) {
    return node.subgroups.map((sg) => {
      const items = sg.items.filter((it) => canAccess(it.pageId));
      if (!items.length) return null;
      return (
        <div key={sg.id} className="sidebar-rail-subgroup">
          <div className="sidebar-rail-subgroup-label">{sg.groupLabel || sg.label}</div>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => 'sidebar-rail-link' + (isActive ? ' active' : '')}>
              {it.label}
            </NavLink>
          ))}
        </div>
      );
    });
  }
  return null;
}

const COLLAPSE_KEY = 'sidebarCollapsed_v1';

function bacaCollapsedTersimpan() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Sidebar() {
  const { canAccess } = useAuth();
  const { profilSekolah } = useAppData();
  const [openGroups, setOpenGroups] = useState({ spp: true, keuangan: true });
  const toggle = (id) => setOpenGroups(g => ({ ...g, [id]: !g[id] }));

  // Sidebar ciutan (icon-only) -- permintaan: "berikan humberger utk sidebar, lalu
  // ciutkan, hanya menampilkan icon saja, sehingga bbrp tabel tampil sempurna".
  // Status ciutan disimpan di localStorage supaya tetap konsisten tiap buka halaman.
  const [collapsed, setCollapsed] = useState(() => bacaCollapsedTersimpan());
  const [openFlyout, setOpenFlyout] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* localStorage diblokir -- status ciutan tetap jalan di memori */ }
  }, [collapsed]);

  useEffect(() => { setOpenFlyout(null); }, [location.pathname]);

  useEffect(() => {
    if (!openFlyout) return undefined;
    function onDown(e) {
      const target = e.target;
      if (target instanceof Element && (target.closest('.sidebar') || target.closest('.sidebar-rail-flyout'))) return;
      setOpenFlyout(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openFlyout]);

  const visibleRailNodes = NAV_STRUCTURE.filter((n) => groupHasAccess(n, canAccess));
  const activeFlyoutNode = visibleRailNodes.find((n) => n.id === openFlyout);

  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
      <div className="sidebar-head">
        {!collapsed && (
          profilSekolah?.logo ? (
            <img src={profilSekolah.logo} alt="Logo Sekolah" width="38" height="38" style={{ objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <svg width="38" height="38" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="21" fill="#1C7A3C" />
              <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800" fill="#F0B429">MI</text>
            </svg>
          )
        )}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-name">{profilSekolah?.nama || 'MI Ikhlasiyah'}</div>
            <div className="brand-sub">SPP dan Sarpras</div>
          </div>
        )}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
          aria-label={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
        >
          <HamburgerIcon />
        </button>
      </div>

      {!collapsed && (
        <nav className="sidebar-nav">
          <Item to="/dashboard" canAccess={canAccess('dashboard')}>Dashboard</Item>

          <NavGroup id="spp" label="🎓 SPP" open={openGroups.spp} onToggle={toggle}>
            <Item to="/dashboard-spp" canAccess={canAccess('dashboard-spp')}>Dashboard SPP</Item>
            <Item to="/pembayaran" canAccess={canAccess('pembayaran')}>Pembayaran</Item>
          </NavGroup>

          <NavGroup id="keuangan" label="💰 KEUANGAN" open={openGroups.keuangan} onToggle={toggle}>
            <Item to="/dashboard-keuangan" canAccess={canAccess('dashboard-keuangan')}>Dashboard Keuangan</Item>
            <Item to="/tagihan" canAccess={canAccess('tagihan')}>Tagihan &amp; Biaya</Item>
            <Item to="/pemasukan-pengeluaran" canAccess={canAccess('pemasukan-pengeluaran')}>Pemasukan &amp; Pengeluaran Lain</Item>
            <Item to="/tunggakan" canAccess={canAccess('tunggakan')}>Rekap Tunggakan</Item>
            <Item to="/beasiswa" canAccess={canAccess('beasiswa')}>Beasiswa</Item>
            <Item to="/laporan-keuangan" canAccess={canAccess('laporan-keuangan')}>Laporan Keuangan</Item>
          </NavGroup>

          <NavGroup id="sarpras" label="🏫 SARPRAS" open={openGroups.sarpras} onToggle={toggle}>
            <Item to="/aset" canAccess={canAccess('aset')}>Data Aset &amp; Inventaris</Item>
            <Item to="/peminjaman-aset" canAccess={canAccess('peminjaman-aset')}>Peminjaman Aset</Item>
            <Item to="/pemeliharaan-aset" canAccess={canAccess('pemeliharaan-aset')}>Pemeliharaan Aset</Item>
            <Item to="/aset-laporan" canAccess={canAccess('laporan-rekap-aset')}>Laporan Rekap Aset</Item>
          </NavGroup>

          <NavGroup id="pengaturan" label="⚙️ PENGATURAN" open={openGroups.pengaturan} onToggle={toggle}>
            <NavGroup id="pgt-user" label="👤 USER" sub open={openGroups['pgt-user']} onToggle={toggle}>
              <Item to="/manajemen-user" canAccess={canAccess('manajemen-user')}>Manajemen User</Item>
              <Item to="/hakakses" canAccess={canAccess('hakakses')}>Manajemen Hak Akses</Item>
            </NavGroup>
            <NavGroup id="pgt-modul" label="🧩 MODUL" sub open={openGroups['pgt-modul']} onToggle={toggle}>
              <Item to="/profil" canAccess={canAccess('profil')}>Profil Sekolah &amp; Tahun Ajaran</Item>
              <Item to="/kelas" canAccess={canAccess('kelas')}>Data Kelas &amp; Rombel</Item>
              <Item to="/guru" canAccess={canAccess('guru')}>Data Guru &amp; Staff</Item>
              <Item to="/siswa" canAccess={canAccess('siswa')}>Data Siswa</Item>
            </NavGroup>
            <NavGroup id="pgt-system" label="🖥️ SYSTEM" sub open={openGroups['pgt-system']} onToggle={toggle}>
              <Item to="/koneksi-sheets" canAccess={canAccess('koneksi-sheets')}>Pengaturan Koneksi</Item>
              <Item to="/pengaturan-sistem" canAccess={canAccess('pengaturan-sistem')}>Pengaturan Sistem</Item>
              <Item to="/bersihkan-duplikat" canAccess={canAccess('bersihkan-duplikat')}>Cek Data dan Sistem</Item>
              <Item to="/log-histori" canAccess={canAccess('log-histori')}>Log Histori</Item>
            </NavGroup>
          </NavGroup>
        </nav>
      )}

      {collapsed && (
        <nav className="sidebar-rail-icons">
          {visibleRailNodes.map((node) => (
            <SidebarRailIcon
              key={node.id}
              node={node}
              active={openFlyout === node.id}
              onClick={() => {
                if (node.type === 'link') {
                  navigate(node.to);
                  setOpenFlyout(null);
                } else {
                  setOpenFlyout((o) => (o === node.id ? null : node.id));
                }
              }}
            />
          ))}
        </nav>
      )}

      {collapsed && activeFlyoutNode && (
        <div className="sidebar-rail-flyout">
          <div className="sidebar-rail-flyout-head">{activeFlyoutNode.groupLabel || activeFlyoutNode.label}</div>
          <ScrollFade className="sidebar-rail-flyout-body">
            <SidebarRailLinks node={activeFlyoutNode} canAccess={canAccess} />
          </ScrollFade>
        </div>
      )}

      {!collapsed && (
        <div className="sidebar-foot">
          Jundicomp © 2026
          <div style={{ fontSize: 10.5, opacity: .7, marginTop: 3 }}>
            {canAccess('changelog') ? (
              <NavLink to="/changelog" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }} title="Lihat riwayat pembaruan aplikasi">
                v{pkg.version}
              </NavLink>
            ) : (
              <span>v{pkg.version}</span>
            )} · {formatWaktuBuild(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null)}
          </div>
        </div>
      )}
    </aside>
  );
}
