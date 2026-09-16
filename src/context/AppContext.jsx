import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { permissionRoles, halamanSensitif } from '../db/seed';
import { normalizeSheetSiswa } from '../db/siswaFields';
import { normalizeSheetKelas } from '../db/kelasFields';
import { normalizeSheetGuru } from '../db/guruFields';
import { normalizeSheetAset } from '../db/asetFields';
import { normalizeSheetTahunAjaran } from '../db/tahunAjaranFields';
import { normalizeSheetProfil } from '../db/profilFields';
import { normalizeSheetTarif } from '../db/tarifFields';
import { normalizeSheetTagihanSpp, normalizeSheetTagihanLain, hitungTerbayar } from '../db/tagihanHelpers';
import { normalizeSheetPembayaran } from '../db/pembayaranFields';
import { normalizeSheetPengeluaran } from '../db/pengeluaranFields';
import { normalizeSheetPemasukanLain } from '../db/pemasukanLainFields';
import { normalizeSheetAkun } from '../db/akunBukuBesarFields';
import { normalizeSheetBeasiswaKategori, normalizeSheetBeasiswaSiswa } from '../db/beasiswaFields';
import {
  fetchSiswaFromSheet, fetchKelasFromSheet, fetchGuruFromSheet,
  fetchTahunAjaranFromSheet, fetchProfilFromSheet, fetchTarifFromSheet, fetchAsetFromSheet,
  fetchTagihanSppFromSheet, fetchTagihanLainFromSheet, fetchPembayaranFromSheet, fetchPengeluaranFromSheet, fetchPemasukanLainFromSheet, fetchAkunFromSheet,
  fetchBeasiswaKategoriFromSheet, fetchBeasiswaSiswaFromSheet,
  setActiveTahunAjaranOnSheet, isConfigured, fetchAllFromSheet,
  fetchRolesFromSheet, addRoleToSheet, deleteRoleFromSheet,
  fetchHakAksesFromSheet, saveHakAksesRole,
} from '../services/googleSheets';
import useSheetResource from '../hooks/useSheetResource';

const AppDataContext = createContext(null);

const HAK_AKSES_PAGES = [
  { id: 'dashboard', label: 'Dashboard', grup: 'Umum' },
  { id: 'profil-saya', label: 'Profil Saya', grup: 'Umum' },
  { id: 'changelog', label: 'Riwayat Pembaruan (Changelog)', grup: 'Umum' },
  { id: 'spp', label: 'SPP Peserta Didik', grup: 'SPP' },
  { id: 'tagihan', label: 'Tagihan & Biaya', grup: 'Keuangan' },
  { id: 'bersihkan-duplikat', label: 'Bersihkan Data Duplikat', grup: 'Keuangan' },
  { id: 'pembayaran', label: 'Pembayaran & Invoice', grup: 'Keuangan' },
  { id: 'pemasukan-pengeluaran', label: 'Pemasukan & Pengeluaran Lain', grup: 'Keuangan' },
  { id: 'tunggakan', label: 'Rekap Tunggakan', grup: 'Keuangan' },
  { id: 'beasiswa', label: 'Beasiswa', grup: 'Keuangan' },
  { id: 'laporan-keuangan', label: 'Laporan Keuangan', grup: 'Keuangan' },
  { id: 'aset', label: 'Data Aset & Inventaris', grup: 'Sarpras' },
  { id: 'peminjaman-aset', label: 'Peminjaman Aset', grup: 'Sarpras' },
  { id: 'pemeliharaan-aset', label: 'Pemeliharaan Aset', grup: 'Sarpras' },
  { id: 'laporan-rekap-aset', label: 'Laporan Rekap Aset', grup: 'Sarpras' },
  { id: 'profil', label: 'Profil Sekolah & Tahun Ajaran', grup: 'Pengaturan' },
  { id: 'kelas', label: 'Data Kelas & Rombel', grup: 'Pengaturan' },
  { id: 'guru', label: 'Data Guru & Staff', grup: 'Pengaturan' },
  { id: 'siswa', label: 'Data Siswa', grup: 'Pengaturan' },
  { id: 'manajemen-user', label: 'Manajemen User', grup: 'Pengaturan' },
  { id: 'hakakses', label: 'Manajemen Hak Akses', grup: 'Pengaturan' },
  { id: 'koneksi-sheets', label: 'Pengaturan Koneksi Google Sheets', grup: 'Pengaturan' },
  { id: 'pengaturan-sistem', label: 'Pengaturan Sistem', grup: 'Pengaturan' },
  { id: 'log-histori', label: 'Log Histori', grup: 'Pengaturan' },
];

