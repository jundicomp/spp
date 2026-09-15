import { useId, useMemo, useRef, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import { addPembayaranToSheet, addLogEntry } from '../../services/googleSheets';
import { statusTagihan } from '../../db/tagihanHelpers';
import { nominalEfektifTagihan } from '../../db/beasiswaFields';
import { METODE_BAYAR_OPTIONS, SARAN_AKUN_PER_METODE } from '../../db/pembayaranFields';
import { akunAktivaOptions } from '../../db/akunBukuBesarFields';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { initials, avatarColor, todayWIB, formatTanggalTampil, normalisasiTanggalUntukInput } from '../../db/helpers';
import { exportToExcel, printElementById } from '../../utils/exportTable';
import KwitansiModal from './KwitansiModal';
import BayarSekaligusModal from './BayarSekaligusModal';
import Modal from '../../components/common/Modal';
import SuggestionDropdown from '../../components/common/SuggestionDropdown';
import SaveProgressModal from '../../components/common/SaveProgressModal';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 'Semua'];

// Label "Tanggal: ..." dipakai baik di judul cetak PDF maupun subjudul Excel --
// 1 fungsi supaya keduanya SELALU konsisten kalau logikanya berubah nanti.
function labelRentangTanggal(dari, sampai) {
  if (!dari && !sampai) return 'Semua Tanggal';
  if (dari && sampai && dari === sampai) return formatTanggalTampil(dari);
  if (dari && !sampai) return `Sejak ${formatTanggalTampil(dari)}`;
  if (!dari && sampai) return `Sampai ${formatTanggalTampil(sampai)}`;
  return `${formatTanggalTampil(dari)} s/d ${formatTanggalTampil(sampai)}`;
}

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export default function PembayaranTab() {
  const { siswa, kelas, allTagihan, pembayaran, pembayaranLoading, pembayaranLoaded, refreshPembayaran, tagihanTerbayar, toast, akun, beasiswaSiswa, beasiswaKategori, profilSekolah } = useAppData();
  const { currentUser } = useAuth();

  const [term, setTerm] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState(null);
  const inputRef = useRef(null);
  const [selectedTagihanId, setSelectedTagihanId] = useState(null);
  const [nominal, setNominal] = useState('');
  const [tanggalBayar, setTanggalBayar] = useState(() => todayWIB());
  const [metode, setMetode] = useState(METODE_BAYAR_OPTIONS[0]);
  const [akunPenerima, setAkunPenerima] = useState(SARAN_AKUN_PER_METODE[METODE_BAYAR_OPTIONS[0]] || 'Kas');
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState(null); // null | 'saving' | 'done'
  const [lihatKwitansi, setLihatKwitansi] = useState(null);
  const [bayarSekaligus, setBayarSekaligus] = useState(false);

  // Filter Kelas & Rombel -- diterapkan SEBELUM pencarian nama/NISN, supaya mudah
  // menemukan siswa yg namanya mirip/sama di sekolah dgn banyak rombel. Sumber
  // pilihannya dari data KONFIGURASI Kelas (menu Data Kelas & Rombel), sama spt
  // pola yg dipakai di Laporan Rombel.
  const [filterKelas, setFilterKelas] = useState('');
  const [filterRombel, setFilterRombel] = useState('');

  const daftarKelasOptions = useMemo(() => {
    const set = new Set(kelas.map(k => k.tingkat).filter(Boolean));
    return Array.from(set).sort();
  }, [kelas]);

  const daftarRombelOptions = useMemo(() => {
    if (!filterKelas) return [];
    const set = new Set(kelas.filter(k => k.tingkat === filterKelas).map(k => k.namaKelas).filter(Boolean));
    return Array.from(set).sort();
  }, [kelas, filterKelas]);

  function gantiFilterKelas(v) {
    setFilterKelas(v);
    setFilterRombel('');
  }

  // Filter tanggal riwayat pembayaran -- default kosong (tampil semua), diisi biar
  // bisa lihat transaksi hari per hari (dari=sampai=tanggal yg sama) atau rentang.
  const [dariTanggal, setDariTanggal] = useState('');
  const [sampaiTanggal, setSampaiTanggal] = useState('');
  const [printingAll, setPrintingAll] = useState(false);
  const printId = 'print-' + useId().replace(/:/g, '');
  const namaSekolah = profilSekolah?.nama || 'MI Ikhlasiyah';

  function handlePrint() {
    // Sama spt pola GenericStoredTable/LaporanRekapAset -- nyalakan forceShowAll dulu,
    // tunggu React render ulang dgn SEMUA baris, baru panggil print.
    setPrintingAll(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        printElementById(printId);
        setPrintingAll(false);
      });
    });
  }

  const suggestions = useMemo(() => {
    if (!term.trim() || selectedSiswaId) return [];
    const t = term.toLowerCase();
    return siswa
      .filter(s => !filterKelas || s.kelasTingkat === filterKelas)
      .filter(s => !filterRombel || s.rombel === filterRombel)
      .filter(s => s.nama.toLowerCase().includes(t) || s.nisn.includes(t))
      .slice(0, 6);
  }, [term, siswa, selectedSiswaId, filterKelas, filterRombel]);

  const selectedSiswa = siswa.find(s => s.id === selectedSiswaId);

  const tagihanBelumLunasSiswa = useMemo(() => {
    if (!selectedSiswa) return [];
    const cutoffMs = Date.now();
    return allTagihan
      .filter(t => t.nisn === selectedSiswa.nisn)
      .map(t => {
        const terbayar = tagihanTerbayar(t.refType, t.no);
        const { nominalEfektif, potongan } = nominalEfektifTagihan(t, beasiswaSiswa, beasiswaKategori, cutoffMs, terbayar);
        const sisa = nominalEfektif - terbayar;
        return { ...t, nominalAsli: t.nominal, nominalEfektif, potonganBeasiswa: potongan, terbayar, sisa, status: statusTagihan(nominalEfektif, terbayar) };
      })
      .filter(t => t.sisa > 0 || t.potonganBeasiswa); // tetap tampil kalau ada potongan blm "diklaim" walau sisa efektif 0
  }, [selectedSiswa, allTagihan, tagihanTerbayar, beasiswaSiswa, beasiswaKategori]);

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

  function handleGantiMetode(m) {
    setMetode(m);
    setAkunPenerima(SARAN_AKUN_PER_METODE[m] || 'Kas');
  }

  async function submitPembayaran(e) {
    e.preventDefault();
    if (!selectedTagihan) { toast('Pilih tagihan yang mau dibayar dulu.', 'error'); return; }
    const nom = Number(nominal);
    // Nominal 0 CUMA boleh kalau memang sisa tagihan ini SUDAH 0 gara-gara potongan
    // beasiswa 100% (kasus "SPP diterbitkan dulu, beasiswa dipasang belakangan") --
    // di luar itu tetap wajib > 0 spt biasa.
    const bolehNol = selectedTagihan.potonganBeasiswa && selectedTagihan.sisa === 0;
    if ((!nom || nom <= 0) && !bolehNol) { toast('Nominal harus lebih dari 0.', 'error'); return; }
    if (nom < 0 || nom > selectedTagihan.sisa) { toast(`Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(selectedTagihan.sisa)}).`, 'error'); return; }
    setSaving(true);
    setPhase('saving');
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
        Akun: akunPenerima,
        Keterangan: selectedTagihan.potonganBeasiswa
          ? `Potongan Beasiswa: ${selectedTagihan.potonganBeasiswa.kategori.nama} (${formatRupiah(selectedTagihan.potonganBeasiswa.nominalPotongan)}) -- nominal asli ${formatRupiah(selectedTagihan.nominalAsli)}`
          : '',
      };
      await addPembayaranToSheet(row);
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Catat Pembayaran',
        modul: 'Pembayaran & Invoice',
        detail: `Pembayaran ${selectedTagihan.label} sebesar ${formatRupiah(nom)} dari ${selectedSiswa.nama}${selectedTagihan.potonganBeasiswa ? ` (dapat potongan beasiswa ${selectedTagihan.potonganBeasiswa.kategori.nama})` : ''}`,
      });
      setPhase('done');
      await new Promise(r => setTimeout(r, 1100)); // biarkan pesan sukses terlihat sebentar
      setSelectedTagihanId(null);
      setNominal('');
      refreshPembayaran();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
      setPhase(null);
    }
  }

  // Dulu dibatasi 20 transaksi terakhir kalau belum pilih siswa -- sekarang tampilkan
  // SEMUA (terbaru dulu), krn sudah ada filter tanggal + dropdown "Tampilkan" (10/20/
  // 50/100/Semua) di bawah utk mengatur seberapa banyak yg ditampilkan sekaligus.
  const riwayatSiswaIni = useMemo(() => {
    if (!selectedSiswa) return pembayaran.slice().reverse();
    return pembayaran.filter(p => p.nisn === selectedSiswa.nisn).slice().reverse();
  }, [pembayaran, selectedSiswa]);

  // Filter tanggal (Dari/Sampai) -- dibandingkan dlm bentuk "yyyy-MM-dd" yg dinormalisasi
  // (bukan string mentah apa adanya), supaya baris data lama yg formatnya "kotor"
  // (ISO+jam, atau dd/mm/yyyy) tetap ke-filter dgn benar, bukan cuma dibandingkan
  // sbg teks apa adanya.
  const riwayatTerfilter = useMemo(() => {
    if (!dariTanggal && !sampaiTanggal) return riwayatSiswaIni;
    return riwayatSiswaIni.filter(p => {
      const t = normalisasiTanggalUntukInput(p.tanggalBayar);
      if (!t) return false;
      if (dariTanggal && t < dariTanggal) return false;
      if (sampaiTanggal && t > sampaiTanggal) return false;
      return true;
    });
  }, [riwayatSiswaIni, dariTanggal, sampaiTanggal]);

  const totalNominalTerfilter = useMemo(() => riwayatTerfilter.reduce((s, p) => s + p.nominal, 0), [riwayatTerfilter]);

  function resetFilterTanggal() {
    setDariTanggal('');
    setSampaiTanggal('');
  }
  function filterHariIni() {
    const t = todayWIB();
    setDariTanggal(t);
    setSampaiTanggal(t);
  }

  return (
    <>
      <div className="card">
        <div className="card-head"><div><h3>Catat Pembayaran</h3><p>Cari siswa, pilih tagihan yang mau dibayar, lalu simpan.</p></div></div>
        <form onSubmit={submitPembayaran}>
          <div className="card-body">
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div className="field" style={{ minWidth: 160 }}>
                <label>Pilih Kelas</label>
                <select value={filterKelas} onChange={e => gantiFilterKelas(e.target.value)}>
                  <option value="">Semua Kelas</option>
                  {daftarKelasOptions.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
              </div>
              <div className="field" style={{ minWidth: 160 }}>
                <label>Pilih Rombel</label>
                <select value={filterRombel} onChange={e => setFilterRombel(e.target.value)} disabled={!filterKelas}>
                  <option value="">Semua Rombel</option>
                  {daftarRombelOptions.map(r => <option key={r} value={r}>Rombel {r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ maxWidth: 420, marginBottom: 18 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Cari Siswa</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Nama atau NISN..."
                value={term}
                onChange={e => { setTerm(e.target.value); setSelectedSiswaId(null); setSelectedTagihanId(null); }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
              />
              <SuggestionDropdown anchorRef={inputRef} visible={suggestions.length > 0}>
                {suggestions.map(s => (
                  <div key={s.id} onClick={() => pilihSiswa(s)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarColor(s.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{initials(s.nama)}</div>
                    <div style={{ fontSize: 13 }}>{s.nama} <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>· {s.nisn}</span></div>
                  </div>
                ))}
              </SuggestionDropdown>
            </div>

            {selectedSiswa && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>Pilih Tagihan Belum Lunas</label>
                  <button type="button" className="btn btn-sm" onClick={() => setBayarSekaligus(true)}>🗓️ Bayar Sekaligus</button>
                </div>
                {tagihanBelumLunasSiswa.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Semua tagihan siswa ini sudah lunas. 🎉</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tagihanBelumLunasSiswa.map(t => (
                    <div
                      key={t.id}
                      onClick={() => pilihTagihan(t)}
                      style={{
                        padding: '10px 14px', border: '1.5px solid var(--border)',
                        borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                        background: '#fff',
                      }}
                    >
                      <span style={{ fontSize: 13.5 }}>
                        {t.label} <span className={`badge ${t.status === 'Sebagian' ? 'badge-gold' : 'badge-red'}`} style={{ marginLeft: 8 }}>{t.status}</span>
                        <span style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 700 }}>Bayar Sekarang</span>
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>Sisa {formatRupiah(t.sisa)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {selectedTagihan && (
        <Modal
          title="Catat Pembayaran"
          subtitle={`${selectedSiswa.nama} — ${selectedTagihan.label} — Sisa ${formatRupiah(selectedTagihan.sisa)}`}
          onClose={() => setSelectedTagihanId(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setSelectedTagihanId(null)}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={submitPembayaran} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pembayaran'}</button>
            </>
          }
        >
          <div style={{ background: 'var(--green-soft)', borderRadius: 10, padding: 18, margin: '-4px -4px 4px' }}>
            {selectedTagihan.potonganBeasiswa && (
              <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>Nominal Tagihan Asli</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>{formatRupiah(selectedTagihan.nominalAsli)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                  <span>Potongan Beasiswa <span style={{ background: 'var(--gold)', color: 'var(--green-dark)', fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginLeft: 6 }}>🎓 {selectedTagihan.potonganBeasiswa.kategori.nama} -{formatRupiah(selectedTagihan.potonganBeasiswa.nominalPotongan)}</span></span>
                  <span style={{ color: 'var(--red)' }}>- {formatRupiah(selectedTagihan.nominalAsli - selectedTagihan.nominalEfektif)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--green-soft)', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-dark)' }}>Nominal Setelah Potongan</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(selectedTagihan.nominalEfektif)}</span>
                </div>
              </div>
            )}
            <div className="form-grid">
              <div className="field">
                <label>Nominal Dibayar (Rp)</label>
                <input type="number" value={nominal} onChange={e => setNominal(e.target.value)} max={selectedTagihan.sisa} autoFocus />
              </div>
              <div className="field">
                <label>Tanggal Bayar</label>
                <input type="date" value={tanggalBayar} onChange={e => setTanggalBayar(e.target.value)} />
              </div>
              <div className="field">
                <label>Metode</label>
                <select value={metode} onChange={e => handleGantiMetode(e.target.value)}>
                  {METODE_BAYAR_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Akun Kas/Bank Penerima</label>
                <select value={akunPenerima} onChange={e => setAkunPenerima(e.target.value)}>
                  {akunAktivaOptions(akun).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>Riwayat Pembayaran{selectedSiswa ? ` — ${selectedSiswa.nama}` : ''}</h3><p>{pembayaranLoading ? 'Memuat...' : `${riwayatTerfilter.length} transaksi`}</p></div>
          <div className="no-print" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => exportToExcel(
              ['Tanggal', 'Nama Siswa', 'Jenis', 'Nominal', 'Metode'],
              riwayatTerfilter.map(p => ({ 'Tanggal': formatTanggalTampil(p.tanggalBayar), 'Nama Siswa': p.namaSiswa, 'Jenis': p.jenis, 'Nominal': p.nominal, 'Metode': p.metode })),
              'Riwayat Pembayaran',
              [namaSekolah, `Laporan Pembayaran${selectedSiswa ? ' — ' + selectedSiswa.nama : ''}`, `Tanggal: ${labelRentangTanggal(dariTanggal, sampaiTanggal)}`],
              { Nominal: totalNominalTerfilter }
            )} disabled={riwayatTerfilter.length === 0}>📊 Excel</button>
            <button className="btn btn-sm" onClick={handlePrint} disabled={riwayatTerfilter.length === 0}>🖨️ PDF</button>
            <button className="btn btn-sm" onClick={refreshPembayaran} disabled={pembayaranLoading}>↻ Muat Ulang</button>
          </div>
        </div>
        <div className="card-body">
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 16, padding: '12px 14px', background: '#F6F8F5', borderRadius: 8 }}>
            <div className="field">
              <label>Dari Tanggal</label>
              <input type="date" value={dariTanggal} onChange={e => setDariTanggal(e.target.value)} />
            </div>
            <div className="field">
              <label>Sampai Tanggal</label>
              <input type="date" value={sampaiTanggal} onChange={e => setSampaiTanggal(e.target.value)} />
            </div>
            <button type="button" className="btn btn-sm" onClick={filterHariIni}>Hari Ini</button>
            {(dariTanggal || sampaiTanggal) && <button type="button" className="btn btn-sm" onClick={resetFilterTanggal}>✕ Reset Tanggal</button>}
          </div>

          {pembayaranLoaded && riwayatTerfilter.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{riwayatSiswaIni.length === 0 ? 'Belum ada pembayaran tercatat.' : 'Tidak ada transaksi pada rentang tanggal ini.'}</p>}
          {riwayatTerfilter.length > 0 && (
            <div id={printId}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>{namaSekolah}</h2>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Laporan Pembayaran{selectedSiswa ? ` — ${selectedSiswa.nama}` : ''}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Tanggal: {labelRentangTanggal(dariTanggal, sampaiTanggal)}</div>
              </div>
              <DataTable
                columns={[
                  { key: 'tanggalBayar', label: 'Tanggal', render: r => formatTanggalTampil(r.tanggalBayar), sortable: true },
                  { key: 'namaSiswa', label: 'Nama Siswa', accessor: r => r.namaSiswa, sortable: true },
                  { key: 'jenis', label: 'Jenis', accessor: r => r.jenis },
                  { key: 'nominal', label: 'Nominal', accessor: r => r.nominal, render: r => formatRupiah(r.nominal), sortable: true },
                  { key: 'metode', label: 'Metode', accessor: r => r.metode },
                  { key: 'aksi', label: 'Aksi', headerClassName: 'no-print', render: r => <div className="no-print"><button className="btn btn-sm" onClick={() => setLihatKwitansi(r)}>🧾 Kwitansi</button></div> },
                ]}
                data={riwayatTerfilter}
                searchFn={(r, t) => (r.namaSiswa || '').toLowerCase().includes(t) || (r.jenis || '').toLowerCase().includes(t) || (r.metode || '').toLowerCase().includes(t)}
                emptyMessage="Tidak ada transaksi yang cocok dengan pencarian ini."
                rowKey={r => r.id}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                forceShowAll={printingAll}
                footer={(rows) => (
                  <tr style={{ fontWeight: 700, background: '#F6F8F5' }}>
                    <td colSpan={4} style={{ textAlign: 'right' }}>Total ({rows.length} transaksi)</td>
                    <td>{formatRupiah(rows.reduce((s, r) => s + r.nominal, 0))}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {lihatKwitansi && <KwitansiModal pembayaran={lihatKwitansi} onClose={() => setLihatKwitansi(null)} />}
      {bayarSekaligus && selectedSiswa && <BayarSekaligusModal siswa={selectedSiswa} onClose={() => setBayarSekaligus(false)} />}
      {phase && <SaveProgressModal phase={phase} />}
    </>
  );
}
