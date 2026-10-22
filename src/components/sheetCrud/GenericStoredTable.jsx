import { useEffect, useState, useCallback, useId } from 'react';
import DataTable from '../common/DataTable';
import PasswordConfirmModal from '../common/PasswordConfirmModal';
import GenericEditModal from './GenericEditModal';
import { addLogEntry, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, printElementById } from '../../utils/exportTable';
import { formatTanggalTampil, normalisasiTanggalUntukInput, formatRupiah } from '../../db/helpers';

const ICON_EDIT = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const ICON_DELETE = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
);

export default function GenericStoredTable({
  title, subtitle, headers, fields, fetchFn, updateFn, deleteFn,
  moduleLabel, labelKey, searchFn, onChanged, extraActions, refreshSignal, target = 'master',
  columnRenderers, headExtra, defaultSortKey, defaultSortDir = 'asc',
}) {
  const { toast } = useAppData();
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [printingAll, setPrintingAll] = useState(false);
  const printId = 'print-' + useId().replace(/:/g, '');

  function handlePrint() {
    // Nyalakan forceShowAll dulu (lewati paginasi), TUNGGU React selesai render ulang
    // dgn semua baris, baru panggil print -- kalau langsung print, yg tercetak cuma
    // halaman yg sedang tampil di layar.
    setPrintingAll(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        printElementById(printId);
        setPrintingAll(false);
      });
    });
  }

  const load = useCallback(async () => {
    if (!isConfigured(target)) return;
    setLoading(true);
    try {
      const dataMentah = await fetchFn();
      // Jaring pengaman -- kalau karena sebab apa pun (jaringan lambat, dobel-klik
      // simpan, dll) ada baris dgn "No" sama persis kebawa dobel dari Sheets, buang
      // yg duplikat di sini. "No" semestinya unik krn berasal dari nomor baris asli
      // di Sheet, jadi aman dipakai sbg kunci dedup.
      const dataUnik = Array.from(new Map(dataMentah.map(r => [r['No'], r])).values());
      // Urutan defaultnya APA ADANYA dari Sheets (urutan baris ditambahkan), KECUALI
      // pemanggil minta diurutkan (mis. Jurnal Pengeluaran diurutkan per Tanggal) --
      // lihat prop defaultSortKey.
      const data = defaultSortKey
        ? [...dataUnik].sort((a, b) => {
            const fieldDef = fields.find(f => f.key === defaultSortKey);
            // Field bertipe tanggal: bandingkan versi ternormalisasi (yyyy-MM-dd)
            // supaya urutannya benar2 kronologis, bukan asal urut teks mentahnya
            // (data tanggal dari Sheets bisa berupa ISO+jam "2026-07-19T17:00:00.000Z").
            const av = String(a[defaultSortKey] ?? '');
            const bv = String(b[defaultSortKey] ?? '');
            const an = fieldDef?.type === 'date' ? normalisasiTanggalUntukInput(av) : av;
            const bn = fieldDef?.type === 'date' ? normalisasiTanggalUntukInput(bv) : bv;
            if (an < bn) return defaultSortDir === 'asc' ? -1 : 1;
            if (an > bn) return defaultSortDir === 'asc' ? 1 : -1;
            return 0;
          })
        : dataUnik;
      setRows(data);
      setLoaded(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, fetchFn, defaultSortKey, defaultSortDir, fields]);

  useEffect(() => { load(); }, [load, refreshSignal]);

  async function doDelete() {
    try {
      await deleteFn(deleteRow['No']);
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Hapus Data',
        modul: moduleLabel,
        detail: `Menghapus data "${deleteRow[labelKey]}" (No. ${deleteRow['No']})`,
      });
      toast('Data berhasil dihapus.');
      setDeleteRow(null);
      load();
      onChanged && onChanged();
    } catch (err) {
      toast(err.message, 'error');
      throw err;
    }
  }

  const columns = [
    ...headers.filter(h => h !== 'No').map(h => {
      if (columnRenderers && columnRenderers[h]) return { key: h, label: h, render: columnRenderers[h] };
      // Kolom bertipe tanggal (field.type === 'date') OTOMATIS diformat dd-mm-yyyy
      // di sini -- tanpa ini, tabel nampilin string mentah dari Sheets apa adanya
      // (mis. "2026-07-19T17:00:00.000Z"), krn GenericStoredTable dipakai banyak
      // halaman & sebelumnya tidak ada satu pun yg format kolom tanggalnya sendiri.
      const fieldDef = fields.find(f => f.key === h);
      if (fieldDef?.type === 'date') return { key: h, label: h, accessor: (r) => formatTanggalTampil(r[h]) };
      // Kolom bertipe uang (field.type === 'currency') OTOMATIS diformat "Rp 250.000"
      // (pakai titik pemisah ribuan) -- sebelumnya nilai mentah tampil polos tanpa
      // pemisah sama sekali (mis. "250000"), beda sendiri dari tabel lain di app yg
      // sudah pakai formatRupiah().
      if (fieldDef?.type === 'currency') return { key: h, label: h, accessor: (r) => (r[h] === '' || r[h] === undefined || r[h] === null) ? '' : formatRupiah(r[h]) };
      // Kolom bertipe pilihan (field.type === 'select', mis. Kategori/Status/Jenis)
      // OTOMATIS dapat filter per-kolom berbentuk DROPDOWN (bukan kotak teks bebas) --
      // isinya langsung dari daftar pilihan field itu sendiri (fieldDef.options), jadi
      // selalu sinkron dgn pilihan yg ada di form Tambah/Edit, tidak perlu didaftar ulang.
      if (fieldDef?.type === 'select' && fieldDef.options) return { key: h, label: h, accessor: (r) => r[h], filterType: 'select', filterOptions: fieldDef.options };
      return { key: h, label: h, accessor: (r) => r[h] };
    }),
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'no-print',
      filterable: false,
      render: (r) => (
        <div className="no-print" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {extraActions && extraActions(r)}
          <button className="btn-icon" title="Edit" onClick={() => setEditRow(r)}>{ICON_EDIT}</button>
          <button className="btn-icon danger" title="Hapus" onClick={() => setDeleteRow(r)}>{ICON_DELETE}</button>
        </div>
      ),
    },
  ];

  // Kolom tanggal PERTAMA yg ditemukan di `fields` dipakai otomatis utk filter
  // rentang "Dari/Sampai" di atas tabel -- kalau modul ini tidak py field bertipe
  // 'date' sama sekali (mis. Data Guru, Data Kelas, Akun), filternya otomatis tidak
  // ditampilkan (lihat prop dateFilterKey di DataTable.jsx).
  const fieldTanggalUtama = fields.find(f => f.type === 'date');

  const exportHeaders = headers.filter(h => h !== 'No');
  // Versi rows KHUSUS utk export Excel -- kolom tanggal diformat dulu (dd-mm-yyyy)
  // spy file-nya juga rapi, bukan nampilin string ISO mentah dari Sheets (sebelumnya
  // export selalu ambil rows["Tanggal"] apa adanya, lepas dari format tampilan tabel).
  const rowsUntukExport = rows.map(r => {
    const hasil = { ...r };
    fields.forEach(f => {
      if (hasil[f.key] === undefined) return;
      if (f.type === 'date') hasil[f.key] = formatTanggalTampil(hasil[f.key]);
      // Kolom uang juga diformat sama persis dgn yg tampil di tabel ("Rp 250.000")
      // supaya file Excel-nya rapi juga, bukan cuma angka mentah tanpa pemisah ribuan.
      else if (f.type === 'currency' && hasil[f.key] !== '') hasil[f.key] = formatRupiah(hasil[f.key]);
    });
    return hasil;
  });

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {headExtra}
          <button className="btn btn-sm" onClick={() => exportToExcel(exportHeaders, rowsUntukExport, moduleLabel, moduleLabel)} disabled={rows.length === 0}>📊 Excel</button>
          <button className="btn btn-sm" onClick={handlePrint} disabled={rows.length === 0}>🖨️ PDF</button>
          <button className="btn btn-sm" onClick={load} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
      </div>
      <div className="card-body" id={printId}>
        {!isConfigured(target) && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Atur koneksi Google Sheets dulu untuk melihat data.</p>}
        {isConfigured(target) && loaded && (
          <DataTable
            columns={columns}
            data={rows}
            searchFn={searchFn}
            emptyMessage="Belum ada data tersimpan."
            rowKey={(r, i) => r['No'] ?? i}
            forceShowAll={printingAll}
            dateFilterKey={fieldTanggalUtama?.key}
            dateFilterLabel={fieldTanggalUtama?.label}
          />
        )}
      </div>

      {editRow && (
        <GenericEditModal
          row={editRow}
          fields={fields}
          updateFn={updateFn}
          moduleLabel={moduleLabel}
          labelKey={labelKey}
          onClose={() => setEditRow(null)}
          onSaved={() => { load(); onChanged && onChanged(); }}
        />
      )}

      {deleteRow && (
        <PasswordConfirmModal
          title="Konfirmasi Hapus Data"
          message={`Anda akan menghapus data "${deleteRow[labelKey]}". Tindakan ini tidak bisa dibatalkan.`}
          danger
          onConfirm={doDelete}
          onClose={() => setDeleteRow(null)}
        />
      )}
    </div>
  );
}
