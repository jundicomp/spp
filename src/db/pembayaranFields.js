// "Keterangan" ditaruh di AKHIR (kompatibel mundur) -- dipakai khusus utk mencatat
// alasan Pemutihan Piutang. Untuk pembayaran normal, boleh kosong.
// "Akun" ditaruh di AKHIR juga (kompatibel mundur) -- akun kas/bank yg BENAR-BENAR
// menerima uangnya, dipilih manual per transaksi (bukan diasumsikan otomatis "Kas"
// semua) supaya Buku Besar tidak selisih antar akun kas/bank yg berbeda.
export const PEMBAYARAN_HEADERS = ['No', 'RefType', 'RefNo', 'NISN', 'Nama Siswa', 'Jenis', 'Nominal', 'Tanggal Bayar', 'Metode', 'Keterangan', 'Akun'];

export const METODE_BAYAR_OPTIONS = ['Tunai', 'Transfer Bank', 'QRIS', 'Virtual Account'];
export const METODE_PEMUTIHAN = 'Pemutihan Piutang';

// Saran akun default per metode -- cuma SARAN awal, tetap bisa diganti manual.
// Nama harus cocok dgn salah satu Nama Akun (bawaan atau custom) supaya ke-preselect.
export const SARAN_AKUN_PER_METODE = {
  'Tunai': 'Kas',
  'Transfer Bank': 'Kas', // fallback ke Kas kalau belum ada akun Bank custom -- user bisa ganti
  'QRIS': 'Kas',
  'Virtual Account': 'Kas',
};

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
    keterangan: String(row['Keterangan'] ?? '').trim(),
    akun: String(row['Akun'] ?? '').trim(),
  };
}
