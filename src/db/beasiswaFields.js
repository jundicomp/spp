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

// Cek apakah 1 siswa (by NISN) punya beasiswa yg AKTIF pada suatu titik waktu (cutoffMs) --
// dipakai BERSAMA oleh form Pembayaran, Kartu SPP, dan semua perhitungan piutang/status,
// supaya definisi "aktif" SELALU konsisten di semua tempat. "Aktif" berarti: siswa
// terdaftar di beasiswaSiswa DAN kategorinya masih ada DAN (Tanggal Mulai kosong ATAU
// Tanggal Mulai <= cutoffMs).
export function cekBeasiswaAktif(nisn, beasiswaSiswa, beasiswaKategori, cutoffMs) {
  const b = beasiswaSiswa.find(x => x.nisn === nisn);
  if (!b) return null;
  const kategori = beasiswaKategori.find(k => k.nama === b.kategoriBeasiswa);
  if (!kategori) return null;
  const mulai = b.tanggalMulai ? new Date(b.tanggalMulai) : null;
  if (mulai && !isNaN(mulai.getTime()) && cutoffMs < mulai.getTime()) return null;
  return kategori;
}

// Nominal SEHARUSNYA (efektif) utk 1 tagihan, MEMPERHITUNGKAN beasiswa yg SEKARANG aktif --
// dipakai utk kasus "SPP diterbitkan dulu, beasiswa dipasang belakangan": nominal yg
// TERSIMPAN di Sheet tetap harga penuh (tidak diubah), tapi utk tampilan/status/piutang,
// yg dipakai adalah nominal EFEKTIF ini (sudah dipotong kalau beasiswanya berlaku).
// refType: 'SPP' pakai potonganSpp, 'LAIN' pakai potonganBiayaLain.
export function nominalEfektifTagihan(tagihan, beasiswaSiswa, beasiswaKategori, cutoffMs, terbayar = 0) {
  // PENTING: beasiswa berlaku MAJU saja -- kalau tagihan ini SUDAH PERNAH dibayar
  // (sebagian ATAU lunas) SEBELUM beasiswanya dipasang, jangan disunat jadi nol.
  // Uang yg sudah benar-benar masuk kas tidak boleh "menghilang" gara-gara beasiswa
  // dipasang belakangan -- diskon cuma utk sisa yg BELUM dibayar sama sekali.
  if (terbayar > 0) return { nominalEfektif: tagihan.nominal, potongan: null };
  const kategori = cekBeasiswaAktif(tagihan.nisn, beasiswaSiswa, beasiswaKategori, cutoffMs);
  if (!kategori) return { nominalEfektif: tagihan.nominal, potongan: null };
  const persen = tagihan.refType === 'SPP' ? kategori.potonganSpp : kategori.potonganBiayaLain;
  if (!persen) return { nominalEfektif: tagihan.nominal, potongan: null };
  const nominalEfektif = Math.round(tagihan.nominal * (1 - persen / 100));
  if (nominalEfektif >= tagihan.nominal) return { nominalEfektif: tagihan.nominal, potongan: null };
  return { nominalEfektif, potongan: { kategori, persen } };
}
