// Riwayat pembaruan aplikasi -- versi diambil dari git commit, TAPI deskripsinya
// ditulis ULANG manual (bukan disalin mentah dari pesan commit) supaya bahasanya
// pantas dibaca pengguna sekolah, bukan istilah teknis programmer. Setiap kali ada
// rilis baru, tambahkan 1 entri baru di PALING ATAS array ini.
export const CHANGELOG = [
  {
    versi: '1.8.0',
    tanggal: '2026-09-07',
    poin: [
      'Form Catat Pembayaran, Pemasukan Lain, dan Pengeluaran sekarang punya pilihan "Akun Kas/Bank" — tentukan uangnya masuk/keluar dari akun mana (Kas fisik, atau Bank BCA misalnya)',
      'Buku Besar sekarang benar-benar memisahkan mutasi per akun sesuai pilihan itu, mencegah selisih saldo antar akun kas/bank',
    ],
  },
  {
    versi: '1.7.0',
    tanggal: '2026-09-07',
    poin: [
      'Fitur baru: <b>Buku Besar</b> — pilih akun (Kas, Piutang, Pendapatan, Beban) untuk lihat riwayat mutasi dan saldo berjalan, bisa tambah akun sendiri',
      'Neraca sekarang bisa dilihat per bulan tertentu, tidak cuma kondisi hari ini',
      'Perbaikan bug penting: angka Kas di Neraca sebelumnya belum menghitung Pemasukan Lain, sekarang sudah benar dan sinkron dengan Cashflow',
      'Halaman Dashboard Eksekutif dihapus (fungsinya sudah tercakup di laporan lain)',
    ],
  },
  {
    versi: '1.6.0',
    tanggal: '2026-09-07',
    poin: [
      'Form "Pemasukan Lain" dan "Pengeluaran" kini muncul sebagai jendela pop-up (klik tombol "+ Baru"), bukan tertata permanen di bawah tabel',
      'Perbaikan bug: tabel sekarang pasti ter-update begitu selesai menyimpan data baru',
      'Animasi konfirmasi simpan sekarang juga tampil di Catat Pembayaran, Tambah User, Ganti Password, dan Profil Sekolah',
    ],
  },
  {
    versi: '1.5.1',
    tanggal: '2026-09-07',
    poin: [
      'Fitur baru: halaman <b>Riwayat Pembaruan</b> ini sendiri — klik nomor versi di footer untuk melihat semua perubahan aplikasi dari awal',
    ],
  },
  {
    versi: '1.5.0',
    tanggal: '2026-09-07',
    poin: [
      'Fitur baru: <b>Pemasukan Lain & Pengeluaran</b> — catat donasi, bantuan pemerintah, dan pengeluaran operasional sekolah dalam 1 menu',
      'Laporan <b>Laba Rugi</b> sekarang ikut menghitung Pemasukan Lain, bukan cuma SPP',
      'Laporan baru: <b>Cashflow & Kondisi Kas</b> — lihat saldo kas berjalan tiap bulan beserta grafik trennya',
    ],
  },
  {
    versi: '1.4.1',
    tanggal: '2026-09-07',
    poin: [
      'Rapikan tampilan Kartu SPP & Kartu Biaya Lain — angka rupiah kini rapi sejajar seperti kartu fisik',
    ],
  },
  {
    versi: '1.4.0',
    tanggal: '2026-09-07',
    poin: [
      'Kartu SPP & Kartu Biaya Lain kini terpisah rapi (2 kolom di layar besar), lengkap dengan header sekolah',
      'Bisa dibagikan langsung sebagai gambar ke WhatsApp lewat tombol share di tiap kartu',
    ],
  },
  {
    versi: '1.3.2',
    tanggal: '2026-09-06',
    poin: [
      'Perbaikan visual: warna judul Portofolio Guru, nama panjang tidak lagi terpotong',
      'Status Belum Lunas/Lunas di Portofolio Siswa kini berwarna merah/hijau',
      'Grafik "Sebaran per Kelas" tampil lebih menarik (kartu warna-warni)',
    ],
  },
  {
    versi: '1.3.1',
    tanggal: '2026-09-06',
    poin: [
      'Perbaikan bug: kotak saran pencarian (Portofolio, Catat Pembayaran, dll) yang sebelumnya bisa terpotong, sekarang selalu tampil utuh',
    ],
  },
  {
    versi: '1.3.0',
    tanggal: '2026-09-06',
    poin: [
      'Fitur baru: <b>Portofolio Siswa</b> dan <b>Portofolio Guru/Staff</b> — kartu profil siap cetak, tinggal cari nama',
    ],
  },
  {
    versi: '1.2.0',
    tanggal: '2026-09-06',
    poin: [
      'Semua kartu statistik di seluruh aplikasi sekarang punya ikon',
      'Tambah kartu "Total Nilai Belum Dibayar" di Pembayaran & Invoice',
    ],
  },
  {
    versi: '1.1.1',
    tanggal: '2026-09-06',
    poin: [
      'Perbaikan penting: sesi login tidak lagi otomatis keluar saat halaman di-refresh',
      'Tambah kartu "Total Invoice Belum Lunas"',
    ],
  },
  {
    versi: '1.1.0',
    tanggal: '2026-09-06',
    poin: [
      'Tambah kartu ringkasan (Total Transaksi, Total Dibayar, Pembayaran Bulan Ini) di halaman Pembayaran & Invoice',
    ],
  },
  {
    versi: '1.0.9',
    tanggal: '2026-09-06',
    poin: [
      'Dashboard sekarang lengkap dengan Ringkasan Keuangan dan Ringkasan Sarpras beserta grafiknya',
    ],
  },
  {
    versi: '1.0.8',
    tanggal: '2026-09-06',
    poin: [
      'Laporan Rekap Aset bisa diekspor ke Word (.docx) — bisa langsung diedit, bukan cuma gambar',
    ],
  },
  {
    versi: '1.0.7',
    tanggal: '2026-09-06',
    poin: [
      'Laporan Rekap Aset bisa diekspor ke PDF (ukuran kertas A4, siap cetak)',
    ],
  },
  {
    versi: '1.0.6',
    tanggal: '2026-09-06',
    poin: [
      'Perbaikan bug: angka di Laporan Rekap Aset yang sempat salah tampil (0 dan NaN)',
    ],
  },
  {
    versi: '1.0.5',
    tanggal: '2026-09-06',
    poin: [
      'Data Aset dirombak: kondisi Baik/Rusak Ringan/Rusak Berat sekarang terpisah dan Total dihitung otomatis',
      'Bisa upload foto aset, dan tambah Kode Aset manual',
      'Tambah tombol "Lihat" untuk melihat detail aset lengkap dengan foto',
    ],
  },
  {
    versi: '1.0.4',
    tanggal: '2026-09-05',
    poin: [
      'Saat klik Simpan, muncul animasi progres dan pesan sukses yang lebih jelas',
    ],
  },
  {
    versi: '1.0.3',
    tanggal: '2026-09-05',
    poin: [
      'Data Guru & Staff: field "Tugas Tambahan" sekarang bisa diisi lebih dari satu (mis. Kepala Madrasah + Ketua Yayasan sekaligus)',
      'Kategori tambah pilihan "Guru & Staff" untuk yang berperan ganda',
    ],
  },
  {
    versi: '1.0.2',
    tanggal: '2026-09-05',
    poin: [
      'Data Guru & Staff disederhanakan jadi 1 tabel dengan filter, bukan 2 tab terpisah',
    ],
  },
  {
    versi: '1.0.1',
    tanggal: '2026-09-05',
    poin: [
      'Semua file Excel yang diunduh sekarang punya kolom nomor urut otomatis',
      'Tambah nomor versi & waktu update di footer, supaya gampang cek apakah aplikasi sudah ter-update',
    ],
  },
  {
    versi: '1.0.0',
    tanggal: '2026-09-04',
    poin: [
      '🎉 Rilis awal — migrasi penuh dari HTML ke aplikasi React',
      'Modul SPP: Data Siswa, Kelas, Guru, Tagihan, Pembayaran, Invoice, Rekap Tunggakan, Laporan Keuangan',
      'Modul Sarpras: Data Aset, Peminjaman, Pemeliharaan, Laporan Rekap Aset',
      'Export Excel & PDF di semua tabel, koneksi Google Sheets tertanam aman',
    ],
  },
];
