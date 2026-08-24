export const PEMBAYARAN_HEADERS = ['No', 'RefType', 'RefNo', 'NISN', 'Nama Siswa', 'Jenis', 'Nominal', 'Tanggal Bayar', 'Metode'];

export const METODE_BAYAR_OPTIONS = ['Tunai', 'Transfer Bank', 'QRIS', 'Virtual Account'];

export function normalizeSheetPembayaran(row, idx) {
  return {
    id: 'PMB-' + (row['No'] ?? idx),
    no: row['No'],
    refType: String(row['RefType'] ?? '').trim(), // 'SPP' | 'LAIN'
    refNo: row['RefNo'],
    nisn: String(row['NISN'] ?? '').trim(),
    namaSiswa: String(row['Nama Siswa'] ?? '').trim(),
    jenis: String(row['Jenis'] ?? '').trim(),
    nominal: Number(row['Nominal']) || 0,
    tanggalBayar: String(row['Tanggal Bayar'] ?? '').trim(),
    metode: String(row['Metode'] ?? '').trim(),
  };
}
