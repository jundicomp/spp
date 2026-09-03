import { useMemo } from 'react';
import Page from '../../components/layout/Page';
import useSheetResource from '../../hooks/useSheetResource';
import { normalizeSheetPeminjaman } from '../../db/peminjamanFields';
import { normalizeSheetPemeliharaan } from '../../db/pemeliharaanFields';
import { fetchPeminjamanFromSheet, fetchPemeliharaanFromSheet } from '../../services/googleSheets';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';
import { useAppData } from '../../context/AppContext';

const KONDISI_LIST = ['Baik', 'Rusak Ringan', 'Rusak Berat'];

export default function LaporanRekapAset() {
  const { aset, asetLoaded } = useAppData();
  const peminjamanRes = useSheetResource(fetchPeminjamanFromSheet, normalizeSheetPeminjaman);
  const pemeliharaanRes = useSheetResource(fetchPemeliharaanFromSheet, normalizeSheetPemeliharaan);

  const perKategori = useMemo(() => {
    const map = {};
    aset.forEach(a => {
      if (!map[a.kategori]) map[a.kategori] = { Baik: 0, 'Rusak Ringan': 0, 'Rusak Berat': 0, total: 0 };
      map[a.kategori][a.kondisi] = (map[a.kategori][a.kondisi] || 0) + a.jumlah;
      map[a.kategori].total += a.jumlah;
    });
    return map;
  }, [aset]);

  const totalKondisi = useMemo(() => {
    const t = { Baik: 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };
    aset.forEach(a => { t[a.kondisi] = (t[a.kondisi] || 0) + a.jumlah; });
    return t;
  }, [aset]);

  const sedangDipinjam = useMemo(() => {
    const now = new Date();
    return peminjamanRes.data
      .filter(p => p.status === 'Dipinjam')
      .map(p => {
        const rencana = parseTanggalFleksibel(p.rencanaKembali);
        const terlambat = rencana && rencana < now;
        return { ...p, terlambat };
      });
  }, [peminjamanRes.data]);

  const ringkasanPemeliharaan = useMemo(() => {
    const totalBiaya = pemeliharaanRes.data.reduce((s, p) => s + p.biaya, 0);
    const selesai = pemeliharaanRes.data.filter(p => p.status === 'Selesai').length;
    const prosesnya = pemeliharaanRes.data.filter(p => p.status === 'Dalam Proses').length;
    return { totalBiaya, selesai, prosesnya, total: pemeliharaanRes.data.length };
  }, [pemeliharaanRes.data]);

  const dataSiap = asetLoaded && peminjamanRes.loaded && pemeliharaanRes.loaded;

  return (
    <Page pageId="laporan-rekap-aset" title="Laporan Rekap Aset" path="Sarpras / Laporan Rekap Aset">
      {!dataSiap && <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</div></div>}

      {dataSiap && (
        <>
          <div className="info-grid" style={{ marginBottom: 20 }}>
            <div className="info-card c-green"><div className="info-value">{totalKondisi['Baik']}</div><div className="info-label">Unit Kondisi Baik</div></div>
            <div className="info-card c-gold"><div className="info-value">{totalKondisi['Rusak Ringan']}</div><div className="info-label">Unit Rusak Ringan</div></div>
            <div className="info-card c-red"><div className="info-value">{totalKondisi['Rusak Berat']}</div><div className="info-label">Unit Rusak Berat</div></div>
          </div>

          <div className="card">
            <div className="card-head"><div><h3>Kondisi Aset per Kategori</h3><p>Jumlah unit dikelompokkan per kategori dan kondisi.</p></div></div>
            <div className="card-body">
              {Object.keys(perKategori).length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada data aset.</p>}
              {Object.keys(perKategori).length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Kategori</th>{KONDISI_LIST.map(k => <th key={k}>{k}</th>)}<th>Total</th></tr></thead>
                    <tbody>
                      {Object.entries(perKategori).map(([kategori, v]) => (
                        <tr key={kategori}>
                          <td>{kategori}</td>
                          {KONDISI_LIST.map(k => <td key={k}>{v[k] || 0}</td>)}
                          <td style={{ fontWeight: 700 }}>{v.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h3>Aset Sedang Dipinjam</h3><p>{sedangDipinjam.length} aset belum dikembalikan.</p></div></div>
            <div className="card-body">
              {sedangDipinjam.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Tidak ada aset yang sedang dipinjam.</p>}
              {sedangDipinjam.length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Nama Aset</th><th>Peminjam</th><th>Jumlah</th><th>Rencana Kembali</th><th>Status</th></tr></thead>
                    <tbody>
                      {sedangDipinjam.map(p => (
                        <tr key={p.id}>
                          <td>{p.namaAset}</td>
                          <td>{p.peminjam} ({p.jenisPeminjam})</td>
                          <td>{p.jumlah}</td>
                          <td>{p.rencanaKembali}</td>
                          <td>{p.terlambat ? <span className="badge badge-red">Terlambat</span> : <span className="badge badge-gold">Dipinjam</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h3>Ringkasan Pemeliharaan</h3><p>Riwayat servis dan perbaikan aset.</p></div></div>
            <div className="card-body">
              <div className="info-grid">
                <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{ringkasanPemeliharaan.total}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Riwayat</div>
                </div>
                <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{ringkasanPemeliharaan.selesai}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Selesai</div>
                </div>
                <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{ringkasanPemeliharaan.prosesnya}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Dalam Proses</div>
                </div>
                <div style={{ padding: '10px 20px', background: 'var(--green-soft)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(ringkasanPemeliharaan.totalBiaya)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Biaya Pemeliharaan</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
