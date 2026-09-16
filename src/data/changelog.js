// Riwayat pembaruan aplikasi -- versi diambil dari git commit, TAPI deskripsinya
// ditulis ULANG manual (bukan disalin mentah dari pesan commit) supaya bahasanya
// pantas dibaca pengguna sekolah, bukan istilah teknis programmer. Setiap kali ada
// rilis baru, tambahkan 1 entri baru di PALING ATAS array ini.
export const CHANGELOG = [
  {
    versi: '1.31.6',
    tanggal: '2026-09-16',
    poin: [
      'Fitur baru: panel "User Aktif" mengambang di pojok kanan atas, khusus terlihat oleh Admin & Kepala Sekolah. Panel ini otomatis menampilkan kotak kecil tiap kali ada petugas lain yang baru saja melakukan sesuatu di aplikasi (mis. "Inkaso — input biaya...", "Petugas SPP — input SPP bulan..."), lengkap dengan nama, role, dan jam kejadian',
      'Tiap kotak bisa ditutup sendiri-sendiri lewat tombol ✕, dan kotak lama yang tidak ditutup akan otomatis menghilang sendiri setelah 15 menit supaya layar tidak penuh',
      'Tidak perlu setelan tambahan apa pun — panel ini memanfaatkan data Log Histori yang sudah ada, jadi tidak menambah beban ke Google Sheets',
    ],
  },
  {
    versi: '1.31.5',
    tanggal: '2026-09-16',
    poin: [
      'Ketemu penyebab UTAMA hak akses "tidak berubah/balik lagi": sheet Hak Akses ternyata bisa punya lebih dari 1 baris untuk role yang sama (mis. Petugas SPP, Kepala Sekolah), dan aplikasi selama ini cuma membaca baris PALING TERAKHIR untuk tiap role — jadi pengaturan dari baris-baris sebelumnya (yang sebenarnya masih tersimpan utuh di Sheet) diam-diam terabaikan. Sekarang aplikasi menggabungkan SEMUA baris untuk role yang sama, jadi pengaturan lama tidak lagi "terkubur" oleh baris baru',
      'Perbaikan pencegahan di Apps Script supaya baris duplikat seperti itu tidak terus bertambah ke depannya',
    ],
  },
  {
    versi: '1.31.4',
    tanggal: '2026-09-16',
    poin: [
      'Perbaikan Manajemen Hak Akses: fitur sinkron-otomatis di versi sebelumnya (1.31.3) ternyata punya efek samping — kalau lagi sedang uncheck beberapa kotak tapi belum sempat klik "Terapkan", sinkron-otomatis itu bisa menimpa balik centang yang belum disimpan tadi. Sekarang sinkron-otomatis dijeda selama masih ada perubahan yang belum diterapkan, jadi centang yang sedang diedit tidak akan tertimpa lagi',
      'Perbaikan lebih dalam: role yang sudah pernah diatur hak aksesnya (walau baru 1 menu) bisa diam-diam kehilangan proteksi bawaan untuk menu-menu LAIN yang belum pernah disentuh — termasuk 2 menu khusus Admin (Pengaturan Koneksi Google Sheets, Pengaturan Sistem) yang seharusnya selalu tertutup untuk role selain Admin. Sekarang proteksi bawaan itu selalu jadi dasar, baru ditimpa oleh menu yang memang benar-benar pernah diatur manual',
    ],
  },
  {
    versi: '1.31.3',
    tanggal: '2026-09-16',
    poin: [
      'Perbaikan Manajemen Hak Akses: kalau seorang user sudah login dan tab browsernya dibiarkan terbuka lama, perubahan hak akses yang diterapkan Admin setelah itu tidak langsung berlaku untuk sesi yang sudah terbuka tadi (harus logout/refresh manual dulu) — kelihatannya seperti "hak akses tidak berubah sama sekali". Sekarang aplikasi otomatis mengecek ulang hak akses secara berkala dan setiap kali tab dibuka/aktif lagi, jadi pembatasan akses terbaru langsung berlaku tanpa user itu harus logout',
    ],
  },
  {
    versi: '1.31.2',
    tanggal: '2026-09-16',
    poin: [
      'Perbaikan lanjutan Manajemen Hak Akses: ternyata masih ada 1 celah lagi — kalau ada proses ambil data lain yang kebetulan belum selesai (mis. pas aplikasi baru dibuka), hasilnya bisa "menimpa balik" perubahan hak akses yang baru saja disimpan beberapa detik kemudian, walau sudah tampil benar sesaat setelah klik Terapkan. Sekarang aplikasi selalu memastikan cuma data PALING BARU yang dipakai, proses lama yang telat selesai otomatis diabaikan',
      'Tambah pengaman supaya halaman aplikasi tidak "nyangkut" ke versi lama di browser setelah update di-deploy',
    ],
  },
  {
    versi: '1.31.1',
    tanggal: '2026-09-16',
    poin: [
      'Perbaikan: Manajemen Hak Akses — kadang setelah klik "Terapkan" dan muncul pesan berhasil, centang hak akses yang baru saja diubah malah balik lagi ke posisi lama. Penyebabnya bukan datanya gagal tersimpan, tapi cara aplikasi mengambil ulang data langsung setelah simpan sempat kena data "basi" (belum yang terbaru). Sekarang sudah dipastikan aplikasi selalu ambil data paling baru setiap kali refresh, bukan cuma di halaman Hak Akses tapi di semua halaman',
    ],
  },
  {
    versi: '1.31.0',
    tanggal: '2026-09-15',
    poin: [
      'Pembayaran: tambah filter Pilih Kelas dan Pilih Rombel di atas kolom Cari Siswa, supaya lebih mudah menemukan siswa di sekolah yang rombelnya banyak/nama miripan',
      '"Bayar Sekaligus" sekarang jadi tombol di sebelah "Pilih Tagihan Belum Lunas" (bukan tab terpisah lagi) — begitu siswa ditemukan, klik tombolnya langsung buka form Bayar Sekaligus dalam bentuk pop-up, tidak perlu pindah tab & cari ulang siswa yang sama',
    ],
  },
  {
    versi: '1.30.0',
    tanggal: '2026-09-15',
    poin: [
      'Fitur baru: menu Pembayaran &amp; Invoice sekarang punya tab "🗓️ Bayar Sekaligus" — untuk siswa yang membayar SPP di muka/rapel beberapa bulan langsung, walau tagihan bulan-bulan berikutnya belum diterbitkan admin',
      'Bayar Sekaligus: pilih siswa, centang bulan-bulan yang mau dibayar (atau pakai "Bayar sampai bulan ..." untuk pilih cepat) — bulan yang belum ada tagihannya otomatis diterbitkan KHUSUS untuk siswa itu saja (siswa lain tidak ikut ditagih), lalu langsung dicatat lunas dalam satu kali simpan',
    ],
  },
  {
    versi: '1.29.0',
    tanggal: '2026-09-15',
    poin: [
      'Perbaikan akar masalah: Jadwal Penerbitan SPP sebelumnya mengecek "sudah/belum terbit" per BULAN (bukan per siswa) — begitu 1 siswa saja sudah punya tagihan bulan itu (mis. siswa pindahan, atau baru masuk belakangan), tombol Terbitkan langsung hilang dan siswa lain yang belum ditagih jadi nyangkut di "Perlu Tindak Lanjut". Sekarang dicek per siswa: tombol Terbitkan tetap ada selama masih ada yang belum ditagih, dengan jumlahnya ditampilkan langsung di tombol (misal "Terbitkan 473"), dan hanya siswa yang belum punya tagihan itu yang diproses',
      'Jadwal Penerbitan SPP: tabel sekarang ada kolom No, dan "Jumlah Siswa" dipecah jadi 2 kolom terpisah — "Sudah Terbit" dan "Belum Terbit" — plus status baru "Terbit Sebagian" untuk bulan yang baru sebagian siswanya ditagih',
    ],
  },
  {
    versi: '1.28.1',
    tanggal: '2026-09-15',
    poin: [
      'Riwayat Pembaruan: setiap versi sekarang dikelompokkan/collapsed — isi poin pembaruannya baru muncul kalau baris versinya diklik, tidak langsung tampil semua sekaligus',
    ],
  },
  {
    versi: '1.28.0',
    tanggal: '2026-09-15',
    poin: [
      'Data Siswa / Rombel: tab "Rombel" sekarang jadi Laporan Rombel lengkap — pilih Kelas, pilih Rombel spesifik (mis. 1A), klik Tampilkan untuk melihat daftar siswanya, dengan jumlah siswa, pengaturan jumlah baris per halaman (10/20/50/100/Semua), pencarian, dan export Excel & PDF (judul MI Ikhlasiyah / Laporan Rombel / Kelas-Rombel)',
    ],
  },
  {
    versi: '1.27.0',
    tanggal: '2026-09-15',
    poin: [
      'Riwayat Pembayaran: tambah filter rentang tanggal (bisa lihat transaksi hari per hari), kolom Tanggal dipindah ke setelah kolom No, total nominal ditampilkan di bawah kolom Nominal, dan pengaturan jumlah baris per halaman (10/20/50/100/Semua)',
      'Riwayat Pembayaran: export Excel dan PDF sekarang pakai judul 3 baris (MI Ikhlasiyah / Laporan Pembayaran / Tanggal sesuai filter yang aktif)',
    ],
  },
  {
    versi: '1.26.0',
    tanggal: '2026-09-15',
    poin: [
      'Bersihkan Data Duplikat: tambah tombol "🔗 Konsolidasikan" untuk kelompok Ambigu — menggabungkan jadi 1 tagihan, semua riwayat pembayaran ikut dipindahkan (tidak hilang), dan kelebihan bayar (kalau genuinely terjadi) ditampilkan jujur agar bisa ditindaklanjuti',
    ],
  },
  {
    versi: '1.25.1',
    tanggal: '2026-09-15',
    poin: [
      'Bersihkan Data Duplikat: tambah tombol "Lihat Detail" per kelompok ambigu — menampilkan rincian setiap baris dan pembayarannya, supaya bisa diputuskan manual bukan cuma percaya label',
    ],
  },
  {
    versi: '1.25.0',
    tanggal: '2026-09-15',
    poin: [
      'Perbaikan akar masalah: nomor tagihan ("No") kadang bisa kembar akibat penerbitan cepat berturut-turut di masa lalu, menyebabkan alat Bersihkan Duplikat salah mendeteksi banyak baris sebagai "sudah dibayar" — sekarang ada tombol "Perbaiki Nomor Ganda" untuk membetulkannya, dan nomor tidak akan kembar lagi ke depannya',
    ],
  },
  {
    versi: '1.24.0',
    tanggal: '2026-09-15',
    poin: [
      'Tambah indikator status koneksi di header — 2 titik berdenyut "D" (Data Induk) dan "K" (Keuangan), hijau saat terhubung, merah saat tidak, otomatis kembali hijau ketika koneksi pulih tanpa perlu reload halaman',
    ],
  },
  {
    versi: '1.23.0',
    tanggal: '2026-09-15',
    poin: [
      'Kurangi "sering kondek/diskonek" — pengambilan data sekarang otomatis dicoba ulang kalau gagal sesaat, sebelum benar-benar ditampilkan sebagai error',
    ],
  },
  {
    versi: '1.22.0',
    tanggal: '2026-09-15',
    poin: [
      'Fitur baru (khusus Kepala Sekolah/Admin): halaman "Bersihkan Data Duplikat" — deteksi & hapus otomatis tagihan SPP/Biaya Lain yang kembar, aman karena tidak pernah menyentuh baris yang sudah dibayar',
      'Halaman yang sama juga mendeteksi tagihan Biaya Lain yang kelas siswanya tidak cocok lagi dengan Tarif yang berlaku sekarang',
    ],
  },
  {
    versi: '1.21.2',
    tanggal: '2026-09-15',
    poin: [
      'Perbaikan bug serius: tagihan SPP/Biaya Lain bisa terbit dobel berulang kali kalau tombol "Terbitkan" diklik lagi sebelum data selesai diperbarui — sekarang tombol benar-benar terkunci sampai data terkonfirmasi',
    ],
  },
  {
    versi: '1.21.1',
    tanggal: '2026-09-15',
    poin: [
      'Pindah Rombel Massal: tambah Filter Kelas dan 2 tab (Belum/Sudah Ada Rombel) dengan hitungan jumlah, plus kolom Rombel Saat Ini',
    ],
  },
  {
    versi: '1.21.0',
    tanggal: '2026-09-15',
    poin: [
      'Fitur baru: Pindah Rombel Massal di tab Rombel — pilih beberapa siswa sekaligus, pindahkan ke rombel (ruang kelas) tujuan tanpa edit satu-satu',
      'Data Siswa sekarang menyimpan Rombel spesifik (mis. "1A"), bukan cuma tingkat kelas — Filter Rombel di SPP dan Wali Kelas di tab Rombel jadi lebih akurat',
    ],
  },
  {
    versi: '1.20.0',
    tanggal: '2026-09-15',
    poin: [
      'Kategori Beasiswa sekarang diisi nilai potongan Rupiah langsung (mis. Rp 40.000), bukan lagi persentase',
      'Perbaikan bug: potongan beasiswa yang sudah ada sejak tagihan terbit tidak lagi terhitung dua kali saat ditampilkan/dibayar',
    ],
  },
  {
    versi: '1.19.0',
    tanggal: '2026-09-15',
    poin: [
      'Manajemen Hak Akses: ditemukan 1 halaman dengan tab bersarang (Tahun Ajaran di dalam Profil Sekolah) — sekarang bisa diatur sampai 3 tingkat, memastikan seluruh halaman bertab di aplikasi tercakup',
    ],
  },
  {
    versi: '1.18.0',
    tanggal: '2026-09-14',
    poin: [
      'Manajemen Hak Akses: tambah tombol "Terapkan" — centang kotak sekarang instan (tidak menunggu tersimpan satu-satu), baru benar-benar tersimpan setelah tombol diklik. Perubahan yang belum diterapkan disorot kuning',
    ],
  },
  {
    versi: '1.17.1',
    tanggal: '2026-09-14',
    poin: [
      'Perbaikan bug: mengatur beberapa hak akses berturut-turut untuk role yang baru dibuat kadang gagal tersimpan — sekarang setiap perubahan disimpan lebih andal satu per satu',
    ],
  },
  {
    versi: '1.17.0',
    tanggal: '2026-09-14',
    poin: [
      'Manajemen User: bisa tambah role/jabatan baru sendiri lewat tombol "+ Tambah Role"',
      'Hak akses sekarang tersimpan permanen (sebelumnya hilang tiap refresh halaman)',
      'Manajemen Hak Akses sekarang bisa diatur sampai level tab di dalam tiap menu (klik ▸ untuk buka), bukan cuma per-menu',
      'Riwayat Pembaruan (Changelog) sekarang juga bisa diatur hak aksesnya',
    ],
  },
  {
    versi: '1.16.0',
    tanggal: '2026-09-14',
    poin: [
      'Kecepatan koneksi ke Google Sheets ditingkatkan — dari 14 permintaan terpisah setiap buka aplikasi, sekarang digabung jadi cuma 2 permintaan besar. Diharapkan lebih jarang muncul "tidak terhubung" dan loading awal lebih cepat',
    ],
  },
  {
    versi: '1.15.1',
    tanggal: '2026-09-13',
    poin: [
      'Perbaikan bug penting: SPP yang sudah pernah dibayar SEBELUM beasiswa dipasang tidak lagi ikut disunat jadi Rp 0 — potongan sekarang benar-benar hanya berlaku maju (ke tagihan yang belum dibayar)',
      'Keterangan potongan di Kartu SPP disingkat jadi "Beasiswa" saja, tidak lagi kalimat panjang',
    ],
  },
  {
    versi: '1.15.0',
    tanggal: '2026-09-13',
    poin: [
      'Beasiswa sekarang bisa dipasang SETELAH tagihan terlanjur terbit — potongan otomatis dihitung saat lihat kartu/bayar, tidak perlu hapus & terbitkan ulang tagihan lama',
      'Form Catat Pembayaran menampilkan kotak potongan beasiswa (harga asli dicoret, badge kategori, nominal setelah potongan) dan otomatis mengisi nominal yang harus dibayar',
      'Kartu SPP, Rekap Tunggakan, Neraca, Buku Besar, dan Portofolio Siswa semua ikut menghitung potongan ini secara konsisten',
    ],
  },
  {
    versi: '1.14.0',
    tanggal: '2026-09-13',
    poin: [
      'Kartu SPP dan Kartu Biaya Lain sekarang punya kolom "Keterangan" — menampilkan info potongan beasiswa (kategori & persentase) untuk bulan yang mendapat potongan',
    ],
  },
  {
    versi: '1.13.0',
    tanggal: '2026-09-13',
    poin: [
      'Perbaikan bug: tagihan dengan potongan beasiswa 100% (Rp 0) sekarang otomatis berstatus "Lunas" saat diterbitkan, tidak lagi nyangkut selamanya di "Belum Lunas"',
      'Field "Tanggal Mulai" pada Siswa Penerima Beasiswa sekarang benar-benar berfungsi — potongan hanya berlaku untuk tagihan mulai bulan itu ke depan, bukan lagi cuma catatan',
    ],
  },
  {
    versi: '1.12.1',
    tanggal: '2026-09-11',
    poin: [
      'Tampilan "Lihat" Sarpras dirombak total: kartu lengkap dengan kop surat sekolah, foto+detail berdampingan, total nilai estimasi, dan tombol share ke gambar',
    ],
  },
  {
    versi: '1.12.0',
    tanggal: '2026-09-11',
    poin: [
      'Pencarian SPP Peserta Didik sekarang menampilkan keterangan jumlah siswa hasil filter (mis. "Terdapat 3 Siswa Kelas 1 Rombel Arofah dari 488 Siswa")',
      'Badge "Penerima Beasiswa" muncul di bawah nama siswa (SPP Peserta Didik & Portofolio Siswa) — tidak ikut tampil di Kartu SPP/Biaya Lain',
      'Tampilan "Lihat Detail" Sarpras dirombak total — ada kop surat sekolah, foto & kondisi di kiri, detail lengkap + total nilai di kanan, bisa dibagikan sebagai gambar',
    ],
  },
  {
    versi: '1.11.0',
    tanggal: '2026-09-11',
    poin: [
      'Kartu SPP sekarang menampilkan detail siswa (Nama, Kelas, Rombel, Tahun Pelajaran) dan selalu tampil 12 bulan penuh',
      'Kwitansi ditambah logo & alamat sekolah, tanda tangan "PETUGAS SPP", dan tombol share ke WhatsApp',
      'Pencarian SPP Peserta Didik bisa difilter per Kelas dan Rombel',
      'Fitur baru: <b>Beasiswa</b> — atur kategori (Anak Yatim, Dhuafa, dll) dan siswa penerimanya; tagihan SPP/Biaya Lain otomatis dipotong sesuai kategori saat diterbitkan',
      'Sarpras sekarang punya field Harga Estimasi per unit — total nilai seluruh Sarpras tampil di kartu ringkasan dan laporan',
    ],
  },
  {
    versi: '1.10.2',
    tanggal: '2026-09-08',
    poin: [
      'Perbaikan bug: logo dan nama sekolah yang diupload lewat Pengaturan > Profil Sekolah sekarang benar tampil di layar Login dan Sidebar (sebelumnya masih logo bawaan yang tidak tersambung)',
    ],
  },
  {
    versi: '1.10.1',
    tanggal: '2026-09-08',
    poin: [
      'Perbaikan bug penting: Buku Besar Piutang Siswa sempat bisa tampil minus kalau ada siswa yang bayar lebih awal dari jatuh tempo — sekarang saldo tidak akan pernah minus',
      'Baris "Saldo Awal" di Buku Besar diganti namanya jadi "Saldo Bulan Sebelumnya" agar lebih jelas',
    ],
  },
  {
    versi: '1.10.0',
    tanggal: '2026-09-08',
    poin: [
      'Buku Besar: total Debit/Kredit/Saldo sekarang jadi bagian tabel (rapi sejajar kolom), tidak lagi kartu terpisah',
      'Buku Besar: bisa filter per bulan, dan Saldo Awal tiap bulan otomatis diambil dari saldo akhir bulan sebelumnya',
      'Buku Besar: tombol Export Excel untuk akun yang dipilih maupun semua akun sekaligus',
      'Semua nilai Rupiah di Laporan Keuangan sekarang rapi rata kanan',
      'Tombol Export Excel ditambahkan ke Cashflow, Rekapitulasi, Laba Rugi, dan Neraca',
    ],
  },
  {
    versi: '1.9.0',
    tanggal: '2026-09-08',
    poin: [
      'Perbaikan bug: Kode Akun di Buku Besar tidak lagi berubah jadi tanggal aneh saat disimpan',
      'Cashflow sekarang menampilkan tiap akun kas/bank secara terpisah (garis warna berbeda per akun), bukan digabung jadi satu angka Kas',
      'Rekapitulasi dan Laba Rugi bisa dipilih per bulan tertentu, tidak cuma tabel ringkas 12 bulan',
      'Laba Rugi per bulan sekarang tampil rapi vertikal (Pendapatan → Pengeluaran → Laba/Rugi Bersih), gaya sama seperti Neraca',
      'Neraca sekarang menampilkan semua akun kas/bank yang ada, termasuk akun baru yang belum ada transaksinya',
    ],
  },
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
