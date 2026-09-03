import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { buildPemeliharaanFields, PEMELIHARAAN_HEADERS, emptyPemeliharaanRow } from '../../db/pemeliharaanFields';
import { fetchPemeliharaanFromSheet, addPemeliharaanToSheet, updatePemeliharaanInSheet, deletePemeliharaanFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function PemeliharaanAset() {
  const { aset } = useAppData();
  const [tab, setTab] = useState('tabel');

  const asetOptions = useMemo(() => aset.map(a => a.nama).sort(), [aset]);
  const fields = useMemo(() => buildPemeliharaanFields(asetOptions), [asetOptions]);

  return (
    <Page pageId="pemeliharaan-aset" title="Pemeliharaan Aset" path="Sarpras / Pemeliharaan Aset">
      {aset.length === 0 && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Pilihan Nama Aset akan muncul begitu ada data di Data Aset &amp; Inventaris.
        </div></div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>DAFTAR PEMELIHARAAN</button>
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>CATAT PEMELIHARAAN</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'tabel' && (
            <GenericStoredTable
              title="Daftar Pemeliharaan Aset"
              subtitle="Riwayat servis, perbaikan, dan penggantian part."
              headers={PEMELIHARAAN_HEADERS}
              fields={fields}
              fetchFn={fetchPemeliharaanFromSheet}
              updateFn={updatePemeliharaanInSheet}
              deleteFn={deletePemeliharaanFromSheet}
              moduleLabel="Pemeliharaan Aset"
              labelKey="Nama Aset"
              searchFn={(r, t) => (r['Nama Aset'] || '').toLowerCase().includes(t) || (r['Jenis Pemeliharaan'] || '').toLowerCase().includes(t)}
              onChanged={() => {}}
            />
          )}
          {tab === 'manual' && (
            <GenericManualForm
              fields={fields}
              emptyRow={emptyPemeliharaanRow}
              addFn={addPemeliharaanToSheet}
              onSaved={() => {}}
              title="Catat Pemeliharaan Baru"
              subtitle="Data langsung tersimpan ke baris baru di Google Sheets."
            />
          )}
        </div>
      </div>
    </Page>
  );
}
