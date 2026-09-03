export const ASET_HEADERS = ['No', 'Nama Aset', 'Kategori', 'Lokasi', 'Kondisi', 'Jumlah', 'Tahun Perolehan', 'Keterangan'];

export const KATEGORI_ASET_OPTIONS = [
  'Furniture', 'Elektronik', 'Alat Peraga / Edukasi', 'Alat Olahraga',
  'Buku & Perpustakaan', 'Kendaraan', 'Bangunan & Ruang', 'Lain-lain',
];
export const KONDISI_ASET_OPTIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat'];

export const ASET_FIELDS = [
  { key: 'Nama Aset', label: 'Nama Aset', type: 'text', required: true, placeholder: 'mis. Meja Belajar Kelas 3' },
  { key: 'Kategori', label: 'Kategori', type: 'select', options: KATEGORI_ASET_OPTIONS, required: true },
  { key: 'Lokasi', label: 'Lokasi / Ruang', type: 'text', placeholder: 'mis. Ruang Kelas 3A' },
  { key: 'Kondisi', label: 'Kondisi', type: 'select', options: KONDISI_ASET_OPTIONS, required: true },
  { key: 'Jumlah', label: 'Jumlah', type: 'number', required: true },
  { key: 'Tahun Perolehan', label: 'Tahun Perolehan', type: 'number', placeholder: 'mis. 2024' },
  { key: 'Keterangan', label: 'Keterangan', type: 'text' },
];

export function emptyAsetRow() {
  return { 'Nama Aset': '', Kategori: '', Lokasi: '', Kondisi: 'Baik', Jumlah: '', 'Tahun Perolehan': '', Keterangan: '' };
}

export function normalizeSheetAset(row, idx) {
  return {
    id: 'ASET-' + (row['No'] ?? idx),
    no: row['No'],
    nama: String(row['Nama Aset'] ?? '').trim(),
    kategori: String(row['Kategori'] ?? '').trim(),
    lokasi: String(row['Lokasi'] ?? '').trim(),
    kondisi: String(row['Kondisi'] ?? '').trim(),
    jumlah: Number(row['Jumlah']) || 0,
    tahunPerolehan: row['Tahun Perolehan'],
    keterangan: String(row['Keterangan'] ?? '').trim(),
  };
}
