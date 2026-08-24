import { useMemo } from 'react';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { buildTarifFields, TARIF_HEADERS, emptyTarifRow } from '../../db/tarifFields';
import { fetchTarifFromSheet, addTarifToSheet, updateTarifInSheet, deleteTarifFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function TarifTab() {
  const { tahunAjaran, refreshTarif } = useAppData();
  const tahunAjaranOptions = useMemo(() => tahunAjaran.map(t => t.label), [tahunAjaran]);
  const fields = useMemo(() => buildTarifFields(tahunAjaranOptions), [tahunAjaranOptions]);

  return (
    <>
      {tahunAjaranOptions.length === 0 && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum ada Tahun Ajaran. Tambahkan dulu lewat menu <strong>Profil Sekolah &amp; Tahun Ajaran</strong>.
        </div></div>
      )}
      <GenericStoredTable
        title="Daftar Tarif"
        subtitle="SPP bulanan & biaya lain per tahun ajaran."
        headers={TARIF_HEADERS}
        fields={fields}
        fetchFn={fetchTarifFromSheet}
        updateFn={updateTarifInSheet}
        deleteFn={deleteTarifFromSheet}
        moduleLabel="Tarif SPP & Biaya"
        labelKey="Jenis"
        searchFn={(r, t) => (r['Jenis'] || '').toLowerCase().includes(t) || (r['Tahun Ajaran'] || '').toLowerCase().includes(t)}
        onChanged={refreshTarif}
        target="keuangan"
      />
      <GenericManualForm
        fields={fields}
        emptyRow={emptyTarifRow}
        addFn={addTarifToSheet}
        onSaved={refreshTarif}
        title="Tambah Tarif"
        subtitle="Data langsung tersimpan ke Google Sheets Keuangan."
        target="keuangan"
      />
    </>
  );
}
