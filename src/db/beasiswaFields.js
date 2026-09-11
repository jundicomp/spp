export const BEASISWA_KATEGORI_HEADERS = ['No', 'Nama Kategori', 'Keterangan', 'Potongan SPP (%)', 'Potongan Biaya Lain (%)'];

export const BEASISWA_KATEGORI_FIELDS = [
  { key: 'Nama Kategori', label: 'Nama Kategori', type: 'text', required: true, placeholder: 'mis. Anak Yatim, Dhuafa, Anak Guru, Kebutuhan Khusus' },
  { key: 'Keterangan', label: 'Keterangan Manfaat', type: 'text', required: true, placeholder: 'mis. Gratis SPP penuh, atau Potongan 50% biaya lainnya' },
  { key: 'Potongan SPP (%)', label: 'Potongan SPP (%)', type: 'number', placeholder: '0-100, mis. 100 = gratis penuh' },
  { key: 'Potongan Biaya Lain (%)', label: 'Potongan Biaya Lain (%)', type: 'number', placeholder: '0-100' },
];

export function emptyBeasiswaKategoriRow() {
  return { 'Nama Kategori': '', Keterangan: '', 'Potongan SPP (%)': '', 'Potongan Biaya Lain (%)': '' };
}

export function normalizeSheetBeasiswaKategori(row, idx) {
  return {
    id: 'BSK-' + (row['No'] ?? idx),
    no: row['No'],
    nama: String(row['Nama Kategori'] ?? '').trim(),
    keterangan: String(row['Keterangan'] ?? '').trim(),
    potonganSpp: Number(row['Potongan SPP (%)']) || 0,
    potonganBiayaLain: Number(row['Potongan Biaya Lain (%)']) || 0,
  };
}

export const BEASISWA_SISWA_HEADERS = ['No', 'NISN', 'Nama Siswa', 'Kategori Beasiswa', 'Tanggal Mulai', 'Keterangan'];

export function emptyBeasiswaSiswaRow() {
  return { NISN: '', 'Nama Siswa': '', 'Kategori Beasiswa': '', 'Tanggal Mulai': '', Keterangan: '' };
}

export function normalizeSheetBeasiswaSiswa(row, idx) {
  return {
    id: 'BSS-' + (row['No'] ?? idx),
    no: row['No'],
    nisn: String(row['NISN'] ?? '').trim(),
    namaSiswa: String(row['Nama Siswa'] ?? '').trim(),
    kategoriBeasiswa: String(row['Kategori Beasiswa'] ?? '').trim(),
    tanggalMulai: String(row['Tanggal Mulai'] ?? '').trim(),
    keterangan: String(row['Keterangan'] ?? '').trim(),
  };
}
