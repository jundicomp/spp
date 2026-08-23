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

export async function fetchSiswaFromSheet() {
  const { url } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error('Gagal menghubungi Apps Script (HTTP ' + res.status + ').');
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal mengambil data dari Sheet.');
  return json.data;
}

export async function addSiswaToSheet(row) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  // Content-Type: text/plain sengaja dipakai (bukan application/json) supaya browser
  // tidak mengirim preflight OPTIONS -- Google Apps Script Web App tidak menanganinya dgn baik.
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'add', secret, row }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal menyimpan data.');
  return json;
}

export async function bulkAddSiswaToSheet(rows) {
  const { url, secret } = getSheetsConfig();
  if (!url) throw new Error('URL Apps Script belum diatur. Buka Pengaturan Koneksi dulu.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'bulkAdd', secret, rows }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal mengunggah data.');
  return json;
}
