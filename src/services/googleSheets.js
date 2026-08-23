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

// ---- Alias khusus siswa (dipakai halaman Data Siswa, biar kode lama tetap jalan) ----
export const fetchSiswaFromSheet = () => fetchFromSheet('siswa');
export const addSiswaToSheet = (row) => addToSheet('siswa', row);
export const bulkAddSiswaToSheet = (rows) => bulkAddToSheet('siswa', rows);

// ---- Alias khusus users ----
export const fetchUsersFromSheet = () => fetchFromSheet('users');
export const addUserToSheet = (row) => addToSheet('users', row);
