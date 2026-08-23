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
 * Script ini melayani DUA "tabel" sekaligus dalam satu Spreadsheet:
 *   - sheet=siswa  -> tab "Data Siswa"  (data induk siswa)
 *   - sheet=users  -> tab "Users"       (akun login aplikasi)
 * ===================================================================
 */

// GANTI dengan kata sandi rahasia Anda sendiri (bebas, jangan dibagikan ke publik).
const SECRET = 'GANTI_DENGAN_KATA_SANDI_RAHASIA_ANDA';

const SHEETS = {
  siswa: {
    name: 'Data Siswa',
    headers: [
      'No', 'Kabupaten/Kota', 'NPSN', 'NSM', 'Jenjang', 'Kelas/Tingkat',
      'Nama Lengkap', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
      'Jenis Kelamin', 'Alamat', 'Nama Ayah Kandung', 'Nama Ibu Kandung', 'Pekerjaan',
    ],
  },
  users: {
    name: 'Users',
    headers: ['No', 'Nama', 'Role', 'Username', 'Password', 'Email'],
  },
};

function doGet(e) {
  const which = (e.parameter && e.parameter.sheet === 'users') ? 'users' : 'siswa';
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
    const which = (body.sheet === 'users') ? 'users' : 'siswa';
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

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
