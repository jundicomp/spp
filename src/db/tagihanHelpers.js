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
  };
}

export function hitungTerbayar(pembayaran, refType, refNo) {
  return pembayaran
    .filter(p => p.refType === refType && String(p.refNo) === String(refNo))
    .reduce((s, p) => s + p.nominal, 0);
}

export function statusTagihan(nominal, terbayar) {
  if (terbayar <= 0) return 'Belum Lunas';
  if (terbayar >= nominal) return 'Lunas';
  return 'Sebagian';
}
