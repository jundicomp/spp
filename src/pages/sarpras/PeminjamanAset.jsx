import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { buildPeminjamanFields, PEMINJAMAN_HEADERS, emptyPeminjamanRow } from '../../db/peminjamanFields';
import { fetchPeminjamanFromSheet, addPeminjamanToSheet, updatePeminjamanInSheet, deletePeminjamanFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function PeminjamanAset() {
  const { aset } = useAppData();
  const [tab, setTab] = useState('tabel');
  const [refreshKey, setRefreshKey] = useState(0);

  const asetOptions = useMemo(() => aset.map(a => a.nama).sort(), [aset]);
  const fields = useMemo(() => buildPeminjamanFields(asetOptions), [asetOptions]);

  return (
    <Page pageId="peminjaman-aset" title="Peminjaman Aset" path="Sarpras / Peminjaman Aset">
      {aset.length === 0 && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Pilihan Nama Aset akan muncul begitu ada data di Data Aset &amp; Inventaris.
        </div></div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>DAFTAR PEMINJAMAN</button>
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>CATAT PEMINJAMAN</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'tabel' && (
            <GenericStoredTable
              title="Daftar Peminjaman Aset"
              subtitle="Ubah Status dan isi Tanggal Dikembalikan saat aset kembali."
              headers={PEMINJAMAN_HEADERS}
              fields={fields}
              fetchFn={fetchPeminjamanFromSheet}
              updateFn={updatePeminjamanInSheet}
              deleteFn={deletePeminjamanFromSheet}
              moduleLabel="Peminjaman Aset"
              labelKey="Nama Aset"
              searchFn={(r, t) => (r['Nama Aset'] || '').toLowerCase().includes(t) || (r['Peminjam'] || '').toLowerCase().includes(t)}
              onChanged={() => setRefreshKey(k => k + 1)}
            />
          )}
          {tab === 'manual' && (
            <GenericManualForm
              fields={fields}
              emptyRow={emptyPeminjamanRow}
              addFn={addPeminjamanToSheet}
              onSaved={() => setRefreshKey(k => k + 1)}
              title="Catat Peminjaman Baru"
              subtitle="Data langsung tersimpan ke baris baru di Google Sheets."
            />
          )}
        </div>
      </div>
    </Page>
  );
}
