import { useState } from 'react';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import Modal from '../../components/common/Modal';
import { PENGELUARAN_FIELDS, PENGELUARAN_HEADERS, emptyPengeluaranRow } from '../../db/pengeluaranFields';
import { fetchPengeluaranFromSheet, addPengeluaranToSheet, updatePengeluaranInSheet, deletePengeluaranFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function JurnalPengeluaranTab() {
  const { refreshPengeluaran } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

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
        refreshSignal={refreshSignal}
        target="keuangan"
        headExtra={<button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Baru</button>}
      />
      {modalOpen && (
        <Modal title="Catat Pengeluaran Baru" onClose={() => setModalOpen(false)}>
          <GenericManualForm
            fields={PENGELUARAN_FIELDS}
            emptyRow={emptyPengeluaranRow}
            addFn={addPengeluaranToSheet}
            onSaved={() => { refreshPengeluaran(); setRefreshSignal(s => s + 1); setModalOpen(false); }}
            title="Catat Pengeluaran Baru"
            subtitle="Data langsung tersimpan ke Google Sheets Keuangan."
            target="keuangan"
            bare
          />
        </Modal>
      )}
    </>
  );
}
