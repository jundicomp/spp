import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import { initials, avatarColor } from '../../db/helpers';

export default function SppPesertaDidik() {
  const { siswa, siswaLoading, siswaError, siswaLoaded } = useAppData();
  const [term, setTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const suggestions = useMemo(() => {
    if (!term.trim()) return [];
    const t = term.toLowerCase();
    return siswa.filter(s => s.nama.toLowerCase().includes(t) || s.nisn.includes(t)).slice(0, 6);
  }, [term, siswa]);

  const selected = siswa.find(s => s.id === selectedId);

  return (
    <Page pageId="spp" title="SPP Peserta Didik" path="SPP / SPP Peserta Didik">
      <div className="card">
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Jumlah siswa terdaftar</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-dark)' }}>{siswa.length} Siswa</div>
          </div>
          {siswaLoading && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Memuat data...</span>}
        </div>
      </div>

      {siswaError && (
        <div className="card"><div className="card-body" style={{ color: 'var(--red)', fontSize: 13 }}>Gagal memuat data siswa: {siswaError}</div></div>
      )}

      {/* overflow:visible dipaksa di sini -- .card bawaan overflow:hidden, itu yg bikin dropdown
          hasil pencarian di bawah ini kepotong/tidak kelihatan */}
      <div className="card" style={{ overflow: 'visible', position: 'relative', zIndex: 5 }}>
        <div className="card-body">
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={term}
              onChange={e => { setTerm(e.target.value); setSelectedId(null); }}
              style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
            />
            {suggestions.length > 0 && !selected && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 50, boxShadow: '0 8px 20px rgba(0,0,0,.15)' }}>
                {suggestions.map(s => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setTerm(s.nama); }} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(s.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(s.nama || '?')}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{s.nama}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>NISN {s.nisn || '-'} · Kelas {s.kelasTingkat || '-'}</div></div>
                  </div>
                ))}
              </div>
            )}
            {term.trim() && suggestions.length === 0 && !selected && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 50, padding: '10px 14px', fontSize: 13, color: 'var(--muted)' }}>
                Tidak ditemukan siswa dengan nama/NISN itu.
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="card">
            <div className="card-body" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarColor(selected.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{initials(selected.nama)}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: 0, fontSize: 19 }}>{selected.nama}</h2>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  NISN: {selected.nisn || '-'} &nbsp;·&nbsp; Kelas: {selected.kelasTingkat || '-'} &nbsp;·&nbsp; Jenis Kelamin: {selected.jenisKelamin || '-'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                  Tempat, Tgl Lahir: {selected.tempatLahir || '-'}, {selected.tanggalLahir || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              📋 Riwayat SPP untuk siswa ini belum tersedia — modul <strong>Keuangan</strong> belum tersambung ke Google Sheets.
              <br />Bagian ini akan otomatis terisi begitu modul Keuangan selesai dimigrasi.
            </div>
          </div>
        </>
      )}

      {!selected && !siswaLoading && siswaLoaded && siswa.length === 0 && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Belum ada data siswa. Tambahkan lewat menu Data Siswa dulu.</div></div>
      )}

      {!selected && siswa.length > 0 && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Cari nama atau NISN siswa di atas untuk melihat detailnya.</div></div>
      )}
    </Page>
  );
}
