import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { BULAN_ID, formatRupiah, normalisasiTanggalUntukInput, parseTanggalFleksibel, todayWIB } from '../../db/helpers';

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Mundur 1 hari kalender dari "yyyy-MM-dd" -- sengaja pakai Date.UTC + getUTC* (bukan
// new Date(y,m,d) lokal + toISOString) supaya HANYA aritmetika tanggal murni, sama
// sekali tidak tersentuh konversi zona waktu (lihat catatan di todayWIB()/isoDate()
// soal risiko "mundur 1 hari" kalau dicampur zona waktu).
function mundur1Hari(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function formatTanggalPanjang(yyyyMmDd) {
  const d = parseTanggalFleksibel(yyyyMmDd);
  if (!d) return '-';
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// Widget "Pembayaran Hari Ini" -- ditaruh di tab Pembayaran (bukan Dashboard SPP)
// krn dipakai kasir/petugas utk langsung mengecek transaksi yg baru saja diinput
// (cocokkan jumlah setoran, ketahuan kalau ada yg dobel/salah) sebelum tutup kas.
// CATATAN: Sheet Pembayaran tidak menyimpan JAM transaksi, cuma tanggal -- jadi
// diurutkan dari yg PALING BARU DIINPUT (nomor baris terbesar), bukan jam sungguhan.
export default function PembayaranHariIni() {
  const { pembayaran, pembayaranLoaded } = useAppData();
  const [hari, setHari] = useState('hari-ini');

  const tanggalTarget = useMemo(() => (hari === 'hari-ini' ? todayWIB() : mundur1Hari(todayWIB())), [hari]);

  const baris = useMemo(() => {
    return pembayaranAsli(pembayaran)
      .filter(p => normalisasiTanggalUntukInput(p.tanggalBayar) === tanggalTarget)
      .slice()
      .sort((a, b) => Number(b.no) - Number(a.no));
  }, [pembayaran, tanggalTarget]);

  const total = baris.reduce((s, p) => s + p.nominal, 0);

  return (
    <div className="card" style={{ marginTop: 4 }}>
      <div className="card-head">
        <div>
          <h3>📋 Pembayaran {hari === 'hari-ini' ? 'Hari Ini' : 'Kemarin'}</h3>
          <p>{formatTanggalPanjang(tanggalTarget)}</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 6 }}>
          <button type="button" className={`btn btn-sm ${hari === 'kemarin' ? 'btn-primary' : ''}`} onClick={() => setHari('kemarin')}>Kemarin</button>
          <button type="button" className={`btn btn-sm ${hari === 'hari-ini' ? 'btn-primary' : ''}`} onClick={() => setHari('hari-ini')}>Hari Ini</button>
        </div>
      </div>
      <div className="card-body table-scroll">
        {!pembayaranLoaded && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat...</p>}
        {pembayaranLoaded && baris.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada transaksi pembayaran pada tanggal ini.</p>
        )}
        {baris.length > 0 && (
          <table>
            <thead><tr><th>Siswa</th><th>Jenis</th><th>Metode</th><th style={{ textAlign: 'right' }}>Nominal</th></tr></thead>
            <tbody>
              {baris.map(p => (
                <tr key={p.id}>
                  <td>{p.namaSiswa} <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>· {p.nisn || '-'}</span></td>
                  <td>{p.jenis}</td>
                  <td><span className={`badge ${p.metode === 'Tunai' ? 'badge-gold' : 'badge-blue'}`}>{p.metode}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(p.nominal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, background: '#F6F8F5' }}>
                <td colSpan={3} style={{ textAlign: 'right' }}>Total ({baris.length} transaksi)</td>
                <td style={{ textAlign: 'right' }}>{formatRupiah(total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
