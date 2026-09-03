import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import { statusTagihan } from '../../db/tagihanHelpers';
import { formatRupiah, parseTanggalFleksibel } from '../../db/helpers';
import { isConfigured } from '../../services/googleSheets';
import PemutihanModal from './PemutihanModal';

function hariTerlambat(jatuhTempo) {
  const d = parseTanggalFleksibel(jatuhTempo);
  if (!d) return 0;
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function RekapTunggakan() {
  const { allTagihan, tagihanTerbayar, siswa, tagihanSppLoaded, tagihanLainLoaded } = useAppData();
  const [putihkanTarget, setPutihkanTarget] = useState(null);
  const [sortBy, setSortBy] = useState('terlambat'); // 'terlambat' | 'nominal'

  const siswaStatusByNisn = useMemo(() => {
    const map = {};
    siswa.forEach(s => { map[s.nisn] = s.status || 'Aktif'; });
    return map;
  }, [siswa]);

  const tunggakan = useMemo(() => {
    return allTagihan
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        const sisa = t.nominal - terbayar;
        const terlambat = hariTerlambat(t.jatuhTempo);
        return { ...t, terbayar, sisa, terlambat, status: statusTagihan(t.nominal, terbayar) };
      })
      .filter(t => t.sisa > 0 && t.terlambat > 0) // genuinely menunggak: sisa ada DAN sudah lewat jatuh tempo
      .sort((a, b) => sortBy === 'nominal' ? b.sisa - a.sisa : b.terlambat - a.terlambat);
  }, [allTagihan, tagihanTerbayar, sortBy]);

  const ringkasan = useMemo(() => {
    const siswaSet = new Set(tunggakan.map(t => t.nisn));
    const totalNominal = tunggakan.reduce((s, t) => s + t.sisa, 0);
    return { jumlahSiswa: siswaSet.size, jumlahTagihan: tunggakan.length, totalNominal };
  }, [tunggakan]);

  const dataSiap = tagihanSppLoaded || tagihanLainLoaded;

  return (
    <Page pageId="tunggakan" title="Rekap Tunggakan" path="Keuangan / Rekap Tunggakan">
      {!isConfigured('keuangan') && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets Keuangan.
        </div></div>
      )}

      {dataSiap && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-red">
            <div className="info-value">{ringkasan.jumlahSiswa}</div>
            <div className="info-label">Siswa Menunggak</div>
          </div>
          <div className="info-card c-gold">
            <div className="info-value">{ringkasan.jumlahTagihan}</div>
            <div className="info-label">Tagihan Menunggak</div>
          </div>
          <div className="info-card c-red">
            <div className="info-value" style={{ fontSize: 19 }}>{formatRupiah(ringkasan.totalNominal)}</div>
            <div className="info-label">Total Nominal Tunggakan</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>📋 Daftar Tunggakan</h3><p>Tagihan yang sudah lewat jatuh tempo dan belum lunas — diurutkan dari yang paling lama menunggak.</p></div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            <option value="terlambat">Urutkan: Paling Lama Menunggak</option>
            <option value="nominal">Urutkan: Nominal Terbesar</option>
          </select>
        </div>
        <div className="card-body">
          {!dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data...</p>}
          {dataSiap && tunggakan.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Tidak ada tunggakan saat ini. 🎉</p>
          )}
          {tunggakan.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th>No</th><th>Nama Siswa</th><th>NISN</th><th>Status Siswa</th><th>Jenis</th><th>Sisa</th><th>Jatuh Tempo</th><th>Terlambat</th><th>Aksi</th></tr></thead>
                <tbody>
                  {tunggakan.map((t, idx) => {
                    const statusSiswa = siswaStatusByNisn[t.nisn] || 'Aktif';
                    return (
                      <tr key={t.id}>
                        <td>{idx + 1}</td>
                        <td>{t.namaSiswa}</td>
                        <td>{t.nisn}</td>
                        <td>{statusSiswa !== 'Aktif' ? <span className="badge badge-muted">{statusSiswa}</span> : <span className="badge badge-green">Aktif</span>}</td>
                        <td>{t.label}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>{formatRupiah(t.sisa)}</td>
                        <td>{t.jatuhTempo}</td>
                        <td>{t.terlambat} hari</td>
                        <td>
                          <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setPutihkanTarget(t)}>
                            Putihkan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {putihkanTarget && (
        <PemutihanModal tagihan={putihkanTarget} onClose={() => setPutihkanTarget(null)} />
      )}
    </Page>
  );
}
