import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import { statusTagihan } from '../../db/tagihanHelpers';
import { initials, avatarColor, BULAN_ID } from '../../db/helpers';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

function StatusBadge({ status }) {
  const map = { Lunas: 'badge-green', Sebagian: 'badge-gold', 'Belum Lunas': 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
}

function TahunCard({ tahunAjaran, items, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const spp = items.filter(t => t.refType === 'SPP').sort((a, b) => (a.tahunKalender - b.tahunKalender) || (BULAN_ID.indexOf(a.bulan) - BULAN_ID.indexOf(b.bulan)));
  const lain = items.filter(t => t.refType === 'LAIN');
  const totalTagihan = items.reduce((s, t) => s + t.nominal, 0);
  const totalBayar = items.reduce((s, t) => s + t.terbayar, 0);
  const sisa = totalTagihan - totalBayar;
  const statusTahun = statusTagihan(totalTagihan, totalBayar);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F6F8F5', cursor: 'pointer' }}>
        <strong style={{ fontSize: 13.5 }}>Tahun Pelajaran {tahunAjaran}</strong>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><StatusBadge status={statusTahun} /> {open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div style={{ padding: 16 }}>
          {spp.length > 0 && (
            <table>
              <thead><tr><th>No</th><th>Bulan</th><th>Nominal</th><th>Status</th></tr></thead>
              <tbody>
                {spp.map((t, idx) => (
                  <tr key={t.id}><td>{idx + 1}</td><td>{t.bulan} {t.tahunKalender}</td><td>{formatRupiah(t.nominal)}</td><td><StatusBadge status={t.status} /></td></tr>
                ))}
              </tbody>
            </table>
          )}
          {lain.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, margin: '14px 0 8px' }}>Biaya Lain Tahun Ini</div>
              <table>
                <thead><tr><th>Jenis Biaya</th><th>Nominal</th><th>Status</th></tr></thead>
                <tbody>
                  {lain.map(t => (
                    <tr key={t.id}><td>{t.label}</td><td>{formatRupiah(t.nominal)}</td><td><StatusBadge status={t.status} /></td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="info-grid" style={{ marginTop: 14 }}>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Tagihan</div><div style={{ fontWeight: 800 }}>{formatRupiah(totalTagihan)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Sudah Dibayar</div><div style={{ fontWeight: 800 }}>{formatRupiah(totalBayar)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Sisa</div><div style={{ fontWeight: 800 }}>{formatRupiah(sisa)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Status</div><StatusBadge status={statusTahun} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SppPesertaDidik() {
  const { siswa, siswaLoading, siswaError, siswaLoaded, allTagihan, tagihanTerbayar, tagihanSppLoaded, tagihanLainLoaded } = useAppData();
  const [term, setTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const suggestions = useMemo(() => {
    if (!term.trim()) return [];
    const t = term.toLowerCase();
    return siswa.filter(s => s.nama.toLowerCase().includes(t) || s.nisn.includes(t)).slice(0, 6);
  }, [term, siswa]);

  const selected = siswa.find(s => s.id === selectedId);

  const riwayatSiswa = useMemo(() => {
    if (!selected) return [];
    return allTagihan
      .filter(t => t.nisn === selected.nisn)
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        return { ...t, terbayar, status: statusTagihan(t.nominal, terbayar) };
      });
  }, [selected, allTagihan, tagihanTerbayar]);

  const perTahunAjaran = useMemo(() => {
    const map = {};
    riwayatSiswa.forEach(t => {
      if (!map[t.tahunAjaran]) map[t.tahunAjaran] = [];
      map[t.tahunAjaran].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])); // terbaru dulu
  }, [riwayatSiswa]);

  const totalKeseluruhan = useMemo(() => {
    const totalTagihan = riwayatSiswa.reduce((s, t) => s + t.nominal, 0);
    const totalBayar = riwayatSiswa.reduce((s, t) => s + t.terbayar, 0);
    return { totalTagihan, totalBayar, sisa: totalTagihan - totalBayar };
  }, [riwayatSiswa]);

  const keuanganSiap = tagihanSppLoaded || tagihanLainLoaded;

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
                {keuanganSiap && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-gold">Total Tagihan: {formatRupiah(totalKeseluruhan.totalTagihan)}</span>
                    <span className="badge badge-green">Terbayar: {formatRupiah(totalKeseluruhan.totalBayar)}</span>
                    <span className={`badge ${totalKeseluruhan.sisa > 0 ? 'badge-red' : 'badge-green'}`}>Sisa: {formatRupiah(totalKeseluruhan.sisa)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!keuanganSiap && (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              📋 Memuat riwayat SPP...
            </div></div>
          )}

          {keuanganSiap && perTahunAjaran.length === 0 && (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              Belum ada tagihan untuk siswa ini. Terbitkan SPP dulu lewat menu <strong>Tagihan &amp; Biaya</strong>.
            </div></div>
          )}

          {keuanganSiap && perTahunAjaran.map(([ta, items], idx) => (
            <TahunCard key={ta} tahunAjaran={ta} items={items} defaultOpen={idx === 0} />
          ))}
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
