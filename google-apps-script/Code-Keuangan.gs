/**
 * ===================================================================
 * KODE INI DITEMPEL DI GOOGLE APPS SCRIPT PADA SPREADSHEET KEUANGAN
 * (FILE SHEETS TERPISAH dari Data Induk/Data Siswa) — BUKAN di project React.
 * ===================================================================
 * Kenapa dipisah dari file Data Induk?
 * Data keuangan (tagihan, pembayaran) terus bertambah tiap bulan -- beda
 * karakter dari data induk (siswa/kelas/guru) yang relatif tetap jumlahnya.
 * Memisah file supaya file Data Induk tetap ringan & cepat dalam jangka
 * panjang.
 *
 * Cara pasang:
 * 1. Buat Google Sheet BARU (terpisah dari Sheet Data Induk Anda).
 * 2. Menu Extensions -> Apps Script.
 * 3. Hapus isi default Code.gs, tempel SELURUH isi file ini.
 * 4. Ganti nilai SECRET di bawah dengan kata sandi rahasia (BOLEH beda dari
 *    SECRET file Data Induk -- lebih aman kalau beda).
 * 5. Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).
 * 6. Salin URL -> tempel di aplikasi React, Pengaturan Koneksi (khusus Admin),
 *    bagian "Koneksi Data Keuangan" (BUKAN bagian "Koneksi Data Induk").
 *
 * Script ini melayani:
 *   - sheet=tarif       -> tab "Tarif"        (SPP bulanan & biaya lain per tahun ajaran)
 *   - sheet=tagihanSpp  -> tab "Tagihan SPP"   (tagihan SPP bulanan per siswa)
 *   - sheet=tagihanLain -> tab "Tagihan Lain"  (uang pangkal, seragam, dst)
 *   - sheet=pembayaran  -> tab "Pembayaran"    (riwayat pembayaran, 1 baris = 1 kwitansi)
 * ===================================================================
 */

// GANTI dengan kata sandi rahasia Anda sendiri.
const SECRET = 'GANTI_DENGAN_KATA_SANDI_RAHASIA_KEUANGAN';

const SHEETS = {
  tarif: {
    name: 'Tarif',
    // "Kelas/Tingkat" ditaruh di AKHIR supaya kompatibel mundur dgn sheet lama --
    // kalau baris lama tidak punya nilai di kolom ini, otomatis kosong (React
    // menganggapnya "Semua Kelas", perilaku lama tetap jalan sama persis).
    headers: ['No', 'Tahun Ajaran', 'Jenis', 'Tipe', 'Nominal', 'Wajib', 'Kelas/Tingkat'],
  },
  tagihanSpp: {
    name: 'Tagihan SPP',
    headers: ['No', 'NISN', 'Nama Siswa', 'Tahun Ajaran', 'Bulan', 'Tahun Kalender', 'Nominal', 'Jatuh Tempo'],
  },
  tagihanLain: {
    name: 'Tagihan Lain',
    headers: ['No', 'NISN', 'Nama Siswa', 'Tahun Ajaran', 'Nama', 'Wajib', 'Nominal', 'Jatuh Tempo'],
  },
  pembayaran: {
    name: 'Pembayaran',
    // "Keterangan" ditaruh di AKHIR (kompatibel mundur) -- dipakai khusus utk alasan Pemutihan Piutang.
    headers: ['No', 'RefType', 'RefNo', 'NISN', 'Nama Siswa', 'Jenis', 'Nominal', 'Tanggal Bayar', 'Metode', 'Keterangan'],
  },
  pengeluaran: {
    name: 'Pengeluaran',
    headers: ['No', 'Tanggal', 'Kategori', 'Keterangan', 'Nominal'],
  },
};

function doGet(e) {
  // Perbaikan keamanan: doGet sekarang wajib cek SECRET juga (sebelumnya cuma doPost).
  if (!e.parameter || e.parameter.secret !== SECRET) {
    return jsonResponse_({ ok: false, error: 'Akses ditolak: kata sandi tidak cocok atau tidak disertakan.' });
  }
  const which = SHEETS[e.parameter.sheet] ? e.parameter.sheet : 'tarif';
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
    const which = SHEETS[body.sheet] ? body.sheet : 'tarif';
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
  const nextNo = sheet.getLastRow();
  const row = headers.map(h => (h === 'No' ? nextNo : (rowObj[h] !== undefined ? rowObj[h] : '')));
  sheet.appendRow(row);
}

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

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
