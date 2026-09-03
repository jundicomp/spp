import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { PENGELUARAN_FIELDS, PENGELUARAN_HEADERS, emptyPengeluaranRow } from '../../db/pengeluaranFields';
import { fetchPengeluaranFromSheet, addPengeluaranToSheet, updatePengeluaranInSheet, deletePengeluaranFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function JurnalPengeluaranTab() {
  const { refreshPengeluaran } = useAppData();

  return (
    <>
      <GenericStoredTable
        title="Jurnal Pengeluaran"
        subtitle="Semua pengeluaran operasional sekolah — gaji, listrik, ATK, dst."
        headers={PENGELUARAN_HEADERS}
        fields={PENGELUARAN_FIELDS}
        fetchFn={fetchPengeluaranFromSheet}
        updateFn={updatePengeluaranInSheet}
        deleteFn={deletePengeluaranFromSheet}
        moduleLabel="Jurnal Pengeluaran"
        labelKey="Keterangan"
        searchFn={(r, t) => (r['Keterangan'] || '').toLowerCase().includes(t) || (r['Kategori'] || '').toLowerCase().includes(t)}
        onChanged={refreshPengeluaran}
        target="keuangan"
      />
      <GenericManualForm
        fields={PENGELUARAN_FIELDS}
        emptyRow={emptyPengeluaranRow}
        addFn={addPengeluaranToSheet}
        onSaved={refreshPengeluaran}
        title="Catat Pengeluaran Baru"
        subtitle="Data langsung tersimpan ke Google Sheets Keuangan."
        target="keuangan"
      />
    </>
  );
}
