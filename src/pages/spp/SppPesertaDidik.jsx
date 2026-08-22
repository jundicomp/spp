import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import { useAppData } from '../../context/AppContext';
import { formatRupiah, initials, avatarColor, tagihanStatus, BULAN_ID } from '../../db/helpers';

function StatusBadge({ status }) {
  const map = {
    Lunas: 'badge-green',
    Sebagian: 'badge-gold',
    'Belum Lunas': 'badge-red',
    Diputihkan: 'badge-purple',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
}

function YearCard({ ta, siswaId }) {
  const { tagihanSpp, tagihanLain, tagihanTerbayar } = useAppData();
  const [open, setOpen] = useState(false);

  const bulananSpp = tagihanSpp
    .filter(t => t.siswaId === siswaId && t.tahunAjaran === ta.label)
    .sort((a, b) => (a.tahunKalender - b.tahunKalender) || (a.bulan - b.bulan));
  const lain = tagihanLain.filter(t => t.siswaId === siswaId && t.tahunAjaran === ta.label);

  let yTagihan = 0, yBayar = 0;
  const rows = bulananSpp.map((t, idx) => {
    const bayar = tagihanTerbayar('SPP', t.id);
    yTagihan += t.nominal; yBayar += bayar;
    return { idx, label: `${BULAN_ID[t.bulan]} ${t.tahunKalender}`, nominal: t.nominal, status: tagihanStatus(t.nominal, bayar) };
  });
  const lainRows = lain.map(t => {
    const bayar = tagihanTerbayar('LAIN', t.id);
    yTagihan += t.nominal; yBayar += bayar;
    return { label: t.nama, nominal: t.nominal, status: tagihanStatus(t.nominal, bayar) };
  });
  const sisa = yTagihan - yBayar;
  const yStatus = sisa <= 0 ? 'Lunas' : (yBayar > 0 ? 'Sebagian' : 'Belum Lunas');

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F6F8F5', cursor: 'pointer' }}
      >
        <strong style={{ fontSize: 13.5 }}>Tahun Pelajaran {ta.label}</strong>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><StatusBadge status={yStatus} /> {open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div style={{ padding: 16 }}>
          <table>
            <thead><tr><th>No</th><th>Bulan</th><th>Nominal</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.idx}><td>{r.idx + 1}</td><td>{r.label}</td><td>{formatRupiah(r.nominal)}</td><td><StatusBadge status={r.status} /></td></tr>
              ))}
            </tbody>
          </table>
          {lain.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, margin: '14px 0 8px' }}>Biaya Lain Tahun Ini</div>
              <table>
                <thead><tr><th>Jenis Biaya</th><th>Nominal</th><th>Status</th></tr></thead>
                <tbody>
                  {lainRows.map((r, i) => (
                    <tr key={i}><td>{r.label}</td><td>{formatRupiah(r.nominal)}</td><td><StatusBadge status={r.status} /></td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="info-grid" style={{ marginTop: 14 }}>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Tagihan</div><div style={{ fontWeight: 800 }}>{formatRupiah(yTagihan)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Sudah Dibayar</div><div style={{ fontWeight: 800 }}>{formatRupiah(yBayar)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Sisa</div><div style={{ fontWeight: 800 }}>{formatRupiah(sisa)}</div></div>
            <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Status</div><StatusBadge status={yStatus} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SppPesertaDidik() {
  const { siswa, tahunAjaran, tagihanSpp, tagihanLain, tagihanTerbayar } = useAppData();
  const [term, setTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const suggestions = useMemo(() => {
    if (!term.trim()) return [];
    const t = term.toLowerCase();
    return siswa.filter(s => s.nama.toLowerCase().includes(t) || s.nis.includes(t)).slice(0, 6);
  }, [term, siswa]);

  const selected = siswa.find(s => s.id === selectedId);

  const history = useMemo(() => {
    if (!selected) return [];
    return tahunAjaran.filter(ta => selected.tahunMasuk <= parseInt(ta.label.split('/')[0])).slice().reverse();
  }, [selected, tahunAjaran]);

  const totals = useMemo(() => {
    if (!selected) return null;
    let totalTagihan = 0, totalBayar = 0;
    tagihanSpp.filter(t => t.siswaId === selected.id).forEach(t => { totalTagihan += t.nominal; totalBayar += tagihanTerbayar('SPP', t.id); });
    tagihanLain.filter(t => t.siswaId === selected.id).forEach(t => { totalTagihan += t.nominal; totalBayar += tagihanTerbayar('LAIN', t.id); });
    return { totalTagihan, totalBayar, sisa: totalTagihan - totalBayar };
  }, [selected, tagihanSpp, tagihanLain, tagihanTerbayar]);

  return (
    <Page pageId="spp" title="SPP Peserta Didik" path="SPP / SPP Peserta Didik">
      <div className="card">
        <div className="card-body">
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={term}
              onChange={e => { setTerm(e.target.value); setSelectedId(null); }}
              style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
            />
            {suggestions.length > 0 && !selected && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: '0 8px 20px rgba(0,0,0,.08)' }}>
                {suggestions.map(s => (
                  <div key={s.id} onClick={() => { setSelectedId(s.id); setTerm(s.nama); }} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColor(s.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{initials(s.nama)}</div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{s.nama}</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>NIS {s.nis} · {s.kelasNama}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && totals && (
        <>
          <div className="card">
            <div className="card-body" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarColor(selected.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{initials(selected.nama)}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: 0, fontSize: 19 }}>{selected.nama}</h2>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>NIS: {selected.nis} &nbsp;·&nbsp; Kelas: {selected.kelasNama} &nbsp;·&nbsp; Masuk: {selected.tahunMasuk}/{selected.tahunMasuk + 1}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-gold">Total Tagihan: {formatRupiah(totals.totalTagihan)}</span>
                  <span className="badge badge-green">Terbayar: {formatRupiah(totals.totalBayar)}</span>
                  <span className={`badge ${totals.sisa > 0 ? 'badge-red' : 'badge-green'}`}>Sisa: {formatRupiah(totals.sisa)}</span>
                </div>
              </div>
            </div>
          </div>

          {history.map(ta => <YearCard key={ta.id} ta={ta} siswaId={selected.id} />)}
        </>
      )}

      {!selected && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>Cari nama atau NIS siswa di atas untuk melihat riwayat SPP-nya.</div></div>
      )}
    </Page>
  );
}
