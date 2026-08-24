const CONFIG_KEY = 'sheets_config_v2';
const OLD_CONFIG_KEY = 'sheets_config_v1'; // versi lama (1 koneksi saja) -- dimigrasi otomatis
const DEFAULT_CONFIG = {
  master: { url: '', secret: '' },   // Data Siswa, Kelas, Guru, Profil, Tahun Ajaran, Users, Log
  keuangan: { url: '', secret: '' }, // Tarif, Tagihan, Pembayaran, dst -- file Sheets TERPISAH (data transaksi, tumbuh terus)
};

function readAllConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
    if (saved) return { master: saved.master || { url: '', secret: '' }, keuangan: saved.keuangan || { url: '', secret: '' } };
  } catch { /* lanjut ke migrasi di bawah */ }

  // Migrasi otomatis dari versi lama (1 koneksi -> dipakai sbg "master")
  try {
    const old = JSON.parse(localStorage.getItem(OLD_CONFIG_KEY));
    if (old && old.url) {
      const migrated = { master: { url: old.url, secret: old.secret || '' }, keuangan: { url: '', secret: '' } };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch { /* abaikan, pakai default */ }

  return { ...DEFAULT_CONFIG };
}

export function getSheetsConfig(target = 'master') {
  return readAllConfig()[target] || { url: '', secret: '' };
}

export function saveSheetsConfig(cfg, target = 'master') {
  const all = readAllConfig();
  all[target] = cfg;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(all));
}

export function isConfigured(target = 'master') {
  return !!getSheetsConfig(target).url;
}

const TARGET_LABEL = { master: 'Data Induk', keuangan: 'Keuangan' };

export async function fetchFromSheet(sheetName = 'siswa', target = 'master') {
  const { url } = getSheetsConfig(target);
  if (!url) throw new Error(`URL Apps Script (${TARGET_LABEL[target]}) belum diatur. Buka Pengaturan Koneksi dulu.`);
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(url + sep + 'sheet=' + sheetName, { method: 'GET' });
  if (!res.ok) throw new Error('Gagal menghubungi Apps Script (HTTP ' + res.status + ').');
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Gagal mengambil data dari Sheet.');
  return json.data;
}

async function postToSheet(body, target = 'master') {
  const { url, secret } = getSheetsConfig(target);
  if (!url) throw new Error(`URL Apps Script (${TARGET_LABEL[target]}) belum diatur. Buka Pengaturan Koneksi dulu.`);
  // Content-Type: text/plain sengaja dipakai (bukan application/json) supaya browser
  // tidak mengirim preflight OPTIONS -- Google Apps Script Web App tidak menanganinya dgn baik.
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret }),
  });
  return res.json();
}

export async function addToSheet(sheetName, row, target = 'master') {
  const json = await postToSheet({ action: 'add', sheet: sheetName, row }, target);
  if (!json.ok) throw new Error(json.error || 'Gagal menyimpan data.');
  return json;
}

export async function bulkAddToSheet(sheetName, rows, target = 'master') {
  const json = await postToSheet({ action: 'bulkAdd', sheet: sheetName, rows }, target);
  if (!json.ok) throw new Error(json.error || 'Gagal mengunggah data.');
  return json;
}

export async function updateInSheet(sheetName, row, target = 'master') {
  const json = await postToSheet({ action: 'update', sheet: sheetName, row }, target);
  if (!json.ok) throw new Error(json.error || 'Gagal memperbarui data.');
  return json;
}

export async function deleteFromSheet(sheetName, no, target = 'master') {
  const json = await postToSheet({ action: 'delete', sheet: sheetName, no }, target);
  if (!json.ok) throw new Error(json.error || 'Gagal menghapus data.');
  return json;
}

// =====================================================================
// ---- Alias khusus per modul (semua di file Sheets MASTER) ----
// =====================================================================
export const fetchSiswaFromSheet = () => fetchFromSheet('siswa');
export const addSiswaToSheet = (row) => addToSheet('siswa', row);
export const bulkAddSiswaToSheet = (rows) => bulkAddToSheet('siswa', rows);
export const updateSiswaInSheet = (row) => updateInSheet('siswa', row);
export const deleteSiswaFromSheet = (no) => deleteFromSheet('siswa', no);

export const fetchUsersFromSheet = () => fetchFromSheet('users');
export const addUserToSheet = (row) => addToSheet('users', row);

export const fetchKelasFromSheet = () => fetchFromSheet('kelas');
export const addKelasToSheet = (row) => addToSheet('kelas', row);
export const updateKelasInSheet = (row) => updateInSheet('kelas', row);
export const deleteKelasFromSheet = (no) => deleteFromSheet('kelas', no);

export const fetchGuruFromSheet = () => fetchFromSheet('guru');
export const addGuruToSheet = (row) => addToSheet('guru', row);
export const updateGuruInSheet = (row) => updateInSheet('guru', row);
export const deleteGuruFromSheet = (no) => deleteFromSheet('guru', no);

// ---- Profil Sekolah (SELALU 1 baris, No=1) ----
export const fetchProfilFromSheet = () => fetchFromSheet('profil');
export async function saveProfilToSheet(row, exists) {
  const payload = { ...row, No: 1 };
  return exists ? updateInSheet('profil', payload) : addToSheet('profil', payload);
}

// ---- Tahun Ajaran ----
export const fetchTahunAjaranFromSheet = () => fetchFromSheet('tahunAjaran');
export const addTahunAjaranToSheet = (row) => addToSheet('tahunAjaran', row);
export const updateTahunAjaranInSheet = (row) => updateInSheet('tahunAjaran', row);
export const deleteTahunAjaranFromSheet = (no) => deleteFromSheet('tahunAjaran', no);
export async function setActiveTahunAjaranOnSheet(no) {
  const json = await postToSheet({ action: 'setActiveTahunAjaran', sheet: 'tahunAjaran', no }, 'master');
  if (!json.ok) throw new Error(json.error || 'Gagal mengaktifkan tahun ajaran.');
  return json;
}

// ---- Log aktivitas ----
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

// =====================================================================
// ---- Alias khusus KEUANGAN (file Sheets TERPISAH, target='keuangan') ----
// =====================================================================
export const fetchTarifFromSheet = () => fetchFromSheet('tarif', 'keuangan');
export const addTarifToSheet = (row) => addToSheet('tarif', row, 'keuangan');
export const updateTarifInSheet = (row) => updateInSheet('tarif', row, 'keuangan');
export const deleteTarifFromSheet = (no) => deleteFromSheet('tarif', no, 'keuangan');

export const fetchTagihanSppFromSheet = () => fetchFromSheet('tagihanSpp', 'keuangan');
export const bulkAddTagihanSppToSheet = (rows) => bulkAddToSheet('tagihanSpp', rows, 'keuangan');
export const deleteTagihanSppFromSheet = (no) => deleteFromSheet('tagihanSpp', no, 'keuangan');

export const fetchTagihanLainFromSheet = () => fetchFromSheet('tagihanLain', 'keuangan');
export const addTagihanLainToSheet = (row) => addToSheet('tagihanLain', row, 'keuangan');
export const updateTagihanLainInSheet = (row) => updateInSheet('tagihanLain', row, 'keuangan');
export const deleteTagihanLainFromSheet = (no) => deleteFromSheet('tagihanLain', no, 'keuangan');

export const fetchPembayaranFromSheet = () => fetchFromSheet('pembayaran', 'keuangan');
export const addPembayaranToSheet = (row) => addToSheet('pembayaran', row, 'keuangan');
export const deletePembayaranFromSheet = (no) => deleteFromSheet('pembayaran', no, 'keuangan');
