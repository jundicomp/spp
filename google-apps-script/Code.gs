/**
 * ===================================================================
 * KODE INI DITEMPEL DI GOOGLE APPS SCRIPT — BUKAN DI PROJECT REACT
 * ===================================================================
 * Cara pasang (lihat juga README.md di folder ini):
 * 1. Buka Google Sheet yang mau dipakai sebagai database.
 * 2. Menu Extensions -> Apps Script.
 * 3. Hapus isi default Code.gs, tempel SELURUH isi file ini.
 * 4. Ganti nilai SECRET di bawah dengan kata sandi rahasia pilihan Anda.
 * 5. Klik Deploy -> New deployment -> pilih tipe "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Salin URL Web App yang muncul (diakhiri /exec) -> tempel di
 *    aplikasi React, bagian Pengaturan Koneksi (khusus Admin).
 *
 * PENTING kalau update dari versi sebelumnya: setelah tempel ulang kode ini,
 * WAJIB redeploy (Deploy -> Manage deployments -> ikon pensil -> Version:
 * New version -> Deploy) supaya action baru (update/delete/addLog) aktif.
 *
 * Script ini melayani TUJUH "tabel" sekaligus dalam satu Spreadsheet:
 *   - sheet=siswa       -> tab "Data Siswa"     (data induk siswa)
 *   - sheet=kelas       -> tab "Data Kelas"     (kelas & rombel)
 *   - sheet=guru        -> tab "Data Guru"      (guru & staf)
 *   - sheet=profil      -> tab "Profil Sekolah" (1 baris saja -- identitas sekolah)
 *   - sheet=tahunAjaran -> tab "Tahun Ajaran"   (daftar tahun ajaran, 1 yg aktif)
 *   - sheet=users       -> tab "Users"          (akun login aplikasi)
 *   - sheet=log         -> tab "LogAktivitas"   (riwayat edit/hapus data)
 * ===================================================================
 */

// GANTI dengan kata sandi rahasia Anda sendiri (bebas, jangan dibagikan ke publik).
const SECRET = 'GANTI_DENGAN_KATA_SANDI_RAHASIA_ANDA';

