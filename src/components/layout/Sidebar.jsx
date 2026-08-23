import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Arrow = () => (
  <svg className="nav-group-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
);

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

export default function Sidebar() {
  const { canAccess } = useAuth();
  const [openGroups, setOpenGroups] = useState({ spp: true, keuangan: true });
  const toggle = (id) => setOpenGroups(g => ({ ...g, [id]: !g[id] }));

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <svg width="38" height="38" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="#1C7A3C" />
          <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800" fill="#F0B429">MI</text>
        </svg>
        <div>
          <div className="brand-name">MI Ikhlasiyah</div>
          <div className="brand-sub">SPP dan Sarpras</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Item to="/dashboard" canAccess={canAccess('dashboard')}>Dashboard</Item>

        <NavGroup id="spp" label="🎓 SPP" open={openGroups.spp} onToggle={toggle}>
          <Item to="/spp" canAccess={canAccess('spp')}>SPP Peserta Didik</Item>
        </NavGroup>

        <NavGroup id="keuangan" label="💰 KEUANGAN" open={openGroups.keuangan} onToggle={toggle}>
          <Item to="/tagihan" canAccess={canAccess('tagihan')}>Tagihan &amp; Biaya</Item>
          <Item to="/pembayaran" canAccess={canAccess('pembayaran')}>Pembayaran &amp; Invoice</Item>
          <Item to="/tunggakan" canAccess={canAccess('tunggakan')}>Rekap Tunggakan</Item>
          <Item to="/laporan-keuangan" canAccess={canAccess('laporan-keuangan')}>Laporan Keuangan</Item>
        </NavGroup>

        <NavGroup id="sarpras" label="🏫 SARPRAS" open={openGroups.sarpras} onToggle={toggle}>
          <Item to="/aset" canAccess={canAccess('aset')}>Data Aset &amp; Inventaris</Item>
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
            <Item to="/log-histori" canAccess={canAccess('log-histori')}>Log Histori</Item>
          </NavGroup>
        </NavGroup>
      </nav>

      <div className="sidebar-foot">Jundicomp © 2026</div>
    </aside>
  );
}
