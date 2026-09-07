import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { AKUN_BAWAAN, AKUN_FIELDS, AKUN_HEADERS, emptyAkunRow } from '../../db/akunBukuBesarFields';
import { addAkunToSheet, updateAkunInSheet, deleteAkunFromSheet, fetchAkunFromSheet } from '../../services/googleSheets';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { formatRupiah, formatTanggalTampil, parseTanggalFleksibel } from '../../db/helpers';

export default function BukuBesarTab() {
  const { akun, pembayaran, pemasukanLain, pengeluaran, refreshAkun } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [kelolaOpen, setKelolaOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [akunDipilih, setAkunDipilih] = useState('BAWAAN-kas');

  const semuaAkun = useMemo(() => [...AKUN_BAWAAN, ...akun], [akun]);
  const akunAktif = semuaAkun.find(a => a.id === akunDipilih) || semuaAkun[0];

  const mutasi = useMemo(() => {
    if (!akunAktif) return [];
    const asli = pembayaranAsli(pembayaran);
    let items = [];

    if (akunAktif.id === 'BAWAAN-kas') {
      // PENTING: filter berdasarkan field "Akun" SUNGGUHAN yg dipilih user per transaksi --
      // BUKAN asumsi semua transaksi otomatis masuk Kas. Data lama (sebelum fitur ini ada,
      // field "akun" masih kosong) tetap dianggap Kas sbg fallback wajar (itulah asumsi
      // default sebelumnya), tapi transaksi yg SUDAH ditandai akun lain (mis. "Bank BCA")
      // TIDAK ikut masuk sini lagi -- inilah yg mencegah selisih antar akun kas/bank.
      items = [
        ...asli.filter(p => !p.akun || p.akun === 'Kas').map(p => ({ tanggal: p.tanggalBayar, ket: `Pembayaran ${p.jenis} — ${p.namaSiswa}`, debit: p.nominal, kredit: 0 })),
        ...pemasukanLain.filter(p => !p.akun || p.akun === 'Kas').map(p => ({ tanggal: p.tanggal, ket: `${p.kategori} — ${p.keterangan}`, debit: p.nominal, kredit: 0 })),
        ...pengeluaran.filter(p => !p.akun || p.akun === 'Kas').map(p => ({ tanggal: p.tanggal, ket: `${p.kategori} — ${p.keterangan}`, debit: 0, kredit: p.nominal })),
      ];
    } else if (akunAktif.jenis === 'Aktiva' && !akunAktif.bawaan) {
      // Akun kas/bank CUSTOM (mis. "Bank BCA") -- HANYA transaksi yg eksplisit ditandai
      // ke akun ini yg muncul, karena akun ini tidak "bawaan" jadi tidak ada fallback.
      items = [
        ...asli.filter(p => p.akun === akunAktif.nama).map(p => ({ tanggal: p.tanggalBayar, ket: `Pembayaran ${p.jenis} — ${p.namaSiswa}`, debit: p.nominal, kredit: 0 })),
        ...pemasukanLain.filter(p => p.akun === akunAktif.nama).map(p => ({ tanggal: p.tanggal, ket: `${p.kategori} — ${p.keterangan}`, debit: p.nominal, kredit: 0 })),
        ...pengeluaran.filter(p => p.akun === akunAktif.nama).map(p => ({ tanggal: p.tanggal, ket: `${p.kategori} — ${p.keterangan}`, debit: 0, kredit: p.nominal })),
      ];
    } else if (akunAktif.id === 'BAWAAN-piutang') {
      items = asli.map(p => ({ tanggal: p.tanggalBayar, ket: `Pembayaran ${p.jenis} — ${p.namaSiswa} (mengurangi piutang)`, debit: 0, kredit: p.nominal }));
    } else if (akunAktif.id === 'BAWAAN-pend-spp') {
      items = asli.filter(p => p.refType === 'SPP').map(p => ({ tanggal: p.tanggalBayar, ket: `${p.jenis} — ${p.namaSiswa}`, debit: 0, kredit: p.nominal }));
    } else if (akunAktif.id === 'BAWAAN-pend-lain-siswa') {
      items = asli.filter(p => p.refType === 'LAIN').map(p => ({ tanggal: p.tanggalBayar, ket: `${p.jenis} — ${p.namaSiswa}`, debit: 0, kredit: p.nominal }));
    } else if (akunAktif.id === 'BAWAAN-pend-nonsiswa') {
      items = pemasukanLain.map(p => ({ tanggal: p.tanggal, ket: `${p.kategori} — ${p.keterangan}`, debit: 0, kredit: p.nominal }));
    } else if (akunAktif.kategoriPengeluaran) {
      items = pengeluaran.filter(p => p.kategori === akunAktif.kategoriPengeluaran).map(p => ({ tanggal: p.tanggal, ket: p.keterangan, debit: p.nominal, kredit: 0 }));
    }
    // Akun custom yg ditambah user sendiri: belum ada transaksi otomatis yg cocok ke sini
    // (krn form Pemasukan/Pengeluaran belum punya field "Akun" -- lihat catatan di UI).

    items.sort((a, b) => (parseTanggalFleksibel(a.tanggal)?.getTime() || 0) - (parseTanggalFleksibel(b.tanggal)?.getTime() || 0));
    let saldo = 0;
    return items.map(it => {
      const delta = akunAktif.saldoNormal === 'Kredit' ? (it.kredit - it.debit) : (it.debit - it.kredit);
      saldo += delta;
      return { ...it, saldo };
    });
  }, [akunAktif, pembayaran, pemasukanLain, pengeluaran]);

  const totalDebit = mutasi.reduce((s, m) => s + m.debit, 0);
  const totalKredit = mutasi.reduce((s, m) => s + m.kredit, 0);
  const saldoAkhir = mutasi.length > 0 ? mutasi[mutasi.length - 1].saldo : 0;

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>📒 Buku Besar</h3><p>Pilih akun untuk melihat mutasi (riwayat debit/kredit) dan saldo berjalannya.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setKelolaOpen(o => !o)}>{kelolaOpen ? '📕 Tutup Daftar Akun' : '📖 Kelola Daftar Akun'}</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Akun Baru</button>
        </div>
      </div>
      <div className="card-body">
        <div className="card" style={{ background: 'var(--gold-soft)', marginBottom: 18 }}>
          <div className="card-body" style={{ fontSize: 12.5, color: '#8a5b00' }}>
            Setiap kali mencatat Pembayaran/Pemasukan Lain/Pengeluaran, Anda memilih akun kas/bank mana yang sungguhan
            menerima/mengeluarkan uangnya (tidak otomatis diasumsikan "Kas" semua) — supaya saldo tiap akun akurat dan
            tidak ada selisih antar akun kas/bank. Akun Pendapatan &amp; Beban tetap otomatis terisi sesuai kategori
            transaksi. Data yang dicatat SEBELUM fitur pemilihan akun ini ada, dianggap masuk akun "Kas" sebagai fallback.
          </div>
        </div>

        {kelolaOpen && (
          <div style={{ marginBottom: 20 }}>
            <GenericStoredTable
              title="Daftar Akun (Custom)"
              subtitle="Akun tambahan yang Anda buat sendiri, di luar akun standar bawaan."
              headers={AKUN_HEADERS}
              fields={AKUN_FIELDS}
              fetchFn={fetchAkunFromSheet}
              updateFn={updateAkunInSheet}
              deleteFn={deleteAkunFromSheet}
              moduleLabel="Akun Buku Besar"
              labelKey="Nama Akun"
              searchFn={(r, t) => (r['Nama Akun'] || '').toLowerCase().includes(t) || (r['Kode Akun'] || '').toLowerCase().includes(t)}
              onChanged={refreshAkun}
              refreshSignal={refreshSignal}
              target="keuangan"
            />
          </div>
        )}

        <div style={{ maxWidth: 420, marginBottom: 18 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Pilih Akun</label>
          <select value={akunDipilih} onChange={e => setAkunDipilih(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
            <optgroup label="Akun Standar">
              {AKUN_BAWAAN.map(a => <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>)}
            </optgroup>
            {akun.length > 0 && (
              <optgroup label="Akun Custom">
                {akun.map(a => <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>)}
              </optgroup>
            )}
          </select>
        </div>

        {akunAktif && (
          <>
            <div className="info-grid" style={{ marginBottom: 18 }}>
              <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Debit</div><div style={{ fontWeight: 800 }}>{formatRupiah(totalDebit)}</div></div>
              <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Kredit</div><div style={{ fontWeight: 800 }}>{formatRupiah(totalKredit)}</div></div>
              <div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Saldo Akhir ({akunAktif.saldoNormal})</div><div style={{ fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(saldoAkhir)}</div></div>
            </div>

            <div className="table-scroll">
              <table>
                <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr></thead>
                <tbody>
                  {mutasi.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>Belum ada mutasi untuk akun ini.</td></tr>
                  )}
                  {mutasi.map((m, i) => (
                    <tr key={i}>
                      <td>{formatTanggalTampil(m.tanggal)}</td>
                      <td>{m.ket}</td>
                      <td>{m.debit > 0 ? formatRupiah(m.debit) : '-'}</td>
                      <td>{m.kredit > 0 ? formatRupiah(m.kredit) : '-'}</td>
                      <td style={{ fontWeight: 700 }}>{formatRupiah(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <Modal title="Tambah Akun Buku Besar Baru" onClose={() => setModalOpen(false)}>
          <GenericManualForm
            fields={AKUN_FIELDS}
            emptyRow={emptyAkunRow}
            addFn={addAkunToSheet}
            onSaved={() => { refreshAkun(); setRefreshSignal(s => s + 1); setModalOpen(false); }}
            title="Tambah Akun Buku Besar Baru"
            subtitle="Data langsung tersimpan ke Google Sheets Keuangan."
            target="keuangan"
            bare
          />
        </Modal>
      )}
    </div>
  );
}
