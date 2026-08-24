import { useMemo } from 'react';
import Page from '../components/layout/Page';
import { useAppData } from '../context/AppContext';
import NotifikasiSiswaPerluTindakLanjut from '../components/common/NotifikasiSiswaPerluTindakLanjut';

export default function Dashboard() {
  const { siswa, siswaLoading, siswaError, siswaLoaded, refreshSiswa, kelas, guru, tahunAjaranAktif } = useAppData();

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const stats = useMemo(() => {
    const perTingkat = {};
    const perGender = { 'Laki-laki': 0, 'Perempuan': 0, '-': 0 };
    siswaAktif.forEach(s => {
      const t = s.kelasTingkat || '-';
      perTingkat[t] = (perTingkat[t] || 0) + 1;
      const g = s.jenisKelamin === 'Laki-laki' || s.jenisKelamin === 'Perempuan' ? s.jenisKelamin : '-';
      perGender[g] += 1;
    });
    return { total: siswaAktif.length, perTingkat, perGender };
  }, [siswaAktif]);

  const tingkatList = Object.keys(stats.perTingkat).sort();

  return (
    <Page pageId="dashboard" title="Dashboard" path="Dashboard">
      <NotifikasiSiswaPerluTindakLanjut />

      {(kelas.length > 0 || guru.length > 0) && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-blue">
            <div className="info-value">{guru.filter(g => g.status === 'Aktif').length}</div>
            <div className="info-label">Guru &amp; Staff Aktif</div>
          </div>
          <div className="info-card c-purple">
            <div className="info-value">{kelas.length}</div>
            <div className="info-label">Kelas &amp; Rombel</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>📋 Data Siswa</h3><p>Diambil langsung dari Google Sheets — tahun ajaran aktif {tahunAjaranAktif?.label}.</p></div>
          <button className="btn btn-sm" onClick={refreshSiswa} disabled={siswaLoading}>{siswaLoading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
        <div className="card-body">
          {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data siswa...</p>}
          {siswaError && <p style={{ color: 'var(--red)', fontSize: 13 }}>Gagal memuat: {siswaError}</p>}
          {!siswaLoading && siswaLoaded && siswaAktif.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada siswa aktif tersimpan. Tambahkan lewat menu Data Siswa.</p>
          )}
          {siswaLoaded && siswaAktif.length > 0 && (
            <>
              <div className="info-grid" style={{ marginBottom: 20 }}>
                <div className="info-card c-green">
                  <div className="info-value">{stats.total}</div>
                  <div className="info-label">Total Siswa Aktif</div>
                </div>
                <div className="info-card c-blue">
                  <div className="info-value">{stats.perGender['Laki-laki']}</div>
                  <div className="info-label">Laki-laki</div>
                </div>
                <div className="info-card c-purple">
                  <div className="info-value">{stats.perGender['Perempuan']}</div>
                  <div className="info-label">Perempuan</div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Sebaran per Kelas / Tingkat</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {tingkatList.map(t => (
                  <div key={t} style={{ padding: '10px 16px', background: 'var(--green-soft)', borderRadius: 8, minWidth: 90, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-dark)' }}>{stats.perTingkat[t]}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Kelas {t}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Modul <strong>Keuangan</strong> dan <strong>Sarpras</strong> belum tersambung ke Google Sheets — statistik keuangan
          akan tampil di sini begitu modul tersebut selesai dimigrasi.
        </div>
      </div>
    </Page>
  );
}
