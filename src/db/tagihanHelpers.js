export function normalizeSheetTagihanSpp(row, idx) {
  return {
    id: 'TSPP-' + (row['No'] ?? idx),
    no: row['No'],
    refType: 'SPP',
    nisn: String(row['NISN'] ?? '').trim(),
    namaSiswa: String(row['Nama Siswa'] ?? '').trim(),
    tahunAjaran: String(row['Tahun Ajaran'] ?? '').trim(),
    label: `SPP ${row['Bulan']} ${row['Tahun Kalender']}`,
    bulan: row['Bulan'],
    tahunKalender: row['Tahun Kalender'],
    nominal: Number(row['Nominal']) || 0,
    jatuhTempo: row['Jatuh Tempo'],
    keterangan: String(row['Keterangan'] ?? '').trim(),
  };
}

export function normalizeSheetTagihanLain(row, idx) {
  return {
    id: 'TLAIN-' + (row['No'] ?? idx),
    no: row['No'],
    refType: 'LAIN',
    nisn: String(row['NISN'] ?? '').trim(),
    namaSiswa: String(row['Nama Siswa'] ?? '').trim(),
    tahunAjaran: String(row['Tahun Ajaran'] ?? '').trim(),
    label: String(row['Nama'] ?? '').trim(),
    wajib: String(row['Wajib'] ?? '').trim(),
    nominal: Number(row['Nominal']) || 0,
    jatuhTempo: row['Jatuh Tempo'],
    keterangan: String(row['Keterangan'] ?? '').trim(),
    // Disalin dari Tarif sekali saat tagihan ini diterbitkan (lihat PenerbitanLainTab.jsx)
    // -- 0 = tidak ada nilai cicilan standar, form Catat Pembayaran default ke sisa penuh.
    cicilan: Number(row['Cicilan']) || 0,
  };
}

// PENJAGA TAMBAHAN (nisn opsional): pencocokan pembayaran ke tagihan SEHARUSNYA
// cukup lewat RefType+RefNo (nomor baris tagihan) -- TAPI kalau nomor "No" di sheet
// Tagihan pernah dobel (mis. dari race-condition penerbitan sebelum LockService
// dipasang), pembayaran milik siswa LAIN yg RefNo-nya kebetulan sama bisa ketiban
// salah ke tagihan siswa ini, bikin kartunya kelihatan "Lunas" padahal tidak pernah
// dibayar. Kalau nisn diisi si pemanggil, baris pembayaran yg NISN-nya KETAHUAN beda
// (bukan kosong -- data lama sebagian belum punya NISN) TIDAK dihitung. Baris dgn
// NISN kosong tetap dihitung spt biasa supaya data lama tidak tiba2 balik jadi
// "Belum Lunas".
export function hitungTerbayar(pembayaran, refType, refNo, nisn) {
  return pembayaran
    .filter(p => p.refType === refType && String(p.refNo) === String(refNo))
    .filter(p => !nisn || !p.nisn || p.nisn === nisn)
    .reduce((s, p) => s + p.nominal, 0);
}

export function statusTagihan(nominal, terbayar) {
  // Tagihan Rp 0 (mis. dari potongan beasiswa 100%) SECARA LOGIS sudah "Lunas" --
  // tidak ada yang perlu dibayar sama sekali. Sebelumnya ini nyangkut selamanya di
  // "Belum Lunas" krn form Pembayaran menolak nominal Rp 0 (bug nyata yg ditemukan).
  if (nominal <= 0) return 'Lunas';
  if (terbayar <= 0) return 'Belum Lunas';
  if (terbayar >= nominal) return 'Lunas';
  return 'Sebagian';
}
