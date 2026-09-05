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
    headers: [
      'No', 'Kabupaten/Kota', 'NPSN', 'NSM', 'Jenjang', 'Kelas/Tingkat',
      'Nama Lengkap', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
      'Jenis Kelamin', 'Alamat', 'Nama Ayah Kandung', 'Nama Ibu Kandung', 'Pekerjaan',
      'Status', 'Jenis Pendaftaran',
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
    headers: ['No', 'Nama Aset', 'Kategori', 'Lokasi', 'Kondisi', 'Jumlah', 'Tahun Perolehan', 'Keterangan'],
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
  const which = SHEETS[e.parameter.sheet] ? e.parameter.sheet : 'siswa';
  const cfg = SHEETS[which];
  const sheet = getSheet_(cfg);
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1).filter(r => r.some(cell => cell !== '')).map(row => {
    const obj = {};
    cfg.headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  return jsonResponse_({ ok: true, data: rows });
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
    return jsonResponse_({ ok: false, error: 'Aksi "' + body.action + '" tidak dikenal.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function getSheet_(cfg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.name);
  if (!sheet) sheet = ss.insertSheet(cfg.name);
  if (sheet.getLastRow() === 0) sheet.appendRow(cfg.headers);
  return sheet;
}

function appendRow_(sheet, headers, rowObj) {
  const nextNo = sheet.getLastRow(); // baris 1 = header, jadi ini otomatis nomor urut berikutnya
  const row = headers.map(h => (h === 'No' ? nextNo : (rowObj[h] !== undefined ? rowObj[h] : '')));
  sheet.appendRow(row);
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
