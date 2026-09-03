import { BULAN_ID, parseTanggalFleksibel } from './helpers';
import { METODE_PEMUTIHAN } from './pembayaranFields';

// Pemutihan Piutang BUKAN uang yang benar-benar diterima -- WAJIB dikecualikan
// dari semua perhitungan "pemasukan" supaya laporan keuangan tidak menggelembung palsu.
export function pembayaranAsli(pembayaran) {
  return pembayaran.filter(p => p.metode !== METODE_PEMUTIHAN);
}

// Bangun daftar 12 bulan (Juli-Juni) utk satu tahun ajaran, format {monthIdx, calYear, label}.
export function bulanTahunAjaran(tahunAjaranLabel) {
  const startYear = parseInt(String(tahunAjaranLabel).split('/')[0]);
  const list = [];
  for (let m = 0; m < 12; m++) {
    const monthIdx = (6 + m) % 12; // mulai Juli
    const calYear = monthIdx >= 6 ? startYear : startYear + 1;
    list.push({ monthIdx, calYear, label: `${BULAN_ID[monthIdx]} ${calYear}` });
  }
  return list;
}

// Rekap pemasukan (dari pembayaran ASLI, bukan pemutihan) per bulan dlm 1 tahun ajaran.
export function rekapPemasukanBulanan(tahunAjaranLabel, pembayaran) {
  const bulanList = bulanTahunAjaran(tahunAjaranLabel);
  const asli = pembayaranAsli(pembayaran);
  return bulanList.map(b => {
    const inBulan = asli.filter(p => {
      const d = parseTanggalFleksibel(p.tanggalBayar);
      return d && d.getMonth() === b.monthIdx && d.getFullYear() === b.calYear;
    });
    const spp = inBulan.filter(p => p.refType === 'SPP').reduce((s, p) => s + p.nominal, 0);
    const lain = inBulan.filter(p => p.refType === 'LAIN').reduce((s, p) => s + p.nominal, 0);
    return { ...b, spp, lain, total: spp + lain };
  });
}

// Rekap pengeluaran per bulan dlm 1 tahun ajaran.
export function rekapPengeluaranBulanan(tahunAjaranLabel, pengeluaran) {
  const bulanList = bulanTahunAjaran(tahunAjaranLabel);
  return bulanList.map(b => {
    const total = pengeluaran
      .filter(p => {
        const d = parseTanggalFleksibel(p.tanggal);
        return d && d.getMonth() === b.monthIdx && d.getFullYear() === b.calYear;
      })
      .reduce((s, p) => s + p.nominal, 0);
    return { ...b, total };
  });
}
