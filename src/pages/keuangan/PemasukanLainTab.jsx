import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { PEMASUKAN_LAIN_FIELDS, PEMASUKAN_LAIN_HEADERS, emptyPemasukanLainRow } from '../../db/pemasukanLainFields';
import { fetchPemasukanLainFromSheet, addPemasukanLainToSheet, updatePemasukanLainInSheet, deletePemasukanLainFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function PemasukanLainTab() {
  const { refreshPemasukanLain } = useAppData();

  return (
    <>
      <GenericStoredTable
        title="Pemasukan Lain"
        subtitle="Sumber pemasukan sekolah di luar SPP dan biaya siswa -- donasi, bantuan pemerintah, sewa aset, dst."
        headers={PEMASUKAN_LAIN_HEADERS}
        fields={PEMASUKAN_LAIN_FIELDS}
        fetchFn={fetchPemasukanLainFromSheet}
        updateFn={updatePemasukanLainInSheet}
        deleteFn={deletePemasukanLainFromSheet}
        moduleLabel="Pemasukan Lain"
        labelKey="Keterangan"
        searchFn={(r, t) => (r['Keterangan'] || '').toLowerCase().includes(t) || (r['Kategori'] || '').toLowerCase().includes(t)}
        onChanged={refreshPemasukanLain}
        target="keuangan"
      />
      <GenericManualForm
        fields={PEMASUKAN_LAIN_FIELDS}
        emptyRow={emptyPemasukanLainRow}
        addFn={addPemasukanLainToSheet}
        onSaved={refreshPemasukanLain}
        title="Catat Pemasukan Lain Baru"
        subtitle="Data langsung tersimpan ke Google Sheets Keuangan."
        target="keuangan"
      />
    </>
  );
}