const ADMIN_ONLY_PAGES = ['koneksi-sheets', 'pengaturan-sistem'];

// Daftar TAB di dalam tiap halaman yg punya sub-tab -- dipakai Manajemen Hak Akses
// utk atur izin sampai level tab (bukan cuma per-halaman). Halaman yg TIDAK disebut
// di sini dianggap tidak punya tab (izinnya cuma level halaman spt biasa). Key ID
// tab di sini HARUS SAMA PERSIS dgn string dipakai di setTab('...') halaman terkait.
const HAK_AKSES_TABS = {
  tagihan: [
    { id: 'penerbitan', label: 'Penerbitan SPP' },
    { id: 'lain', label: 'Penerbitan Lain' },
    { id: 'tarif', label: 'Tarif' },
  ],
  pembayaran: [
    { id: 'pembayaran', label: 'Pembayaran' },
    { id: 'invoice', label: 'Invoice' },
  ],
  'pemasukan-pengeluaran': [
    { id: 'pemasukan', label: 'Pemasukan Lain' },
    { id: 'pengeluaran', label: 'Pengeluaran' },
  ],
  'laporan-keuangan': [
    { id: 'bukubesar', label: 'Buku Besar' },
    { id: 'cashflow', label: 'Cashflow' },
    { id: 'rekap', label: 'Rekapitulasi' },
    { id: 'labarugi', label: 'Laba Rugi' },
    { id: 'neraca', label: 'Neraca' },
  ],
  beasiswa: [
    { id: 'kategori', label: 'Kategori Beasiswa' },
    { id: 'siswa', label: 'Siswa Penerima' },
  ],
  aset: [
    { id: 'tabel', label: 'Data Aset (Tabel)' },
    { id: 'manual', label: 'Tambah Manual' },
  ],
  'peminjaman-aset': [
    { id: 'tabel', label: 'Daftar Peminjaman' },
    { id: 'manual', label: 'Catat Peminjaman' },
  ],
  'pemeliharaan-aset': [
    { id: 'tabel', label: 'Daftar Pemeliharaan' },
    { id: 'manual', label: 'Catat Pemeliharaan' },
  ],
  'manajemen-user': [
    { id: 'tambah', label: 'Tambah User' },
    { id: 'daftar', label: 'Daftar User' },
  ],
  profil: [
    { id: 'profil', label: 'Profil Sekolah' },
    // "Tahun Ajaran" py 2 sub-tab LAGI di dalamnya -- subTabs = tab bersarang level
    // ke-3 (Modul > Halaman > Tab > Sub-Tab). ItemId gabungannya jadi 3 bagian
    // dipisah titik, mis. "profil.tahun.tabel".
    { id: 'tahun', label: 'Tahun Ajaran', subTabs: [
      { id: 'tabel', label: 'Daftar Tahun Ajaran' },
      { id: 'manual', label: 'Tambah Tahun Ajaran' },
    ] },
  ],
  kelas: [
    { id: 'tabel', label: 'Data Kelas (Tabel)' },
    { id: 'manual', label: 'Tambah Manual' },
  ],
  guru: [
    { id: 'tabel', label: 'Data Guru & Staff (Tabel)' },
    { id: 'manual', label: 'Tambah' },
    { id: 'portofolio', label: 'Portofolio' },
  ],
  siswa: [
    { id: 'tabel', label: 'Data Siswa (Tabel)' },
    { id: 'rombel', label: 'Rombel' },
    { id: 'riwayat', label: 'Riwayat Siswa' },
    { id: 'portofolio', label: 'Portofolio' },
    { id: 'manual', label: 'Tambah Manual' },
    { id: 'excel', label: 'Upload Excel' },
  ],
};

