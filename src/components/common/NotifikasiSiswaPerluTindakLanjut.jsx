import { useNavigate } from 'react-router-dom';
import useSiswaPerluTindakLanjut from '../../hooks/useSiswaPerluTindakLanjut';

export default function NotifikasiSiswaPerluTindakLanjut() {
  const daftar = useSiswaPerluTindakLanjut();
  const navigate = useNavigate();

  if (daftar.length === 0) return null;

  return (
    <div className="card" style={{ borderColor: 'var(--gold)' }}>
      <div className="card-head">
        <div>
          <h3>⚠️ {daftar.length} Siswa Perlu Tindak Lanjut</h3>
          <p>Siswa aktif (baru masuk / pindahan / data belum lengkap) yang butuh dilengkapi rombel dan/atau tagihan SPP susulan.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="table-scroll">
          <table>
            <thead><tr><th>No</th><th>Nama Siswa</th><th>NISN</th><th>Yang Perlu Dilengkapi</th></tr></thead>
            <tbody>
              {daftar.map((d, idx) => (
                <tr key={d.siswa.id}>
                  <td>{idx + 1}</td>
                  <td>{d.siswa.nama}</td>
                  <td>{d.siswa.nisn || '-'}</td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {d.masalah.map((m, i) => <li key={i} style={{ fontSize: 12.5, color: 'var(--red)' }}>{m}</li>)}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button className="btn btn-sm" onClick={() => navigate('/siswa')}>Lengkapi Rombel di Data Siswa</button>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/tagihan')}>Terbitkan Tagihan Susulan</button>
        </div>
      </div>
    </div>
  );
}
