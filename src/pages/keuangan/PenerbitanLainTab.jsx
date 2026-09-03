import { useMemo, useState } from 'react';
import { bulkAddToSheet, addLogEntry } from '../../services/googleSheets';
import { formatRupiah } from '../../db/helpers';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ProgressModal from '../../components/common/ProgressModal';

const UKURAN_KELOMPOK = 15;
const TIPE_BISA_TERBITKAN = ['Sekali Masuk', 'Per Tahun'];

export default function PenerbitanLainTab() {
  const { tahunAjaranAktif, tarif, siswa, tagihanLain, tagihanLainLoading, tagihanLainLoaded, refreshTagihanLain, toast } = useAppData();
  const { currentUser } = useAuth();
  const [issuing, setIssuing] = useState(null);
  const [progress, setProgress] = useState(null);

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const tarifTahunIni = useMemo(
    () => tarif.filter(t => t.tahunAjaran === tahunAjaranAktif?.label && TIPE_BISA_TERBITKAN.includes(t.tipe)),
    [tarif, tahunAjaranAktif]
  );

  const tagihanTahunIni = useMemo(
    () => tagihanLain.filter(t => t.tahunAjaran === tahunAjaranAktif?.label),
    [tagihanLain, tahunAjaranAktif]
  );

  const daftarTarif = useMemo(() => {
    return tarifTahunIni.map(t => {
      const targetSiswa = siswaAktif.filter(s => t.kelasTingkat === 'Semua Kelas' || s.kelasTingkat === t.kelasTingkat);
      const sudahTertagih = new Set(tagihanTahunIni.filter(x => x.label === t.jenis).map(x => x.nisn));
      const belumTertagih = targetSiswa.filter(s => !sudahTertagih.has(s.nisn));
      return { tarif: t, targetSiswa, jumlahSudah: sudahTertagih.size, jumlahBelum: belumTertagih.length, belumTertagih };
    });
  }, [tarifTahunIni, siswaAktif, tagihanTahunIni]);

  async function terbitkan(item) {
    if (item.belumTertagih.length === 0) return;
    setIssuing(item.tarif.id);
    const total = item.belumTertagih.length;
    setProgress({ current: 0, total, label: `Menerbitkan "${item.tarif.jenis}"` });
    try {
      let totalTerbit = 0;
      for (let i = 0; i < item.belumTertagih.length; i += UKURAN_KELOMPOK) {
        const kelompok = item.belumTertagih.slice(i, i + UKURAN_KELOMPOK);
        const rows = kelompok.map(s => ({
          NISN: s.nisn,
          'Nama Siswa': s.nama,
          'Tahun Ajaran': tahunAjaranAktif.label,
          Nama: item.tarif.jenis,
          Wajib: item.tarif.wajib,
          Nominal: item.tarif.nominal,
          'Jatuh Tempo': new Date().toISOString().slice(0, 10),
        }));
        const result = await bulkAddToSheet('tagihanLain', rows, 'keuangan');
        totalTerbit += result.count;
        setProgress({ current: Math.min(i + kelompok.length, total), total, label: `Menerbitkan "${item.tarif.jenis}"` });
      }
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Terbitkan Tagihan',
        modul: 'Tagihan & Biaya',
        detail: `Menerbitkan tagihan "${item.tarif.jenis}" untuk ${totalTerbit} siswa`,
      });
      toast(`Tagihan "${item.tarif.jenis}" berhasil diterbitkan untuk ${totalTerbit} siswa.`);
      refreshTagihanLain();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIssuing(null);
      setProgress(null);
    }
  }

  if (!tahunAjaranAktif) {
    return <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran Aktif.</div></div>;
  }

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div><h3>Penerbitan Tagihan Lain — {tahunAjaranAktif.label}</h3><p>Uang Pangkal, Seragam, dan biaya "Sekali Masuk"/"Per Tahun" lainnya. Tarif bertipe "Opsional" tidak muncul di sini.</p></div>
          <button className="btn btn-sm" onClick={refreshTagihanLain} disabled={tagihanLainLoading}>Muat Ulang</button>
        </div>
        <div className="card-body">
          {tarifTahunIni.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Belum ada Tarif bertipe "Sekali Masuk" atau "Per Tahun" untuk tahun ajaran ini. Tambahkan dulu di tab Tarif.
            </p>
          )}
          {tagihanLainLoaded && daftarTarif.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th>Jenis Biaya</th><th>Berlaku Untuk</th><th>Nominal</th><th>Sudah Tertagih</th><th>Belum Tertagih</th><th>Aksi</th></tr></thead>
                <tbody>
                  {daftarTarif.map(item => (
                    <tr key={item.tarif.id}>
                      <td>{item.tarif.jenis}</td>
                      <td>{item.tarif.kelasTingkat === 'Semua Kelas' ? 'Semua Kelas' : `Kelas ${item.tarif.kelasTingkat}`}</td>
                      <td>{formatRupiah(item.tarif.nominal)}</td>
                      <td>{item.jumlahSudah} siswa</td>
                      <td>{item.jumlahBelum} siswa</td>
                      <td>
                        {item.jumlahBelum > 0 ? (
                          <button className="btn btn-sm btn-primary" onClick={() => terbitkan(item)} disabled={issuing === item.tarif.id}>
                            {issuing === item.tarif.id ? 'Menerbitkan...' : `Terbitkan ke ${item.jumlahBelum} Siswa`}
                          </button>
                        ) : (
                          <span className="badge badge-green">Semua Sudah Tertagih</span>
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
