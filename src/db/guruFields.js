// "Kategori" (Guru/Staff) + kolom-kolom baru SENGAJA ditaruh di AKHIR (kompatibel
// mundur) -- data lama yg belum punya nilai di kolom2 ini otomatis dianggap
// Kategori="Guru" (lihat normalizeSheetGuru), supaya tidak perlu migrasi manual.
export const GURU_HEADERS = [
  'No', 'Nama Lengkap', 'NIP/NUPTK', 'Jabatan', 'Mata Pelajaran', 'No HP', 'Email', 'Status',
  'Kategori', 'Jenis Kelamin', 'Pangkat/Golongan', 'Tempat Lahir', 'Tanggal Lahir',
  'Pendidikan Terakhir', 'Sertifikasi', 'Jumlah Jam Mengajar', 'TMT Mengajar', 'Tugas Tambahan',
  'Status Kepegawaian',
];

export const KATEGORI_OPTIONS = ['Guru', 'Staff'];
export const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'];
export const JABATAN_GURU_OPTIONS = ['Kepala Sekolah', 'Guru Kelas', 'Guru Mata Pelajaran', 'Wali Kelas'];
export const JABATAN_STAFF_OPTIONS = ['Bendahara / TU', 'Staf TU', 'Pustakawan', 'Penjaga Sekolah', 'Operator', 'Lainnya'];
export const SERTIFIKASI_OPTIONS = ['Sudah', 'Belum', 'Proses'];
export const STATUS_KEPEGAWAIAN_OPTIONS = ['Tetap', 'Tidak Tetap'];
export const STATUS_GURU_OPTIONS = ['Aktif', 'Tidak Aktif'];

// Field yang sama-sama dipakai Guru maupun Staff.
const FIELDS_UMUM = [
  { key: 'Nama Lengkap', label: 'Nama Lengkap', type: 'text', required: true },
  { key: 'Jenis Kelamin', label: 'Jenis Kelamin (L/P)', type: 'select', options: JENIS_KELAMIN_OPTIONS },
  { key: 'NIP/NUPTK', label: 'NIP / NUPTK', type: 'text' },
  { key: 'Pangkat/Golongan', label: 'Pangkat / Golongan', type: 'text', placeholder: 'mis. Penata Muda / III-a' },
  { key: 'Tempat Lahir', label: 'Tempat Lahir', type: 'text' },
  { key: 'Tanggal Lahir', label: 'Tanggal Lahir', type: 'date' },
  { key: 'Pendidikan Terakhir', label: 'Pendidikan Terakhir', type: 'text', placeholder: 'mis. S.1 Univ Sriwijaya 2013' },
  { key: 'Tugas Tambahan', label: 'Tugas Tambahan', type: 'text', placeholder: 'mis. Kepala Madrasah, Kaur Kesiswaan' },
  { key: 'Status Kepegawaian', label: 'Status Kepegawaian', type: 'select', options: STATUS_KEPEGAWAIAN_OPTIONS },
  { key: 'No HP', label: 'No. HP', type: 'text' },
  { key: 'Email', label: 'Email', type: 'email' },
  { key: 'Status', label: 'Status Aktif', type: 'select', options: STATUS_GURU_OPTIONS, required: true },
];

// Field TAMBAHAN khusus Guru (tidak relevan utk Staff -- mapel, jam mengajar, dst).
const FIELDS_EXTRA_GURU = [
  { key: 'Mata Pelajaran', label: 'Mata Pelajaran Diampu', type: 'text', placeholder: 'mis. Matematika' },
  { key: 'Sertifikasi', label: 'Sertifikasi', type: 'select', options: SERTIFIKASI_OPTIONS },
  { key: 'Jumlah Jam Mengajar', label: 'Jumlah Jam Mengajar', type: 'number' },
  { key: 'TMT Mengajar', label: 'TMT Mengajar', type: 'date' },
];

// Bangun daftar field lengkap utk 1 tab. "Jabatan" disisipkan setelah Nama, dgn
// pilihan yg beda tergantung kategori.
export function buildGuruFields(kategori) {
  const jabatanField = { key: 'Jabatan', label: 'Jabatan', type: 'select', options: kategori === 'Guru' ? JABATAN_GURU_OPTIONS : JABATAN_STAFF_OPTIONS, required: true };
  const umum = [FIELDS_UMUM[0], jabatanField, ...FIELDS_UMUM.slice(1)];
  return kategori === 'Guru' ? [...umum, ...FIELDS_EXTRA_GURU] : umum;
}

export function emptyGuruRow(kategori) {
  const fields = buildGuruFields(kategori);
  const row = {};
  fields.forEach(f => {
    if (f.key === 'Status') row[f.key] = 'Aktif';
    else if (f.key === 'Status Kepegawaian') row[f.key] = 'Tetap';
    else row[f.key] = '';
  });
  return row;
}

export function normalizeSheetGuru(row, idx) {
  return {
    id: 'GURU-' + (row['No'] ?? idx),
    no: row['No'],
    nama: String(row['Nama Lengkap'] ?? '').trim(),
    nip: String(row['NIP/NUPTK'] ?? '').trim(),
    jabatan: String(row['Jabatan'] ?? '').trim(),
    mapel: String(row['Mata Pelajaran'] ?? '').trim(),
    hp: String(row['No HP'] ?? '').trim(),
    email: String(row['Email'] ?? '').trim(),
    status: String(row['Status'] ?? '').trim(),
    // Data lama (sebelum kolom Kategori ada) otomatis dianggap "Guru" -- semua
    // data guru yg sudah ada sebelumnya memang guru, bukan staff.
    kategori: String(row['Kategori'] ?? '').trim() || 'Guru',
    jenisKelamin: String(row['Jenis Kelamin'] ?? '').trim(),
    pangkatGolongan: String(row['Pangkat/Golongan'] ?? '').trim(),
    tempatLahir: String(row['Tempat Lahir'] ?? '').trim(),
    tanggalLahir: String(row['Tanggal Lahir'] ?? '').trim(),
    pendidikanTerakhir: String(row['Pendidikan Terakhir'] ?? '').trim(),
    sertifikasi: String(row['Sertifikasi'] ?? '').trim(),
    jumlahJamMengajar: row['Jumlah Jam Mengajar'],
    tmtMengajar: String(row['TMT Mengajar'] ?? '').trim(),
    tugasTambahan: String(row['Tugas Tambahan'] ?? '').trim(),
    statusKepegawaian: String(row['Status Kepegawaian'] ?? '').trim(),
  };
}