// 4 role BAWAAN yg selalu ada (Admin & Kepala Sekolah py perlakuan khusus di bawah) --
// role TAMBAHAN yg dibuat lewat "+ Tambah Role" digabung di ATAS daftar ini, TIDAK
// menggantikannya, supaya role bawaan tidak pernah hilang begitu saja.
const ROLE_BAWAAN = ['Kepala Sekolah', 'Bendahara / TU', 'Staf TU', 'Admin'];

function buildDefaultPermissionsUntukRole(role) {
  const perms = {};
  HAK_AKSES_PAGES.forEach(p => {
    if (ADMIN_ONLY_PAGES.includes(p.id)) {
      perms[p.id] = role === 'Admin';
    } else {
      perms[p.id] = !(halamanSensitif.includes(p.id) && !['Kepala Sekolah', 'Admin'].includes(role));
    }
  });
  return perms;
}

export function AppProvider({ children }) {
  const [permissions, setPermissions] = useState({});
  const [rolesTambahan, setRolesTambahan] = useState([]); // dari Sheet, di LUAR 4 role bawaan
  const permissionRoles = useMemo(() => [...ROLE_BAWAAN, ...rolesTambahan], [rolesTambahan]);

  const isiRolesHakAksesDariRows = useCallback((roleRows, hakRows) => {
    setRolesTambahan(roleRows.map(r => String(r['Nama Role'] ?? '').trim()).filter(Boolean));
    const permMap = {};
    hakRows.forEach(row => {
      const role = String(row['Role'] ?? '').trim();
      try { permMap[role] = JSON.parse(row['PermissionsJson'] || '{}'); } catch { permMap[role] = {}; }
    });
    setPermissions(permMap);
  }, []);

  // "Tiket" antrean utk fetch Roles+Hak Akses -- ADA 2 tempat yg bisa memuat data ini
  // (muatMaster saat app pertama dibuka, DAN muatRolesDanHakAkses saat "Terapkan"/tambah
  // role) -- keduanya menulis ke state `permissions` yg SAMA. Tanpa penanda tiket ini,
  // fetch yg dikirim DULUAN tapi kebetulan lambat selesainya (mis. muatMaster kena
  // "cold start" Apps Script pas app baru dibuka) bisa selesai BELAKANGAN dan menimpa
  // balik hasil fetch yg lebih BARU (yg sudah mencerminkan perubahan barusan) dengan
  // data BASI -- persis gejala "abis Terapkan sukses & kotaknya sudah benar, tapi
  // beberapa detik kemudian balik sendiri ke posisi lama". Aturannya: tiap kali MULAI
  // fetch, ambil nomor tiket baru; saat fetch itu SELESAI, cuma diterapkan kalau tiketnya
  // MASIH yg terbaru (blm ada fetch lain yg dimulai sesudahnya) -- fetch basi dibuang.
  const hakAksesTiketRef = useRef(0);
  const terapkanHakAksesJikaMasihTerbaru = useCallback((tiket, roleRows, hakRows) => {
    if (tiket !== hakAksesTiketRef.current) return;
    isiRolesHakAksesDariRows(roleRows, hakRows);
  }, [isiRolesHakAksesDariRows]);

  const muatRolesDanHakAkses = useCallback(async () => {
    if (!isConfigured()) return;
    const tiket = ++hakAksesTiketRef.current;
    try {
      const [roleRows, hakRows] = await Promise.all([fetchRolesFromSheet(), fetchHakAksesFromSheet()]);
      terapkanHakAksesJikaMasihTerbaru(tiket, roleRows, hakRows);
    } catch (err) {
      // Diam2 gagal -- role/permission tetap pakai default bawaan di bawah (fallback).
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terapkanHakAksesJikaMasihTerbaru]);

  // addRole: cuma role TAMBAHAN (di luar 4 bawaan) yg bisa ditambah lewat sini.
  const addRole = useCallback(async (namaRole) => {
    const nama = namaRole.trim();
    if (!nama) throw new Error('Nama role tidak boleh kosong.');
    if (permissionRoles.includes(nama)) throw new Error('Role dengan nama itu sudah ada.');
    await addRoleToSheet(nama);
    await muatRolesDanHakAkses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionRoles]);

  // Ubah 1 izin (halaman ATAU "halaman.tab") utk 1 role -- update state LANGSUNG
  // (biar UI responsif), lalu simpan JSON lengkap role itu ke Sheet di belakang layar.
  // Terapkan SEKALIGUS beberapa perubahan izin (dipanggil oleh tombol "Terapkan" di
  // Manajemen Hak Akses) -- BUKAN lagi simpan langsung tiap klik checkbox. daftarPerubahan
  // = [{role, itemId, checked}, ...]. Semua dikirim, baru SEKALI refresh dari server &
  // SATU toast ringkasan di akhir -- lebih cepat dirasakan (centang tidak nunggu network
  // tiap klik) dan otomatis menghindari race condition antar klik cepat sama sekali.
  const terapkanPerubahanHakAkses = useCallback(async (daftarPerubahan) => {
    if (daftarPerubahan.length === 0) return;
    const gagal = [];
    for (const { role, itemId, checked } of daftarPerubahan) {
      try {
        await saveHakAksesRole(role, itemId, checked);
      } catch (err) {
        gagal.push({ role, itemId, error: err.message });
      }
    }
    await muatRolesDanHakAkses();
    if (gagal.length === 0) {
      toast(`${daftarPerubahan.length} perubahan hak akses berhasil diterapkan.`);
    } else {
      toast(`${daftarPerubahan.length - gagal.length} perubahan tersimpan, ${gagal.length} gagal: ${gagal[0].error}`, 'error');
    }
    return gagal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissionsUntukTampil = useMemo(() => {
    const hasil = {};
    permissionRoles.forEach(role => {
      // PENTING: GABUNG default (baseline aman -- halaman admin-only/sensitif otomatis
      // tertutup utk role selain Admin/Kepala Sekolah) DENGAN izin yg sudah PERNAH
      // disimpan eksplisit utk role itu -- bukan pilih salah satu spt sebelumnya
      // (`permissions[role] || buildDefaultPermissionsUntukRole(role)`). Kenapa: begitu
      // 1 role py SATU SAJA baris di Sheet Hak Akses (krn baru 1x pernah diubah), cara
      // LAMA membuang SELURUH baseline default role itu -- akibatnya SEMUA halaman lain
      // yg belum pernah disentuh (termasuk yg admin-only spt Pengaturan Koneksi Google
      // Sheets & Pengaturan Sistem) diam2 jadi TERBUKA (default "boleh" krn key-nya
      // tidak ada), padahal harusnya tetap tertutup utk role selain Admin. Baseline
      // default dipasang DULU, baru ditimpa oleh apa yg benar2 pernah disimpan eksplisit.
      hasil[role] = { ...buildDefaultPermissionsUntukRole(role), ...(permissions[role] || {}) };
    });
    return hasil;
  }, [permissionRoles, permissions]);

  const [toasts, setToasts] = useState([]);

  // ---- Data induk: SUMBER ASLINYA Google Sheets, bukan lagi data dami ----
  // "deferInitialFetch: true" di SEMUANYA -- data awal diisi SEKALIGUS lewat batch
  // (lihat useEffect fetchAllFromSheet di bawah), bukan 14 request terpisah saat
  // mount. refresh() manual (setelah tambah/edit/hapus) TETAP 1 request spt biasa.
  const defer = { deferInitialFetch: true };
  const siswaRes = useSheetResource(fetchSiswaFromSheet, normalizeSheetSiswa, 'master', defer);
  const kelasRes = useSheetResource(fetchKelasFromSheet, normalizeSheetKelas, 'master', defer);
  const guruRes = useSheetResource(fetchGuruFromSheet, normalizeSheetGuru, 'master', defer);
  const asetRes = useSheetResource(fetchAsetFromSheet, normalizeSheetAset, 'master', defer);
  const tahunAjaranRes = useSheetResource(fetchTahunAjaranFromSheet, normalizeSheetTahunAjaran, 'master', defer);
  const tarifRes = useSheetResource(fetchTarifFromSheet, normalizeSheetTarif, 'keuangan', defer);
  const tagihanSppRes = useSheetResource(fetchTagihanSppFromSheet, normalizeSheetTagihanSpp, 'keuangan', defer);
  const tagihanLainRes = useSheetResource(fetchTagihanLainFromSheet, normalizeSheetTagihanLain, 'keuangan', defer);
  const pembayaranRes = useSheetResource(fetchPembayaranFromSheet, normalizeSheetPembayaran, 'keuangan', defer);
  const pengeluaranRes = useSheetResource(fetchPengeluaranFromSheet, normalizeSheetPengeluaran, 'keuangan', defer);
  const pemasukanLainRes = useSheetResource(fetchPemasukanLainFromSheet, normalizeSheetPemasukanLain, 'keuangan', defer);
  const akunRes = useSheetResource(fetchAkunFromSheet, normalizeSheetAkun, 'keuangan', defer);
  const beasiswaKategoriRes = useSheetResource(fetchBeasiswaKategoriFromSheet, normalizeSheetBeasiswaKategori, 'keuangan', defer);
  const beasiswaSiswaRes = useSheetResource(fetchBeasiswaSiswaFromSheet, normalizeSheetBeasiswaSiswa, 'keuangan', defer);

  // ---- Profil Sekolah: 1 rekaman tunggal, bukan daftar ----
  // TIDAK auto-fetch sendiri saat mount lagi (dulu +1 request terpisah) -- diisi
  // lewat batch Master di bawah. refreshProfil() manual TETAP jalan spt biasa.
  const [profilSekolah, setProfilSekolahRaw] = useState(null);
  const [profilLoading, setProfilLoading] = useState(true);
  const [profilExists, setProfilExists] = useState(false);
  const isiProfilDariRows = useCallback((rows) => {
    if (rows.length > 0) {
      setProfilSekolahRaw(normalizeSheetProfil(rows[0]));
      setProfilExists(true);
    } else {
      setProfilSekolahRaw(null);
      setProfilExists(false);
    }
    setProfilLoading(false);
  }, []);
  const refreshProfil = useCallback(async () => {
    if (!isConfigured()) { setProfilSekolahRaw(null); setProfilLoading(false); return; }
    setProfilLoading(true);
    try {
      const rows = await fetchProfilFromSheet();
      isiProfilDariRows(rows);
    } finally {
      setProfilLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Load AWAL: 1 request gabungan per target (Master & Keuangan), BUKAN 14+1
  // request terpisah -- lihat catatan di useSheetResource.js & fetchAllFromSheet().
  // Kalau batch GAGAL utk 1 target (mis. sedang ada gangguan sesaat), jatuhkan ke
  // cara lama (refresh() 1-per-1 utk target itu saja) sbg cadangan, supaya user
  // tidak sepenuhnya macet cuma krn 1 request gabungan gagal.
  useEffect(() => {
    let batal = false;
    async function muatMaster() {
      if (!isConfigured('master')) { isiProfilDariRows([]); return; }
      const tiketHakAkses = ++hakAksesTiketRef.current;
      try {
        const semua = await fetchAllFromSheet('master');
        if (batal) return;
        siswaRes.setFromBatch(semua.siswa || []);
        kelasRes.setFromBatch(semua.kelas || []);
        guruRes.setFromBatch(semua.guru || []);
        asetRes.setFromBatch(semua.aset || []);
        tahunAjaranRes.setFromBatch(semua.tahunAjaran || []);
        isiProfilDariRows(semua.profil || []);
        terapkanHakAksesJikaMasihTerbaru(tiketHakAkses, semua.roles || [], semua.hakAkses || []);
      } catch (err) {
        if (batal) return;
        // Cadangan: kalau batch gagal, tetap coba 1-per-1 spt versi lama.
        siswaRes.refresh(); kelasRes.refresh(); guruRes.refresh(); asetRes.refresh(); tahunAjaranRes.refresh();
        refreshProfil();
        muatRolesDanHakAkses();
      }
    }
    async function muatKeuangan() {
      if (!isConfigured('keuangan')) return;
      try {
        const semua = await fetchAllFromSheet('keuangan');
        if (batal) return;
        tarifRes.setFromBatch(semua.tarif || []);
        tagihanSppRes.setFromBatch(semua.tagihanSpp || []);
        tagihanLainRes.setFromBatch(semua.tagihanLain || []);
        pembayaranRes.setFromBatch(semua.pembayaran || []);
        pengeluaranRes.setFromBatch(semua.pengeluaran || []);
        pemasukanLainRes.setFromBatch(semua.pemasukanLain || []);
        akunRes.setFromBatch(semua.akunBukuBesar || []);
        beasiswaKategoriRes.setFromBatch(semua.beasiswaKategori || []);
        beasiswaSiswaRes.setFromBatch(semua.beasiswaSiswa || []);
      } catch (err) {
        if (batal) return;
        tarifRes.refresh(); tagihanSppRes.refresh(); tagihanLainRes.refresh(); pembayaranRes.refresh();
        pengeluaranRes.refresh(); pemasukanLainRes.refresh(); akunRes.refresh();
        beasiswaKategoriRes.refresh(); beasiswaSiswaRes.refresh();
      }
    }
    muatMaster();
    muatKeuangan();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkron ulang Hak Akses SECARA BERKALA + tiap kali tab ini balik aktif (mis. user
  // pindah ke tab/aplikasi lain lalu balik lagi) -- PENTING krn tanpa ini, sesi yg
  // sudah lama terbuka (mis. petugas login pagi, tab-nya dibiarkan terbuka seharian)
  // akan TERUS pakai salinan izin akses yg diambil SEKALI waktu pertama dia login,
  // walau Admin sudah ubah & Terapkan hak akses barunya di sesi lain. Efeknya persis
  // spt yg dilaporkan: kelihatannya "hak akses sudah dicabut tapi kok bisa akses
  // terus, tidak ada perubahan apa pun" -- padahal datanya di Sheet sudah benar,
  // cuma sesi yg SEDANG terbuka itu belum tahu ada perubahan (tidak ada mekanisme
  // push real-time dari Sheet ke browser). Begitu permissions ke-refresh, halaman yg
  // sedang tampil ikut re-render otomatis (canAccess baca ulang state ini), jadi
  // TIDAK perlu user logout/refresh manual utk pembatasan barunya berlaku.
  useEffect(() => {
    function saatTabAktifLagi() {
      if (document.visibilityState === 'visible') muatRolesDanHakAkses();
    }
    document.addEventListener('visibilitychange', saatTabAktifLagi);
    const interval = setInterval(muatRolesDanHakAkses, 2 * 60 * 1000); // jaga2 tiap 2 menit walau tab tak pernah di-blur sama sekali
    return () => {
      document.removeEventListener('visibilitychange', saatTabAktifLagi);
      clearInterval(interval);
    };
  }, [muatRolesDanHakAkses]);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const tahunAjaranAktifObj = useMemo(() => tahunAjaranRes.data.find(t => t.aktif), [tahunAjaranRes.data]);

  const siswaById = useCallback((id) => siswaRes.data.find(s => s.id === id), [siswaRes.data]);

  const allTagihan = useMemo(() => [...tagihanSppRes.data, ...tagihanLainRes.data], [tagihanSppRes.data, tagihanLainRes.data]);
  const tagihanTerbayar = useCallback((refType, refNo) => hitungTerbayar(pembayaranRes.data, refType, refNo), [pembayaranRes.data]);

  const setTahunAjaranAktif = useCallback(async (no) => {
    await setActiveTahunAjaranOnSheet(no);
    await tahunAjaranRes.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahunAjaranRes.refresh]);

  const value = {
    tahunAjaran: tahunAjaranRes.data, tahunAjaranLoading: tahunAjaranRes.loading, tahunAjaranLoaded: tahunAjaranRes.loaded, refreshTahunAjaran: tahunAjaranRes.refresh,
    tahunAjaranAktif: tahunAjaranAktifObj, setTahunAjaranAktif,
    siswa: siswaRes.data, siswaLoading: siswaRes.loading, siswaError: siswaRes.error, siswaLoaded: siswaRes.loaded, refreshSiswa: siswaRes.refresh, siswaById,
    kelas: kelasRes.data, kelasLoading: kelasRes.loading, kelasError: kelasRes.error, kelasLoaded: kelasRes.loaded, refreshKelas: kelasRes.refresh,
    guru: guruRes.data, guruLoading: guruRes.loading, guruError: guruRes.error, guruLoaded: guruRes.loaded, refreshGuru: guruRes.refresh,
    aset: asetRes.data, asetLoading: asetRes.loading, asetError: asetRes.error, asetLoaded: asetRes.loaded, refreshAset: asetRes.refresh,
    tarif: tarifRes.data, tarifLoading: tarifRes.loading, tarifError: tarifRes.error, tarifLoaded: tarifRes.loaded, refreshTarif: tarifRes.refresh,
    tagihanSpp: tagihanSppRes.data, tagihanSppLoading: tagihanSppRes.loading, tagihanSppLoaded: tagihanSppRes.loaded, refreshTagihanSpp: tagihanSppRes.refresh,
    tagihanLain: tagihanLainRes.data, tagihanLainLoading: tagihanLainRes.loading, tagihanLainLoaded: tagihanLainRes.loaded, refreshTagihanLain: tagihanLainRes.refresh,
    pembayaran: pembayaranRes.data, pembayaranLoading: pembayaranRes.loading, pembayaranLoaded: pembayaranRes.loaded, refreshPembayaran: pembayaranRes.refresh,
    pengeluaran: pengeluaranRes.data, pengeluaranLoading: pengeluaranRes.loading, pengeluaranLoaded: pengeluaranRes.loaded, refreshPengeluaran: pengeluaranRes.refresh,
    pemasukanLain: pemasukanLainRes.data, pemasukanLainLoading: pemasukanLainRes.loading, pemasukanLainLoaded: pemasukanLainRes.loaded, refreshPemasukanLain: pemasukanLainRes.refresh,
    akun: akunRes.data, akunLoading: akunRes.loading, akunLoaded: akunRes.loaded, refreshAkun: akunRes.refresh,
    beasiswaKategori: beasiswaKategoriRes.data, beasiswaKategoriLoading: beasiswaKategoriRes.loading, beasiswaKategoriLoaded: beasiswaKategoriRes.loaded, refreshBeasiswaKategori: beasiswaKategoriRes.refresh,
    beasiswaSiswa: beasiswaSiswaRes.data, beasiswaSiswaLoading: beasiswaSiswaRes.loading, beasiswaSiswaLoaded: beasiswaSiswaRes.loaded, refreshBeasiswaSiswa: beasiswaSiswaRes.refresh,
    allTagihan, tagihanTerbayar,
    profilSekolah, profilLoading, profilExists, refreshProfil,
    permissions: permissionsUntukTampil, terapkanPerubahanHakAkses, addRole, muatRolesDanHakAkses,
    toast, toasts,
    HAK_AKSES_PAGES, HAK_AKSES_TABS, permissionRoles, halamanSensitif, ADMIN_ONLY_PAGES,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData harus dipakai di dalam <AppProvider>');
  return ctx;
}
