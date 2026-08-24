import { useEffect, useMemo, useState } from 'react';
import { BULAN_ID } from '../../db/helpers';
import { bulkAddTagihanSppToSheet, fetchTagihanSppFromSheet, addLogEntry } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function PenerbitanSppTab() {
  const { tahunAjaranAktif, tarif, siswa, refreshTarif, toast } = useAppData();
  const { currentUser } = useAuth();
  const [tagihanSpp, setTagihanSpp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [issuing, setIssuing] = useState(null); // index bulan yg sedang diproses

  const tarifSpp = useMemo(
    () => tarif.find(t => t.tahunAjaran === tahunAjaranAktif?.label && t.tipe === 'Bulanan (SPP)'),
    [tarif, tahunAjaranAktif]
  );

  async function loadTagihan() {
    if (!tahunAjaranAktif) return;
    setLoading(true);
    try {
      const rows = await fetchTagihanSppFromSheet();
      setTagihanSpp(rows.filter(r => r['Tahun Ajaran'] === tahunAjaranAktif.label));
      setLoaded(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTagihan(); }, [tahunAjaranAktif?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  const jadwal = useMemo(() => {
    if (!tahunAjaranAktif) return [];
    const startYear = parseInt(tahunAjaranAktif.label.split('/')[0]);
    const now = new Date();
    const list = [];
    for (let m = 0; m < 12; m++) {
      const monthIdx = (6 + m) % 12; // mulai Juli (index 6)
      const calYear = monthIdx >= 6 ? startYear : startYear + 1;
      const sudahTerbit = tagihanSpp.some(t => t['Bulan'] === BULAN_ID[monthIdx] && Number(t['Tahun Kalender']) === calYear);
      const startOfMonth = new Date(calYear, monthIdx, 1);
      const sudahWaktunya = startOfMonth <= now;
      let status = 'Belum Waktunya';
      if (sudahTerbit) status = 'Sudah Terbit';
      else if (sudahWaktunya) status = 'Terlambat Terbit';
      const jumlahSiswa = tagihanSpp.filter(t => t['Bulan'] === BULAN_ID[monthIdx] && Number(t['Tahun Kalender']) === calYear).length;
      list.push({ monthIdx, calYear, status, jumlahSiswa, bisaDiterbitkan: !sudahTerbit && sudahWaktunya });
    }
    return list;
  }, [tahunAjaranAktif, tagihanSpp]);

  async function terbitkan(item) {
    if (!tarifSpp) { toast('Tarif SPP Bulanan untuk tahun ajaran ini belum diatur. Atur dulu di tab Tarif.', 'error'); return; }
    if (siswa.length === 0) { toast('Belum ada data siswa.', 'error'); return; }
    setIssuing(item.monthIdx);
    try {
      const rows = siswa.map(s => ({
        NISN: s.nisn,
        'Nama Siswa': s.nama,
        'Tahun Ajaran': tahunAjaranAktif.label,
        Bulan: BULAN_ID[item.monthIdx],
        'Tahun Kalender': item.calYear,
        Nominal: tarifSpp.nominal,
        'Jatuh Tempo': `10/${item.monthIdx + 1}/${item.calYear}`,
      }));
      const result = await bulkAddTagihanSppToSheet(rows);
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Terbitkan Tagihan',
        modul: 'Tagihan & Biaya',
        detail: `Menerbitkan tagihan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear} untuk ${result.count} siswa`,
      });
      toast(`Tagihan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear} berhasil diterbitkan untuk ${result.count} siswa.`);
      loadTagihan();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIssuing(null);
    }
  }

  const STATUS_BADGE = {
    'Sudah Terbit': 'badge-green',
    'Terlambat Terbit': 'badge-red',
    'Belum Waktunya': 'badge-muted',
  };

  if (!tahunAjaranAktif) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran Aktif. Atur dulu lewat menu Profil Sekolah &amp; Tahun Ajaran.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>🗓️ Jadwal Penerbitan SPP — {tahunAjaranAktif.label}</h3><p>Setiap bulan diterbitkan lewat aksi eksplisit — bukan otomatis — supaya tidak salah tagih siswa yang berhenti/pindah.</p></div>
        <button className="btn btn-sm" onClick={loadTagihan} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat Ulang'}</button>
      </div>
      <div className="card-body">
        {!tarifSpp && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>
            ⚠️ Tarif SPP Bulanan untuk tahun ajaran {tahunAjaranAktif.label} belum diatur — tambahkan dulu di tab Tarif sebelum menerbitkan.
          </p>
        )}
        {loaded && (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Bulan</th><th>Status</th><th>Jumlah Siswa</th><th>Aksi</th></tr></thead>
              <tbody>
                {jadwal.map(item => (
                  <tr key={item.monthIdx}>
                    <td>{BULAN_ID[item.monthIdx]} {item.calYear}</td>
                    <td><span className={`badge ${STATUS_BADGE[item.status]}`}>{item.status}</span></td>
                    <td>{item.status === 'Sudah Terbit' ? item.jumlahSiswa : '-'}</td>
                    <td>
                      {item.bisaDiterbitkan && (
                        <button className="btn btn-sm btn-primary" onClick={() => terbitkan(item)} disabled={issuing === item.monthIdx}>
                          {issuing === item.monthIdx ? 'Menerbitkan...' : 'Terbitkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
