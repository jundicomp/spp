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
  };
}

export function hitungTerbayar(pembayaran, refType, refNo) {
  return pembayaran
    .filter(p => p.refType === refType && String(p.refNo) === String(refNo))
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