const SHEETS = {
  siswa: {
    name: 'Data Siswa',
    // "Status" & "Jenis Pendaftaran" ditaruh di AKHIR (bukan disisip di tengah) --
    // baris lama yg belum punya nilai di 2 kolom ini otomatis dianggap
    // Status="Aktif" & Jenis Pendaftaran="Siswa Baru" oleh React (lihat normalizeSheetSiswa).
    // "Rombel" jg ditaruh di AKHIR (kompatibel mundur) -- ruang kelas SPESIFIK (mis.
    // "1A") di dalam tingkat (Kelas/Tingkat). Siswa lama yg blm py Rombel dianggap
    // "belum ditentukan" oleh React, TIDAK dianggap Rombel kosong = error.
    headers: [
      'No', 'Kabupaten/Kota', 'NPSN', 'NSM', 'Jenjang', 'Kelas/Tingkat',
      'Nama Lengkap', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
      'Jenis Kelamin', 'Alamat', 'Nama Ayah Kandung', 'Nama Ibu Kandung', 'Pekerjaan',
      'Status', 'Jenis Pendaftaran', 'Rombel',
    ],
  },
  kelas: {
    name: 'Data Kelas',
    headers: ['No', 'Nama Kelas', 'Tingkat', 'Wali Kelas', 'Ruang', 'Kapasitas'],
  },
  guru: {
    name: 'Data Guru',
    // Kolom baru (Kategori dst) ditaruh di AKHIR -- kompatibel mundur dgn data lama.
    headers: [
      'No', 'Nama Lengkap', 'NIP/NUPTK', 'Jabatan', 'Mata Pelajaran', 'No HP', 'Email', 'Status',
      'Kategori', 'Jenis Kelamin', 'Pangkat/Golongan', 'Tempat Lahir', 'Tanggal Lahir',
      'Pendidikan Terakhir', 'Sertifikasi', 'Jumlah Jam Mengajar', 'TMT Mengajar', 'Tugas Tambahan',
      'Status Kepegawaian',
    ],
  },
  aset: {
    name: 'Data Aset',
    // Kolom baru ditaruh di AKHIR (kompatibel mundur) -- "Kondisi"+"Jumlah" lama
    // TETAP dipertahankan di Sheets (data lama tidak hilang), tapi form/tampilan
    // React sekarang pakai "Baik"/"Rusak Ringan"/"Rusak Berat" terpisah sbg gantinya.
    headers: ['No', 'Nama Aset', 'Kategori', 'Lokasi', 'Kondisi', 'Jumlah', 'Tahun Perolehan', 'Keterangan', 'Kode', 'Baik', 'Rusak Ringan', 'Rusak Berat', 'Gambar', 'Harga Estimasi'],
  },
  peminjaman: {
    name: 'Peminjaman Aset',
    headers: ['No', 'Nama Aset', 'Peminjam', 'Jenis Peminjam', 'Jumlah', 'Tanggal Pinjam', 'Rencana Kembali', 'Tanggal Dikembalikan', 'Status'],
  },
  pemeliharaan: {
    name: 'Pemeliharaan Aset',
    headers: ['No', 'Nama Aset', 'Tanggal', 'Jenis Pemeliharaan', 'Biaya', 'Keterangan', 'Status'],
  },
  profil: {
    name: 'Profil Sekolah',
    headers: ['No', 'Nama Sekolah', 'NPSN', 'Alamat', 'Kepala Sekolah', 'Telepon', 'Email', 'Logo'],
  },
  tahunAjaran: {
    name: 'Tahun Ajaran',
    headers: ['No', 'Label', 'Mulai', 'Selesai', 'Aktif'],
  },
  users: {
    name: 'Users',
    headers: ['No', 'Nama', 'Role', 'Username', 'Password', 'Email'],
  },
  roles: {
    name: 'Roles',
    headers: ['No', 'Nama Role'],
  },
  hakAkses: {
    name: 'Hak Akses',
    // 1 baris = 1 ROLE. Kolom "PermissionsJson" berisi SELURUH izin role itu sbg JSON,
    // mis. {"tagihan":true,"tagihan.penerbitan-spp":true,"tagihan.tarif":false,...} --
    // kunci bisa ID halaman ATAU "halaman.tab" utk detail sampai level tab. Disimpan
    // sbg 1 blob JSON per role (bukan 1 baris per centang) supaya update selalu simpel:
    // baca baris role itu, gabung perubahan, tulis ulang JSON-nya -- tanpa perlu cari
    // baris mana yg harus di-update satu-satu tiap kali 1 centang berubah.
    headers: ['No', 'Role', 'PermissionsJson'],
  },
  log: {
    name: 'LogAktivitas',
    headers: ['No', 'Waktu', 'Username', 'Nama User', 'Aksi', 'Modul', 'Detail'],
  },
};

function doGet(e) {
  // PENTING (perbaikan keamanan): sebelumnya doGet TIDAK mengecek SECRET sama sekali,
  // artinya siapa pun yang tahu URL ini bisa membaca SEMUA data (termasuk password
  // di sheet Users) tanpa perlu tahu kata sandi apa pun. Sekarang wajib dicek dulu.
  if (!e.parameter || e.parameter.secret !== SECRET) {
    return jsonResponse_({ ok: false, error: 'Akses ditolak: kata sandi tidak cocok atau tidak disertakan.' });
  }
  // Mode BATCH: sheet=ALL mengembalikan SEMUA sheet sekaligus dalam 1 respons --
  // dipakai saat load pertama kali (login/buka app) supaya browser TIDAK perlu
  // menembak banyak request terpisah (masing2 request ke Apps Script punya overhead
  // sendiri & kena kuota bersama -- gabung jadi 1 mengurangi beban & kegagalan
  // "tidak terhubung" akibat kuota kepenuhan). Request tunggal (utk refresh setelah
  // tambah/edit/hapus) TETAP jalan spt biasa lewat sheet=<nama>, TIDAK berubah.
  if (e.parameter.sheet === 'ALL') {
    const semua = {};
    Object.keys(SHEETS).forEach(key => { semua[key] = readSheetData_(SHEETS[key]); });
    return jsonResponse_({ ok: true, data: semua });
  }
  const which = SHEETS[e.parameter.sheet] ? e.parameter.sheet : 'siswa';
  const cfg = SHEETS[which];
  return jsonResponse_({ ok: true, data: readSheetData_(cfg) });
}

