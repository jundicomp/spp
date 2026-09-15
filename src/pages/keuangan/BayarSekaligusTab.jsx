import { useMemo, useRef, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { BULAN_ID, initials, avatarColor, todayWIB, parseTanggalFleksibel } from '../../db/helpers';
import { statusTagihan } from '../../db/tagihanHelpers';
import { nominalEfektifTagihan, nominalSppSaatTerbit } from '../../db/beasiswaFields';
import { cariTarifSppUntukKelas } from '../../db/tarifFields';
import { METODE_BAYAR_OPTIONS, SARAN_AKUN_PER_METODE } from '../../db/pembayaranFields';
import { akunAktivaOptions } from '../../db/akunBukuBesarFields';
import { bulkAddTagihanSppToSheet, bulkAddPembayaranToSheet, fetchTagihanSppFromSheet, addLogEntry } from '../../services/googleSheets';
import SuggestionDropdown from '../../components/common/SuggestionDropdown';
import SaveProgressModal from '../../components/common/SaveProgressModal';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

function keyBulan(monthIdx, calYear) {
  return `${monthIdx}-${calYear}`;
}

const STATUS_INFO = {
  'Lunas': { badge: 'badge-green', label: '✔ Sudah Lunas' },
  'Sebagian': { badge: 'badge-gold', label: 'Baru Bayar Sebagian' },
  'Belum Lunas': { badge: 'badge-red', label: 'Belum Bayar (sudah tertagih)' },
  'Belum Ditagih': { badge: 'badge-blue', label: '🆕 Belum Ditagih — akan diterbitkan otomatis' },
  'Beasiswa Penuh': { badge: 'badge-purple', label: '🎓 Beasiswa 100% (otomatis lunas)' },
};

export default function BayarSekaligusTab() {
  const {
    siswa, tarif, tahunAjaranAktif, tagihanSpp, tagihanSppLoaded, pembayaranLoaded,
    tagihanTerbayar, beasiswaSiswa, beasiswaKategori, akun,
    refreshTagihanSpp, refreshPembayaran, toast,
  } = useAppData();
  const { currentUser } = useAuth();

  const [term, setTerm] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState(null);
  const inputRef = useRef(null);
  const [bulanTerpilih, setBulanTerpilih] = useState({}); // { "monthIdx-calYear": true }
  const [sampaiBulanKey, setSampaiBulanKey] = useState('');
  const [tanggalBayar, setTanggalBayar] = useState(() => todayWIB());
  const [metode, setMetode] = useState(METODE_BAYAR_OPTIONS[0]);
  const [akunPenerima, setAkunPenerima] = useState(SARAN_AKUN_PER_METODE[METODE_BAYAR_OPTIONS[0]] || 'Kas');
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState(null);

  const suggestions = useMemo(() => {
    if (!term.trim() || selectedSiswaId) return [];
    const t = term.toLowerCase();
    return siswa.filter(s => (s.status || 'Aktif') === 'Aktif' && (s.nama.toLowerCase().includes(t) || s.nisn.includes(t))).slice(0, 6);
  }, [term, siswa, selectedSiswaId]);

  const selectedSiswa = siswa.find(s => s.id === selectedSiswaId);

  const tarifSiswa = useMemo(() => {
    if (!selectedSiswa || !tahunAjaranAktif) return null;
    return cariTarifSppUntukKelas(tarif, tahunAjaranAktif.label, selectedSiswa.kelasTingkat);
  }, [selectedSiswa, tarif, tahunAjaranAktif]);

  // Jadwal 12 bulan SPP tahun ajaran aktif (mulai Juli) UNTUK 1 SISWA INI SAJA --
  // beda dgn Jadwal Penerbitan SPP di tab lain yg per-bulan-utk-semua-siswa. Tiap
  // baris ditandai statusnya: sudah lunas (tdk bisa dipilih), sebagian/belum bayar
  // (tagihan sudah ada, tinggal dibayarkan sisanya), belum ditagih (blm ada baris
  // tagihan sama sekali -- kalau dipilih, akan DITERBITKAN dulu scr otomatis KHUSUS
  // utk siswa ini saat disimpan, BUKAN ke semua siswa lain), atau beasiswa 100%
  // (otomatis lunas, tidak perlu dibayar sama sekali).
  const jadwalBulan = useMemo(() => {
    if (!selectedSiswa || !tahunAjaranAktif) return [];
    const startYear = parseInt(tahunAjaranAktif.label.split('/')[0]);
    const cutoffMs = Date.now();
    const tagihanSiswa = tagihanSpp.filter(t => t.nisn === selectedSiswa.nisn && t.tahunAjaran === tahunAjaranAktif.label);
    const list = [];
    for (let m = 0; m < 12; m++) {
      const monthIdx = (6 + m) % 12;
      const calYear = monthIdx >= 6 ? startYear : startYear + 1;
      const bulanLabel = BULAN_ID[monthIdx];
      const t = tagihanSiswa.find(x => x.bulan === bulanLabel && Number(x.tahunKalender) === calYear);
      if (t) {
        const terbayar = tagihanTerbayar('SPP', t.no);
        const { nominalEfektif, potongan } = nominalEfektifTagihan(t, beasiswaSiswa, beasiswaKategori, cutoffMs, terbayar);
        const sisa = Math.max(0, nominalEfektif - terbayar);
        const status = statusTagihan(nominalEfektif, terbayar);
        list.push({ monthIdx, calYear, bulanLabel, ada: true, no: t.no, nominal: nominalEfektif, sisa, status, potongan, bisaDipilih: status !== 'Lunas' });
      } else {
        const nominalPenuh = tarifSiswa ? tarifSiswa.nominal : 0;
        const tanggalAwalBulanMs = new Date(calYear, monthIdx, 1).getTime();
        const { nominal, potongan } = nominalSppSaatTerbit(selectedSiswa.nisn, nominalPenuh, tanggalAwalBulanMs, beasiswaSiswa, beasiswaKategori, parseTanggalFleksibel);
        const beasiswaPenuh = nominal <= 0;
        list.push({
          monthIdx, calYear, bulanLabel, ada: false, no: null, nominal, sisa: nominal, potongan,
          status: beasiswaPenuh ? 'Beasiswa Penuh' : 'Belum Ditagih',
          bisaDipilih: !beasiswaPenuh && !!tarifSiswa,
        });
      }
    }
    return list;
  }, [selectedSiswa, tahunAjaranAktif, tagihanSpp, tarifSiswa, tagihanTerbayar, beasiswaSiswa, beasiswaKategori]);

  function pilihSiswa(s) {
    setSelectedSiswaId(s.id);
    setTerm(s.nama);
    setBulanTerpilih({});
    setSampaiBulanKey('');
  }

  function toggleBulan(item) {
    if (!item.bisaDipilih) return;
    const k = keyBulan(item.monthIdx, item.calYear);
    setBulanTerpilih(prev => ({ ...prev, [k]: !prev[k] }));
  }

  function terapkanSampaiBulan() {
    if (!sampaiBulanKey) return;
    const idxTarget = jadwalBulan.findIndex(j => keyBulan(j.monthIdx, j.calYear) === sampaiBulanKey);
    if (idxTarget === -1) return;
    const next = { ...bulanTerpilih };
    for (let i = 0; i <= idxTarget; i++) {
      const j = jadwalBulan[i];
      if (j.bisaDipilih) next[keyBulan(j.monthIdx, j.calYear)] = true;
    }
    setBulanTerpilih(next);
  }

  const dipilih = useMemo(
    () => jadwalBulan.filter(j => j.bisaDipilih && bulanTerpilih[keyBulan(j.monthIdx, j.calYear)]),
    [jadwalBulan, bulanTerpilih]
  );
  const totalNominal = dipilih.reduce((s, j) => s + j.sisa, 0);
  const jumlahBaruTerbit = dipilih.filter(j => !j.ada).length;

  function handleGantiMetode(m) {
    setMetode(m);
    setAkunPenerima(SARAN_AKUN_PER_METODE[m] || 'Kas');
  }

  async function simpan() {
    if (!selectedSiswa) { toast('Pilih siswa dulu.', 'error'); return; }
    if (dipilih.length === 0) { toast('Pilih minimal 1 bulan yang mau dibayar.', 'error'); return; }
    if (!tanggalBayar) { toast('Isi tanggal bayar.', 'error'); return; }
    const belumAdaTagihan = dipilih.filter(j => !j.ada);
    if (belumAdaTagihan.length > 0 && !tarifSiswa) { toast('Tarif SPP untuk kelas siswa ini belum diatur. Lengkapi dulu di tab Tarif.', 'error'); return; }

    setSaving(true);
    setPhase('saving');
    try {
      // 1) Bulan yg BELUM py tagihan diterbitkan dulu -- HANYA utk siswa ini, tidak
      // menyentuh siswa lain sama sekali (beda dgn Jadwal Penerbitan SPP bulanan).
      const tagihanBaruByKey = {};
      if (belumAdaTagihan.length > 0) {
        const rows = belumAdaTagihan.map(j => ({
          NISN: selectedSiswa.nisn,
          'Nama Siswa': selectedSiswa.nama,
          'Tahun Ajaran': tahunAjaranAktif.label,
          Bulan: j.bulanLabel,
          'Tahun Kalender': j.calYear,
          Nominal: j.nominal,
          'Jatuh Tempo': `10/${j.monthIdx + 1}/${j.calYear}`,
          Keterangan: j.potongan ? `Potongan Beasiswa: ${j.potongan.nama} (${formatRupiah(j.potongan.potonganSpp)})` : '',
        }));
        await bulkAddTagihanSppToSheet(rows);
        // bulkAdd TIDAK mengembalikan "No" yg baru dialokasikan -- baca ulang mentah
        // dari Sheet lalu cocokkan by NISN+Bulan+Tahun Kalender (dijamin unik utk
        // siswa ini, itulah definisi "belum ditagih") utk tahu RefNo tagihan barunya.
        const rawTerbaru = await fetchTagihanSppFromSheet();
        belumAdaTagihan.forEach(j => {
          const found = rawTerbaru.find(r =>
            String(r['NISN'] ?? '').trim() === selectedSiswa.nisn &&
            r['Bulan'] === j.bulanLabel &&
            Number(r['Tahun Kalender']) === j.calYear &&
            String(r['Tahun Ajaran'] ?? '').trim() === tahunAjaranAktif.label
          );
          if (found) tagihanBaruByKey[keyBulan(j.monthIdx, j.calYear)] = found['No'];
        });
      }

      // 2) Catat pembayaran utk semua bulan terpilih -- baik yg tagihannya sudah
      // lama ada maupun yg baru saja diterbitkan di langkah 1.
      const rowsBayar = dipilih
        .map(j => {
          const refNo = j.ada ? j.no : tagihanBaruByKey[keyBulan(j.monthIdx, j.calYear)];
          return {
            RefType: 'SPP',
            RefNo: refNo,
            NISN: selectedSiswa.nisn,
            'Nama Siswa': selectedSiswa.nama,
            Jenis: `SPP ${j.bulanLabel} ${j.calYear}`,
            Nominal: j.sisa,
            'Tanggal Bayar': tanggalBayar,
            Metode: metode,
            Akun: akunPenerima,
            Keterangan: `Bayar SPP Sekaligus (${dipilih.length} bulan)${j.potongan ? ` — Potongan Beasiswa: ${j.potongan.nama}` : ''}`,
          };
        })
        .filter(r => r.RefNo && r.Nominal > 0);

      if (rowsBayar.length > 0) await bulkAddPembayaranToSheet(rowsBayar);

      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Catat Pembayaran',
        modul: 'Pembayaran & Invoice',
        detail: `Bayar SPP Sekaligus ${dipilih.length} bulan (${dipilih.map(j => `${j.bulanLabel} ${j.calYear}`).join(', ')}) sebesar ${formatRupiah(totalNominal)} dari ${selectedSiswa.nama}${jumlahBaruTerbit > 0 ? ` — ${jumlahBaruTerbit} bulan otomatis diterbitkan lebih dulu` : ''}`,
      });

      setPhase('done');
      await new Promise(r => setTimeout(r, 1100));
      setBulanTerpilih({});
      setSampaiBulanKey('');
      setSelectedSiswaId(null);
      setTerm('');
      await Promise.all([refreshTagihanSpp(), refreshPembayaran()]);
      toast(`Pembayaran ${dipilih.length} bulan SPP untuk ${selectedSiswa.nama} berhasil disimpan.`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
      setPhase(null);
    }
  }

  const dataSiap = tagihanSppLoaded && pembayaranLoaded;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>🗓️ Bayar SPP Beberapa Bulan Sekaligus</h3>
            <p>Untuk siswa yang membayar SPP di muka / rapel — walau tagihan bulan-bulan berikutnya belum diterbitkan admin.</p>
          </div>
        </div>
        <div className="card-body">
          {!tahunAjaranAktif && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Belum ada Tahun Ajaran Aktif.</p>}
          {tahunAjaranAktif && (
            <>
              <div style={{ maxWidth: 420, marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Cari Siswa</label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nama atau NISN..."
                  value={term}
                  onChange={e => { setTerm(e.target.value); setSelectedSiswaId(null); setBulanTerpilih({}); }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--green-soft)', border: '1px solid #BFE3CB', borderRadius: 10, marginBottom: 18 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarColor(selectedSiswa.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initials(selectedSiswa.nama)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{selectedSiswa.nama}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      NISN {selectedSiswa.nisn || '-'} · Kelas {selectedSiswa.kelasTingkat || '-'}{selectedSiswa.rombel ? ` — Rombel ${selectedSiswa.rombel}` : ''} · Tarif SPP: {tarifSiswa ? `${formatRupiah(tarifSiswa.nominal)}/bulan` : <span style={{ color: 'var(--red)' }}>belum diatur</span>}
                    </div>
                  </div>
                </div>
              )}

              {selectedSiswa && !dataSiap && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Memuat data tagihan &amp; pembayaran...</p>}

              {selectedSiswa && dataSiap && (
                <>
                  {!tarifSiswa && (
                    <p style={{ fontSize: 12.5, color: 'var(--red)', marginBottom: 12 }}>
                      ⚠️ Tarif SPP untuk Kelas {selectedSiswa.kelasTingkat} belum diatur — bulan yang "Belum Ditagih" tidak bisa dipilih sampai tarifnya dilengkapi di tab Tarif.
                    </p>
                  )}

                  <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#F6F8F5', borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--muted)' }}>⚡ Pilih Cepat:</span>
                    <span style={{ fontSize: 13 }}>Bayar sampai bulan</span>
                    <select value={sampaiBulanKey} onChange={e => setSampaiBulanKey(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
                      <option value="">— pilih bulan —</option>
                      {jadwalBulan.map(j => (
                        <option key={keyBulan(j.monthIdx, j.calYear)} value={keyBulan(j.monthIdx, j.calYear)}>{j.bulanLabel} {j.calYear}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-sm" onClick={terapkanSampaiBulan} disabled={!sampaiBulanKey}>Terapkan ke Tabel ↓</button>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead><tr><th style={{ width: 36 }}></th><th>Bulan</th><th>Status Saat Ini</th><th style={{ textAlign: 'right' }}>Nominal</th></tr></thead>
                      <tbody>
                        {jadwalBulan.map(j => {
                          const k = keyBulan(j.monthIdx, j.calYear);
                          const info = STATUS_INFO[j.status];
                          return (
                            <tr key={k} style={!j.bisaDipilih ? { color: 'var(--muted)' } : undefined}>
                              <td style={{ textAlign: 'center' }}>
                                <input type="checkbox" style={{ width: 16, height: 16 }} checked={!!bulanTerpilih[k]} disabled={!j.bisaDipilih} onChange={() => toggleBulan(j)} />
                              </td>
                              <td>{j.bulanLabel} {j.calYear}</td>
                              <td><span className={`badge ${info.badge}`}>{info.label}</span></td>
                              <td style={{ textAlign: 'right', fontWeight: bulanTerpilih[k] ? 700 : 400 }}>{formatRupiah(j.sisa)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {jumlahBaruTerbit > 0 && (
                    <div style={{ display: 'flex', gap: 10, background: 'var(--purple-soft)', border: '1px solid #D8C9EE', borderRadius: 9, padding: '13px 16px', fontSize: 12.5, color: 'var(--purple-dark)', lineHeight: 1.55, margin: '16px 0' }}>
                      <span>ℹ️</span>
                      <span>{jumlahBaruTerbit} bulan yang dipilih belum ada tagihannya — akan diterbitkan otomatis sesuai tarif SPP kelas ini, khusus untuk <strong>{selectedSiswa.nama}</strong> saja (siswa lain tidak ikut ditagih), lalu langsung ditandai lunas dalam transaksi ini.</span>
                    </div>
                  )}

                  <div className="info-grid" style={{ margin: '16px 0' }}>
                    <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--green-dark)' }}>{dipilih.length}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>BULAN DIPILIH</div>
                    </div>
                    <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(totalNominal)}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>TOTAL DIBAYAR</div>
                    </div>
                    <div style={{ padding: '10px 20px', background: '#F6F8F5', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--green-dark)' }}>{jumlahBaruTerbit}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>TAGIHAN BARU DITERBITKAN</div>
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginBottom: 18 }}>
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

                  <button className="btn btn-primary" style={{ width: '100%', padding: '14px 20px', fontSize: 14.5 }} onClick={simpan} disabled={saving || dipilih.length === 0}>
                    💾 Simpan Pembayaran — {dipilih.length} Bulan ({formatRupiah(totalNominal)})
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {phase && <SaveProgressModal phase={phase} />}
    </>
  );
}
