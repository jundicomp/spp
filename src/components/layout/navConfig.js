// Sumber tunggal struktur menu untuk navigasi Tablet (icon-rail) dan Mobile
// (bottom-nav). Sidebar desktop TIDAK memakai file ini (sengaja dibiarkan
// seperti semula supaya tidak ada risiko regresi pada menu yang sudah
// berjalan baik) -- tapi struktur & pageId di bawah harus tetap disamakan
// persis dengan src/components/layout/Sidebar.jsx setiap kali menu berubah.

export const NAV_STRUCTURE = [
  { id: 'dashboard', type: 'link', to: '/dashboard', pageId: 'dashboard', label: 'Dashboard', icon: '🏠' },
  {
    id: 'spp', type: 'group', label: 'SPP', groupLabel: '🎓 SPP', icon: '🎓',
    items: [
      { to: '/dashboard-spp', pageId: 'dashboard-spp', label: 'Dashboard SPP' },
      { to: '/pembayaran', pageId: 'pembayaran', label: 'Pembayaran' },
    ],
  },
  {
    id: 'keuangan', type: 'group', label: 'Keuangan', groupLabel: '💰 KEUANGAN', icon: '💰',
    items: [
      { to: '/tagihan', pageId: 'tagihan', label: 'Tagihan & Biaya' },
      { to: '/bersihkan-duplikat', pageId: 'bersihkan-duplikat', label: 'Cek Data dan Sistem' },
      { to: '/pemasukan-pengeluaran', pageId: 'pemasukan-pengeluaran', label: 'Pemasukan & Pengeluaran Lain' },
      { to: '/tunggakan', pageId: 'tunggakan', label: 'Rekap Tunggakan' },
      { to: '/beasiswa', pageId: 'beasiswa', label: 'Beasiswa' },
      { to: '/laporan-keuangan', pageId: 'laporan-keuangan', label: 'Laporan Keuangan' },
    ],
  },
  {
    id: 'sarpras', type: 'group', label: 'Sarpras', groupLabel: '🏫 SARPRAS', icon: '🏫',
    items: [
      { to: '/aset', pageId: 'aset', label: 'Data Aset & Inventaris' },
      { to: '/peminjaman-aset', pageId: 'peminjaman-aset', label: 'Peminjaman Aset' },
      { to: '/pemeliharaan-aset', pageId: 'pemeliharaan-aset', label: 'Pemeliharaan Aset' },
      { to: '/aset-laporan', pageId: 'laporan-rekap-aset', label: 'Laporan Rekap Aset' },
    ],
  },
  {
    id: 'pengaturan', type: 'group', label: 'Pengaturan', mobileLabel: 'Atur', groupLabel: '⚙️ PENGATURAN', icon: '⚙️',
    subgroups: [
      {
        id: 'pgt-user', label: 'User', groupLabel: '👤 USER',
        items: [
          { to: '/manajemen-user', pageId: 'manajemen-user', label: 'Manajemen User' },
          { to: '/hakakses', pageId: 'hakakses', label: 'Manajemen Hak Akses' },
        ],
      },
      {
        id: 'pgt-modul', label: 'Modul', groupLabel: '🧩 MODUL',
        items: [
          { to: '/profil', pageId: 'profil', label: 'Profil Sekolah & Tahun Ajaran' },
          { to: '/kelas', pageId: 'kelas', label: 'Data Kelas & Rombel' },
          { to: '/guru', pageId: 'guru', label: 'Data Guru & Staff' },
          { to: '/siswa', pageId: 'siswa', label: 'Data Siswa' },
        ],
      },
      {
        id: 'pgt-system', label: 'System', groupLabel: '🖥️ SYSTEM',
        items: [
          { to: '/koneksi-sheets', pageId: 'koneksi-sheets', label: 'Pengaturan Koneksi' },
          { to: '/pengaturan-sistem', pageId: 'pengaturan-sistem', label: 'Pengaturan Sistem' },
          { to: '/log-histori', pageId: 'log-histori', label: 'Log Histori' },
        ],
      },
    ],
  },
];

// Apakah user punya akses ke setidaknya 1 halaman di dalam node ini (dipakai
// untuk sembunyikan icon/tombol grup yang seluruh isinya tidak bisa diakses).
export function groupHasAccess(node, canAccess) {
  if (node.type === 'link') return canAccess(node.pageId);
  if (node.items) return node.items.some((it) => canAccess(it.pageId));
  if (node.subgroups) return node.subgroups.some((sg) => sg.items.some((it) => canAccess(it.pageId)));
  return false;
}
