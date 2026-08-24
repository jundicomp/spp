// "Kelas/Tingkat" SENGAJA ditaruh di AKHIR (bukan disisip di tengah) supaya kalau Anda
// sudah punya data Tarif lama di Sheets, cukup tambah 1 kolom baru di paling kanan --
// tidak perlu menggeser kolom yang sudah ada.
export const TARIF_HEADERS = ['No', 'Tahun Ajaran', 'Jenis', 'Tipe', 'Nominal', 'Wajib', 'Kelas/Tingkat'];

export const TIPE_TARIF_OPTIONS = ['Bulanan (SPP)', 'Sekali Masuk', 'Per Tahun', 'Opsional'];

// 'Semua Kelas' = berlaku sama utk semua tingkat (perilaku lama/default).
// Pilih tingkat spesifik (1-6) kalau nominalnya beda per angkatan/kelas.
export const KELAS_TINGKAT_TARIF_OPTIONS = ['Semua Kelas', '1', '2', '3', '4', '5', '6'];

export function buildTarifFields(tahunAjaranOptions) {
  return [
    { key: 'Tahun Ajaran', label: 'Tahun Ajaran', type: 'select', options: tahunAjaranOptions, required: true },
    { key: 'Jenis', label: 'Jenis Biaya', type: 'text', required: true, placeholder: 'mis. SPP Bulanan, Uang Pangkal, Seragam' },
    { key: 'Tipe', label: 'Tipe', type: 'select', options: TIPE_TARIF_OPTIONS, required: true },
    { key: 'Kelas/Tingkat', label: 'Berlaku untuk Kelas/Tingkat', type: 'select', options: KELAS_TINGKAT_TARIF_OPTIONS, required: true },
    { key: 'Nominal', label: 'Nominal (Rp)', type: 'number', required: true },
    { key: 'Wajib', label: 'Wajib?', type: 'select', options: ['Ya', 'Tidak'], required: true },
  ];
}

export function emptyTarifRow() {
  return { 'Tahun Ajaran': '', 'Jenis': '', 'Tipe': '', 'Kelas/Tingkat': 'Semua Kelas', 'Nominal': '', 'Wajib': 'Ya' };
}

export function normalizeSheetTarif(row, idx) {
  return {
    id: 'TRF-' + (row['No'] ?? idx),
    no: row['No'],
    tahunAjaran: String(row['Tahun Ajaran'] ?? '').trim(),
    jenis: String(row['Jenis'] ?? '').trim(),
    tipe: String(row['Tipe'] ?? '').trim(),
    nominal: Number(row['Nominal']) || 0,
    wajib: String(row['Wajib'] ?? '').trim(),
    // Baris lama (sebelum kolom ini ada) otomatis dianggap 'Semua Kelas' -- perilaku lama tetap jalan persis sama.
    kelasTingkat: String(row['Kelas/Tingkat'] ?? '').trim() || 'Semua Kelas',
  };
}

// Cari tarif SPP yang berlaku utk siswa kelas tertentu -- prioritas tarif SPESIFIK
// kelas itu, baru fallback ke tarif 'Semua Kelas' kalau tidak ada yg spesifik.
export function cariTarifSppUntukKelas(tarifList, tahunAjaran, kelasTingkat) {
  const spesifik = tarifList.find(t =>
    t.tahunAjaran === tahunAjaran && t.tipe === 'Bulanan (SPP)' && t.kelasTingkat === String(kelasTingkat)
  );
  if (spesifik) return spesifik;
  return tarifList.find(t =>
    t.tahunAjaran === tahunAjaran && t.tipe === 'Bulanan (SPP)' && t.kelasTingkat === 'Semua Kelas'
  ) || null;
}
