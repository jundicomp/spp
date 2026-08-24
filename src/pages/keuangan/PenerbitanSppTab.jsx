import { useMemo, useState } from 'react';
import { BULAN_ID } from '../../db/helpers';
import { cariTarifSppUntukKelas } from '../../db/tarifFields';
import { bulkAddTagihanSppToSheet, addLogEntry } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ProgressModal from '../../components/common/ProgressModal';

const UKURAN_KELOMPOK = 15; // dikirim bertahap per 15 siswa -- supaya progress bar benar-benar mewakili kemajuan asli

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export default function PenerbitanSppTab() {
  const { tahunAjaranAktif, tarif, siswa, tagihanSpp, tagihanSppLoading, tagihanSppLoaded, refreshTagihanSpp, toast } = useAppData();
  const { currentUser } = useAuth();
  const [issuing, setIssuing] = useState(null); // index bulan yg sedang diproses
  const [progress, setProgress] = useState(null); // { current, total, label } | null

  // Semua tingkat kelas yang genuinely ada siswanya saat ini.
  const tingkatDipakai = useMemo(
    () => Array.from(new Set(siswa.map(s => s.kelasTingkat).filter(Boolean))).sort(),
    [siswa]
  );

  // Cek cakupan tarif: tiap tingkat kelas HARUS punya tarif SPP yang berlaku
  // (spesifik utk tingkat itu, atau fallback 'Semua Kelas') sebelum bisa menerbitkan.
  const cakupanTarif = useMemo(() => {
    return tingkatDipakai.map(tk => ({
      tingkat: tk,
      tarif: tahunAjaranAktif ? cariTarifSppUntukKelas(tarif, tahunAjaranAktif.label, tk) : null,
    }));
  }, [tingkatDipakai, tarif, tahunAjaranAktif]);
  const tingkatBelumAdaTarif = cakupanTarif.filter(c => !c.tarif).map(c => c.tingkat);
  const semuaTingkatPunyaTarif = tingkatDipakai.length > 0 && tingkatBelumAdaTarif.length === 0;

  const tagihanTahunIni = useMemo(
    () => tagihanSpp.filter(t => t.tahunAjaran === tahunAjaranAktif?.label),
    [tagihanSpp, tahunAjaranAktif]
  );

  const jadwal = useMemo(() => {
    if (!tahunAjaranAktif) return [];
    const startYear = parseInt(tahunAjaranAktif.label.split('/')[0]);
    const now = new Date();
    const list = [];
    for (let m = 0; m < 12; m++) {
      const monthIdx = (6 + m) % 12; // mulai Juli (index 6)
      const calYear = monthIdx >= 6 ? startYear : startYear + 1;
      const bulanTagihan = tagihanTahunIni.filter(t => t.bulan === BULAN_ID[monthIdx] && Number(t.tahunKalender) === calYear);
      const sudahTerbit = bulanTagihan.length > 0;
      const startOfMonth = new Date(calYear, monthIdx, 1);
      const sudahWaktunya = startOfMonth <= now;
      let status = 'Belum Waktunya';
      if (sudahTerbit) status = 'Sudah Terbit';
      else if (sudahWaktunya) status = 'Terlambat Terbit';
      list.push({ monthIdx, calYear, status, jumlahSiswa: bulanTagihan.length, bisaDiterbitkan: !sudahTerbit && sudahWaktunya && semuaTingkatPunyaTarif });
    }
    return list;
  }, [tahunAjaranAktif, tagihanTahunIni, semuaTingkatPunyaTarif]);

  async function terbitkan(item) {
    if (!semuaTingkatPunyaTarif) { toast('Ada kelas yang belum punya Tarif SPP. Lengkapi dulu di tab Tarif.', 'error'); return; }
    if (siswa.length === 0) { toast('Belum ada data siswa.', 'error'); return; }
    setIssuing(item.monthIdx);
    const total = siswa.length;
    setProgress({ current: 0, total, label: `Menerbitkan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear}` });
    try {
      let totalTerbit = 0;
      for (let i = 0; i < siswa.length; i += UKURAN_KELOMPOK) {
        const kelompok = siswa.slice(i, i + UKURAN_KELOMPOK);
        const rows = kelompok.map(s => {
          const tarifSiswa = cariTarifSppUntukKelas(tarif, tahunAjaranAktif.label, s.kelasTingkat);
          return {
            NISN: s.nisn,
            'Nama Siswa': s.nama,
            'Tahun Ajaran': tahunAjaranAktif.label,
            Bulan: BULAN_ID[item.monthIdx],
            'Tahun Kalender': item.calYear,
            Nominal: tarifSiswa ? tarifSiswa.nominal : 0,
            'Jatuh Tempo': `10/${item.monthIdx + 1}/${item.calYear}`,
          };
        });
        const result = await bulkAddTagihanSppToSheet(rows);
        totalTerbit += result.count;
        setProgress({ current: Math.min(i + kelompok.length, total), total, label: `Menerbitkan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear}` });
      }
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Terbitkan Tagihan',
        modul: 'Tagihan & Biaya',
        detail: `Menerbitkan tagihan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear} untuk ${totalTerbit} siswa (nominal menyesuaikan tarif per kelas)`,
      });
      toast(`Tagihan SPP ${BULAN_ID[item.monthIdx]} ${item.calYear} berhasil diterbitkan untuk ${totalTerbit} siswa.`);
      refreshTagihanSpp();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIssuing(null);
      setProgress(null);
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
    <>
      {tingkatDipakai.length > 0 && (
        <div className="card">
          <div className="card-head"><div><h3>Cakupan Tarif SPP per Kelas — {tahunAjaranAktif.label}</h3><p>Tiap kelas yang punya siswa harus punya tarif SPP (spesifik kelas itu, atau tarif "Semua Kelas") sebelum bisa menerbitkan.</p></div></div>
          <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cakupanTarif.map(c => (
              <div key={c.tingkat} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, background: c.tarif ? 'var(--green-soft)' : 'var(--red-soft)', color: c.tarif ? 'var(--green-dark)' : 'var(--red)' }}>
                Kelas {c.tingkat}: {c.tarif ? `${formatRupiah(c.tarif.nominal)}${c.tarif.kelasTingkat === 'Semua Kelas' ? ' (umum)' : ' (khusus)'}` : '✕ Belum ada tarif'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>🗓️ Jadwal Penerbitan SPP — {tahunAjaranAktif.label}</h3><p>Setiap bulan diterbitkan lewat aksi eksplisit — bukan otomatis — supaya tidak salah tagih siswa yang berhenti/pindah.</p></div>
          <button className="btn btn-sm" onClick={refreshTagihanSpp} disabled={tagihanSppLoading}>{tagihanSppLoading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
        <div className="card-body">
          {tingkatBelumAdaTarif.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>
              ⚠️ Kelas {tingkatBelumAdaTarif.join(', ')} belum punya Tarif SPP untuk tahun ajaran ini — tambahkan dulu di tab Tarif sebelum menerbitkan.
            </p>
          )}
          {tagihanSppLoaded && (
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
                        {item.status !== 'Sudah Terbit' && item.status !== 'Belum Waktunya' && (
                          <button className="btn btn-sm btn-primary" onClick={() => terbitkan(item)} disabled={issuing === item.monthIdx || !semuaTingkatPunyaTarif}>
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

      {progress && <ProgressModal title={progress.label} current={progress.current} total={progress.total} />}
    </>
  );
}
