// Urutan & nama key HARUS sama persis dengan header di Google Sheets / Code.gs.
export const SISWA_HEADERS = [
  'No', 'Kabupaten/Kota', 'NPSN', 'NSM', 'Jenjang', 'Kelas/Tingkat',
  'Nama Lengkap', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
  'Jenis Kelamin', 'Alamat', 'Nama Ayah Kandung', 'Nama Ibu Kandung', 'Pekerjaan',
];

// Field utk form (semua header KECUALI "No", yang otomatis dari Sheet)
export const SISWA_FIELDS = [
  { key: 'Kabupaten/Kota', label: 'Kabupaten / Kota', type: 'text' },
  { key: 'NPSN', label: 'NPSN', type: 'text' },
  { key: 'NSM', label: 'NSM', type: 'text' },
  { key: 'Jenjang', label: 'Jenjang', type: 'select', options: ['MI', 'RA', 'MTs', 'MA'] },
  { key: 'Kelas/Tingkat', label: 'Kelas / Tingkat', type: 'select', options: ['1', '2', '3', '4', '5', '6'] },
  { key: 'Nama Lengkap', label: 'Nama Lengkap', type: 'text', required: true },
  { key: 'NISN', label: 'NISN', type: 'text' },
  { key: 'NIK', label: 'NIK', type: 'text' },
  { key: 'Tempat Lahir', label: 'Tempat Lahir', type: 'text' },
  { key: 'Tanggal Lahir', label: 'Tanggal Lahir', type: 'date' },
  { key: 'Jenis Kelamin', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
  { key: 'Alamat', label: 'Alamat', type: 'textarea' },
  { key: 'Nama Ayah Kandung', label: 'Nama Ayah Kandung', type: 'text' },
  { key: 'Nama Ibu Kandung', label: 'Nama Ibu Kandung', type: 'text' },
  { key: 'Pekerjaan', label: 'Pekerjaan (Orang Tua)', type: 'text' },
];

export function emptySiswaRow() {
  const row = {};
  SISWA_FIELDS.forEach(f => { row[f.key] = ''; });
  return row;
}

// Ubah baris mentah dari Google Sheets (header bhs Indonesia apa adanya)
// jadi objek dgn field konsisten yg dipakai di seluruh aplikasi (Dashboard, SPP Peserta Didik, dst).
export function normalizeSheetSiswa(row, idx) {
  return {
    id: 'SISWA-' + (row['No'] ?? idx),
    no: row['No'],
    nama: String(row['Nama Lengkap'] ?? '').trim(),
    nisn: String(row['NISN'] ?? '').trim(),
    nik: String(row['NIK'] ?? '').trim(),
    kelasTingkat: String(row['Kelas/Tingkat'] ?? '').trim(),
    jenisKelamin: String(row['Jenis Kelamin'] ?? '').trim(),
    tempatLahir: String(row['Tempat Lahir'] ?? '').trim(),
    tanggalLahir: String(row['Tanggal Lahir'] ?? '').trim(),
    alamat: String(row['Alamat'] ?? '').trim(),
    namaAyah: String(row['Nama Ayah Kandung'] ?? '').trim(),
    namaIbu: String(row['Nama Ibu Kandung'] ?? '').trim(),
    pekerjaan: String(row['Pekerjaan'] ?? '').trim(),
    npsn: String(row['NPSN'] ?? '').trim(),
    nsm: String(row['NSM'] ?? '').trim(),
    jenjang: String(row['Jenjang'] ?? '').trim(),
    kabupatenKota: String(row['Kabupaten/Kota'] ?? '').trim(),
  };
}

// Cocokkan header file Excel yg diupload user (bisa beda kapitalisasi/spasi)
// dengan header baku di atas.
export function normalizeHeaderKey(rawHeader) {
  const target = String(rawHeader || '').trim().toLowerCase().replace(/\s+/g, '');
  const found = SISWA_HEADERS.find(h => h.toLowerCase().replace(/\s+/g, '') === target);
  return found || null;
}
