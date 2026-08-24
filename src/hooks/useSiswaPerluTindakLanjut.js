import { useMemo } from 'react';
import { useAppData } from '../context/AppContext';

/**
 * Deteksi siswa AKTIF yang perlu tindak lanjut -- baik siswa baru, pindahan,
 * atau siapa pun yang datanya belum lengkap dibanding kondisi kelas/tagihan saat ini:
 *   1. Belum ada Kelas/Tingkat (rombel) diisi
 *   2. Kurang tagihan SPP utk bulan-bulan yg SUDAH diterbitkan di tahun ajaran aktif
 *      (mis. siswa baru masuk bulan September, padahal Juli-Agustus sudah terbit
 *      utk siswa lain -- dia butuh ditagih susulan)
 *
 * Sengaja berbasis DATA (bukan label "pindahan" semata), supaya menangkap SEMUA
 * kasus siswa aktif yg belum lengkap -- apa pun sebabnya.
 */
export default function useSiswaPerluTindakLanjut() {
  const { siswa, tagihanSpp, tahunAjaranAktif } = useAppData();

  return useMemo(() => {
    if (!tahunAjaranAktif) return [];
    const aktif = siswa.filter(s => (s.status || 'Aktif') === 'Aktif');
    const tagihanTA = tagihanSpp.filter(t => t.tahunAjaran === tahunAjaranAktif.label);

    // Semua kombinasi bulan+tahun yg SUDAH pernah diterbitkan (minimal 1 siswa punya tagihan itu)
    const bulanTerbitSet = new Set(tagihanTA.map(t => `${t.bulan}-${t.tahunKalender}`));

    return aktif.map(s => {
      const masalah = [];
      if (!s.kelasTingkat) masalah.push('Belum ada Kelas/Tingkat (rombel)');

      const tagihanSiswa = tagihanTA.filter(t => t.nisn === s.nisn);
      const bulanSiswaSet = new Set(tagihanSiswa.map(t => `${t.bulan}-${t.tahunKalender}`));
      const bulanKurang = Array.from(bulanTerbitSet).filter(b => !bulanSiswaSet.has(b));
      if (bulanKurang.length > 0) masalah.push(`${bulanKurang.length} bulan SPP belum ditagih (sudah terbit utk siswa lain)`);

      return { siswa: s, masalah };
    }).filter(x => x.masalah.length > 0);
  }, [siswa, tagihanSpp, tahunAjaranAktif]);
}
