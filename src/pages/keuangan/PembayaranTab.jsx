import { useMemo, useState } from 'react';
import { addPembayaranToSheet, addLogEntry } from '../../services/googleSheets';
import { statusTagihan } from '../../db/tagihanHelpers';
import { METODE_BAYAR_OPTIONS } from '../../db/pembayaranFields';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { initials, avatarColor } from '../../db/helpers';
import KwitansiModal from './KwitansiModal';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export default function PembayaranTab() {
  const { siswa, allTagihan, pembayaran, pembayaranLoading, pembayaranLoaded, refreshPembayaran, tagihanTerbayar, toast } = useAppData();
  const { currentUser } = useAuth();

  const [term, setTerm] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState(null);
  const [selectedTagihanId, setSelectedTagihanId] = useState(null);
  const [nominal, setNominal] = useState('');
  const [tanggalBayar, setTanggalBayar] = useState(() => new Date().toISOString().slice(0, 10));
  const [metode, setMetode] = useState(METODE_BAYAR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [lihatKwitansi, setLihatKwitansi] = useState(null);

  const suggestions = useMemo(() => {
    if (!term.trim() || selectedSiswaId) return [];
    const t = term.toLowerCase();
    return siswa.filter(s => s.nama.toLowerCase().includes(t) || s.nisn.includes(t)).slice(0, 6);
  }, [term, siswa, selectedSiswaId]);

  const selectedSiswa = siswa.find(s => s.id === selectedSiswaId);

  const tagihanBelumLunasSiswa = useMemo(() => {
    if (!selectedSiswa) return [];
    return allTagihan
      .filter(t => t.nisn === selectedSiswa.nisn)
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        const sisa = t.nominal - terbayar;
        return { ...t, terbayar, sisa, status: statusTagihan(t.nominal, terbayar) };
      })
      .filter(t => t.sisa > 0);
  }, [selectedSiswa, allTagihan, tagihanTerbayar]);

  const selectedTagihan = tagihanBelumLunasSiswa.find(t => t.id === selectedTagihanId);

  function pilihSiswa(s) {
    setSelectedSiswaId(s.id);
    setTerm(s.nama);
    setSelectedTagihanId(null);
    setNominal('');
  }

  function pilihTagihan(t) {
    setSelectedTagihanId(t.id);
    setNominal(String(t.sisa));
  }

  async function submitPembayaran(e) {
    e.preventDefault();
    if (!selectedTagihan) { toast('Pilih tagihan yang mau dibayar dulu.', 'error'); return; }
    const nom = Number(nominal);
    if (!nom || nom <= 0) { toast('Nominal harus lebih dari 0.', 'error'); return; }
    if (nom > selectedTagihan.sisa) { toast(`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(selectedTagihan.sisa)}).`, 'error'); return; }
    setSaving(true);
    try {
      const row = {
        RefType: selectedTagihan.refType,
        RefNo: selectedTagihan.no,
        NISN: selectedSiswa.nisn,
        'Nama Siswa': selectedSiswa.nama,
        Jenis: selectedTagihan.label,
        Nominal: nom,
        'Tanggal Bayar': tanggalBayar,
        Metode: metode,
      };
      await addPembayaranToSheet(row);
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Catat Pembayaran',
        modul: 'Pembayaran & Invoice',
        detail: `Pembayaran ${selectedTagihan.label} sebesar ${formatRupiah(nom)} dari ${selectedSiswa.nama}`,
      });
      toast('Pembayaran berhasil dicatat.');
      setSelectedTagihanId(null);
      setNominal('');
      refreshPembayaran();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const riwayatSiswaIni = useMemo(() => {
    if (!selectedSiswa) return pembayaran.slice().reverse().slice(0, 20);
    return pembayaran.filter(p => p.nisn === selectedSiswa.nisn).slice().reverse();
  }, [pembayaran, selectedSiswa]);

  return (
    <>
      <div className="card" style={{ overflow: 'visible', position: 'relative', zIndex: 5 }}>
        <div className="card-head"><div><h3>Catat Pembayaran</h3><p>Cari siswa, pilih tagihan yang mau dibayar, lalu simpan.</p></div></div>
        <form onSubmit={submitPembayaran}>
          <div className="card-body">
            <div style={{ position: 'relative', maxWidth: 420, marginBottom: 18 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Cari Siswa</label>
              <input
                type="text"
                placeholder="Nama atau NISN..."
                value={term}
                onChange={e => { setTerm(e.target.value); setSelectedSiswaId(null); setSelectedTagihanId(null); }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
              />
              {suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 50, boxShadow: '0 8px 20px rgba(0,0,0,.15)' }}>
                  {suggestions.map(s => (
                    <div key={s.id} onClick={() => pilihSiswa(s)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(s.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{initials(s.nama)}</div>
                      <div style={{ fontSize: 13 }}>{s.nama} <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>· {s.nisn}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedSiswa && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Pilih Tagihan Belum Lunas</label>
                  {tagihanBelumLunasSiswa.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Semua tagihan siswa ini sudah lunas. 🎉</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tagihanBelumLunasSiswa.map(t => (
                      <div
                        key={t.id}
                        onClick={() => pilihTagihan(t)}
                        style={{
                          padding: '10px 14px', border: `1.5px solid ${selectedTagihanId === t.id ? 'var(--green)' : 'var(--border)'}`,
                          borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                          background: selectedTagihanId === t.id ? 'var(--green-soft)' : '#fff',
                        }}
                      >
                        <span style={{ fontSize: 13.5 }}>{t.label} <span className={`badge ${t.status === 'Sebagian' ? 'badge-gold' : 'badge-red'}`} style={{ marginLeft: 8 }}>{t.status}</span></span>
                        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Sisa {formatRupiah(t.sisa)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTagihan && (
                  <div className="form-grid">
                    <div className="field">
                      <label>Nominal Dibayar (Rp)</label>
                      <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} max={selectedTagihan.sisa} />
                    </div>
                    <div className="field">
                      <label>Tanggal Bayar</label>
                      <input type="date" value={tanggalBayar} onChange={e => setTanggalBayar(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Metode</label>
                      <select value={metode} onChange={e => setMetode(e.target.value)}>
                        {METODE_BAYAR_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {selectedTagihan && (
            <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pembayaran'}</button>
            </div>
          )}
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Riwayat Pembayaran{selectedSiswa ? ` — ${selectedSiswa.nama}` : ''}</h3><p>{pembayaranLoading ? 'Memuat...' : `${riwayatSiswaIni.length} transaksi`}</p></div>
          <button className="btn btn-sm" onClick={refreshPembayaran} disabled={pembayaranLoading}>↻ Muat Ulang</button>
        </div>
        <div className="card-body">
          {pembayaranLoaded && riwayatSiswaIni.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada pembayaran tercatat.</p>}
          {riwayatSiswaIni.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th>No</th><th>Nama Siswa</th><th>Jenis</th><th>Nominal</th><th>Tanggal</th><th>Metode</th><th>Aksi</th></tr></thead>
                <tbody>
                  {riwayatSiswaIni.map(p => (
                    <tr key={p.id}>
                      <td>{p.no}</td><td>{p.namaSiswa}</td><td>{p.jenis}</td><td>{formatRupiah(p.nominal)}</td><td>{p.tanggalBayar}</td><td>{p.metode}</td>
                      <td><button className="btn btn-sm" onClick={() => setLihatKwitansi(p)}>🧾 Kwitansi</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {lihatKwitansi && <KwitansiModal pembayaran={lihatKwitansi} onClose={() => setLihatKwitansi(null)} />}
    </>
  );
}
