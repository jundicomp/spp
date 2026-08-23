const CONFIG_KEY = 'sheets_config_v1';

export function getSheetsConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || { url: '', secret: '' };
  } catch {
    return { url: '', secret: '' };
  }
}

export function saveSheetsConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function isConfigured() {
  const { url } = getSheetsConfig();
  return !!url;
}

/**
 * sheetName: 'siswa' | 'users'
 */
export async function fetchFromSheet(sheetName = 'siswa') {
  const { url } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(url + sep + 'sheet=' + sheetName, { method: 'GET' });
  if (!res.ok) throw new Error('Gagal menghubungi Apps Script (HTTP ' + res.status + ').');
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal mengambil data dari Sheet.');
  return json.data;
}

export async function addToSheet(sheetName, row) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  // Content-Type: text/plain sengaja dipakai (bukan application/json) supaya browser
  // tidak mengirim preflight OPTIONS -- Google Apps Script Web App tidak menanganinya dgn baik.
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'add', secret, sheet: sheetName, row }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal menyimpan data.');
  return json;
}

export async function bulkAddToSheet(sheetName, rows) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'bulkAdd', secret, sheet: sheetName, rows }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal mengunggah data.');
  return json;
}

export async function updateInSheet(sheetName, row) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'update', secret, sheet: sheetName, row }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal memperbarui data.');
  return json;
}

export async function deleteFromSheet(sheetName, no) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', secret, sheet: sheetName, no }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal menghapus data.');
  return json;
}

// ---- Alias khusus siswa (dipakai halaman Data Siswa, biar kode lama tetap jalan) ----
export const fetchSiswaFromSheet = () => fetchFromSheet('siswa');
export const addSiswaToSheet = (row) => addToSheet('siswa', row);
export const bulkAddSiswaToSheet = (rows) => bulkAddToSheet('siswa', rows);
export const updateSiswaInSheet = (row) => updateInSheet('siswa', row);
export const deleteSiswaFromSheet = (no) => deleteFromSheet('siswa', no);

// ---- Alias khusus users ----
export const fetchUsersFromSheet = () => fetchFromSheet('users');
export const addUserToSheet = (row) => addToSheet('users', row);

// ---- Alias khusus kelas ----
export const fetchKelasFromSheet = () => fetchFromSheet('kelas');
export const addKelasToSheet = (row) => addToSheet('kelas', row);
export const updateKelasInSheet = (row) => updateInSheet('kelas', row);
export const deleteKelasFromSheet = (no) => deleteFromSheet('kelas', no);

// ---- Alias khusus guru ----
export const fetchGuruFromSheet = () => fetchFromSheet('guru');
export const addGuruToSheet = (row) => addToSheet('guru', row);
export const updateGuruInSheet = (row) => updateInSheet('guru', row);
export const deleteGuruFromSheet = (no) => deleteFromSheet('guru', no);

// ---- Alias khusus log aktivitas ----
export const fetchLogFromSheet = () => fetchFromSheet('log');
export async function addLogEntry({ username, namaUser, aksi, modul, detail }) {
  const row = {
    Waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    Username: username,
    'Nama User': namaUser,
    Aksi: aksi,
    Modul: modul,
    Detail: detail || '',
  };
  try {
    await addToSheet('log', row);
  } catch (err) {
    // Log gagal tersimpan JANGAN sampai membatalkan aksi utama (edit/hapus) yg sudah terjadi.
    console.warn('Gagal mencatat log aktivitas:', err.message);
  }
}
