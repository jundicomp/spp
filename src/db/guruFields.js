export const GURU_HEADERS = ['No', 'Nama Lengkap', 'NIP/NUPTK', 'Jabatan', 'Mata Pelajaran', 'No HP', 'Email', 'Status'];

export const JABATAN_OPTIONS = ['Kepala Sekolah', 'Wali Kelas', 'Guru Mata Pelajaran', 'Bendahara / TU', 'Staf TU', 'Pustakawan', 'Penjaga Sekolah'];
export const STATUS_GURU_OPTIONS = ['Aktif', 'Tidak Aktif'];

export const GURU_FIELDS = [
  { key: 'Nama Lengkap', label: 'Nama Lengkap', type: 'text', required: true },
  { key: 'NIP/NUPTK', label: 'NIP / NUPTK', type: 'text' },
  { key: 'Jabatan', label: 'Jabatan', type: 'select', options: JABATAN_OPTIONS, required: true },
  { key: 'Mata Pelajaran', label: 'Mata Pelajaran / Bidang', type: 'text', placeholder: 'mis. Matematika (kosongkan kalau tidak relevan)' },
  { key: 'No HP', label: 'No. HP', type: 'text' },
  { key: 'Email', label: 'Email', type: 'email' },
  { key: 'Status', label: 'Status', type: 'select', options: STATUS_GURU_OPTIONS, required: true },
];

export function emptyGuruRow() {
  const row = {};
  GURU_FIELDS.forEach(f => { row[f.key] = f.key === 'Status' ? 'Aktif' : ''; });
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
  };
}