function readSheetData_(cfg) {
  const sheet = getSheet_(cfg);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter(r => r.some(cell => cell !== '')).map(row => {
    const obj = {};
    cfg.headers.forEach((h, i) => { obj[h] = formatCellValue_(row[i]); });
    return obj;
  });
}

// Kalau sel diketik manual di Sheets dgn format yg dikenali sbg tanggal (mis. "8/22/1978"),
// Google Sheets otomatis menyimpannya sbg tipe TANGGAL ASLI, bukan teks. Saat dibaca lewat
// Apps Script, nilai itu jadi objek Date -- dan begitu di-JSON-kan, JavaScript otomatis
// mengonversinya ke UTC, yg BISA BERGESER 1 HARI dibanding tanggal aslinya (krn WIB = UTC+7).
// Fungsi ini memaksa tanggal diformat manual sbg teks "yyyy-MM-dd" sesuai zona waktu WIB,
// SEBELUM dikirim sbg JSON -- supaya tanggalnya selalu benar & konsisten, apa pun cara
// data itu awalnya dimasukkan ke Sheets (lewat aplikasi ATAU diketik manual).
function formatCellValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return value;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return jsonResponse_({ ok: false, error: 'Kata sandi tidak cocok. Cek pengaturan koneksi.' });
    }
    const which = SHEETS[body.sheet] ? body.sheet : 'siswa';
    const cfg = SHEETS[which];
    const sheet = getSheet_(cfg);

    if (body.action === 'add') {
      appendRow_(sheet, cfg.headers, body.row);
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'bulkAdd') {
      body.rows.forEach(row => appendRow_(sheet, cfg.headers, row));
      return jsonResponse_({ ok: true, count: body.rows.length });
    }
    if (body.action === 'update') {
      const found = updateRow_(sheet, cfg.headers, body.row);
      if (!found) return jsonResponse_({ ok: false, error: 'Baris dengan No=' + body.row['No'] + ' tidak ditemukan.' });
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'delete') {
      const found = deleteRow_(sheet, cfg.headers, body.no);
      if (!found) return jsonResponse_({ ok: false, error: 'Baris dengan No=' + body.no + ' tidak ditemukan.' });
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'setActiveTahunAjaran') {
      setActiveTahunAjaran_(sheet, cfg.headers, body.no);
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'upsertHakAkses') {
      // Server yg MENGGABUNGKAN 1 perubahan (itemId+checked) ke JSON izin role itu --
      // BUKAN menerima JSON lengkap dari client lalu menimpa mentah2. Kenapa: client
      // mengirim berdasarkan state React yg mungkin BELUM sempat ter-update kalau user
      // klik beberapa kotak cepat berturut-turut (event React & network async saling
      // susul) -- kalau server cuma menimpa mentah, perubahan yg "menang" cuma yg
      // requestnya selesai PALING AKHIR, sisanya keteter hilang. Dgn baca-gabung-tulis
      // di SINI (server SELALU baca kondisi sheet paling baru saat request itu jalan),
      // urutan/kecepatan request dari client tidak lagi jadi soal.
      upsertHakAksesRole_(sheet, cfg.headers, body.role, body.itemId, body.checked);
      return jsonResponse_({ ok: true });
    }
    return jsonResponse_({ ok: false, error: 'Aksi "' + body.action + '" tidak dikenal.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function getSheet_(cfg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.name);
  if (!sheet) sheet = ss.insertSheet(cfg.name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cfg.headers);
  } else {
    // Sheet SUDAH ada isinya (dari sebelum ada field baru) -- baris header TIDAK
    // otomatis ditulis ulang seperti sheet baru. Jadi di sini kita SINKRONKAN: kalau
    // ada header yg didefinisikan di kode tapi belum ada di baris 1 Sheet, tambahkan
    // di ujung kanan. Supaya nambah field baru di kode tidak perlu edit Sheet manual.
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const missing = cfg.headers.filter(h => existingHeaders.indexOf(h) === -1);
    if (missing.length > 0) {
      sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function appendRow_(sheet, headers, rowObj) {
  // Sama persis dgn perbaikan di Code-Keuangan.gs: LockService WAJIB supaya penentuan
  // "No" berikutnya tidak tabrakan kalau 2 permintaan berjalan bersamaan (akar masalah
  // baris dobel berNo kembar -- lihat catatan lengkap di Code-Keuangan.gs).
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const nextNo = sheet.getLastRow(); // baris 1 = header, jadi ini otomatis nomor urut berikutnya
    const row = headers.map(h => (h === 'No' ? nextNo : (rowObj[h] !== undefined ? rowObj[h] : '')));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

// Cari baris via kolom "No", timpa semua kolom lain dgn nilai baru. "No" sendiri tidak berubah.
function updateRow_(sheet, headers, rowObj) {
  const noCol = headers.indexOf('No') + 1;
  const targetNo = String(rowObj['No']);
  const lastRow = sheet.getLastRow();
  for (let r = 2; r <= lastRow; r++) {
    const cellVal = String(sheet.getRange(r, noCol).getValue());
    if (cellVal === targetNo) {
      const newRow = headers.map(h => (h === 'No' ? rowObj['No'] : (rowObj[h] !== undefined ? rowObj[h] : '')));
      sheet.getRange(r, 1, 1, headers.length).setValues([newRow]);
      return true;
    }
  }
  return false;
}

// Cari baris utk Role tsb (kolom "Role"), GABUNGKAN 1 perubahan (itemId: checked) ke
// JSON izin yg SUDAH ADA di baris itu (baca dulu, ubah 1 key, tulis balik) -- atau buat
// baris baru kalau Role itu belum py baris sama sekali. Dibaca ULANG dari sheet setiap
// panggilan (bukan dari salinan lama) supaya aman dipanggil berkali-kali cepat
// berturut-turut tanpa kehilangan perubahan yg satu ketiban perubahan yg lain.
function upsertHakAksesRole_(sheet, headers, role, itemId, checked) {
  const roleCol = headers.indexOf('Role') + 1;
  const jsonCol = headers.indexOf('PermissionsJson') + 1;
  const lastRow = sheet.getLastRow();
  for (let r = 2; r <= lastRow; r++) {
    const cellVal = String(sheet.getRange(r, roleCol).getValue());
    if (cellVal === role) {
      let perm = {};
      try { perm = JSON.parse(sheet.getRange(r, jsonCol).getValue() || '{}'); } catch (e) { perm = {}; }
      perm[itemId] = checked;
      sheet.getRange(r, jsonCol).setValue(JSON.stringify(perm));
      return;
    }
  }
  const perm = {};
  perm[itemId] = checked;
  appendRow_(sheet, headers, { Role: role, PermissionsJson: JSON.stringify(perm) });
}

// Cari baris via kolom "No", hapus barisnya. Nomor baris lain SENGAJA tidak digeser ulang
// (No hanya perlu unik, tidak harus berurutan tanpa celah).
function deleteRow_(sheet, headers, targetNoRaw) {
  const noCol = headers.indexOf('No') + 1;
  const targetNo = String(targetNoRaw);
  const lastRow = sheet.getLastRow();
  for (let r = 2; r <= lastRow; r++) {
    const cellVal = String(sheet.getRange(r, noCol).getValue());
    if (cellVal === targetNo) {
      sheet.deleteRow(r);
      return true;
    }
  }
  return false;
}

// Set kolom "Aktif" = TRUE utk baris dgn No=targetNo, dan FALSE utk semua baris lain.
// Dilakukan dalam satu operasi supaya tidak pernah ada 0 atau 2 tahun ajaran aktif sekaligus.
function setActiveTahunAjaran_(sheet, headers, targetNo) {
  const noCol = headers.indexOf('No') + 1;
  const aktifCol = headers.indexOf('Aktif') + 1;
  const lastRow = sheet.getLastRow();
  const target = String(targetNo);
  for (let r = 2; r <= lastRow; r++) {
    const cellVal = String(sheet.getRange(r, noCol).getValue());
    sheet.getRange(r, aktifCol).setValue(cellVal === target ? 'TRUE' : 'FALSE');
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
