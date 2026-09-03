import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { ASET_FIELDS, ASET_HEADERS, emptyAsetRow, KONDISI_ASET_OPTIONS } from '../../db/asetFields';
import { fetchAsetFromSheet, addAsetToSheet, updateAsetInSheet, deleteAsetFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function DataAset() {
  const { aset, refreshAset } = useAppData();
  const [tab, setTab] = useState('tabel');

  const ringkasan = useMemo(() => {
    const totalUnit = aset.reduce((s, a) => s + a.jumlah, 0);
    const perKondisi = {};
    KONDISI_ASET_OPTIONS.forEach(k => { perKondisi[k] = aset.filter(a => a.kondisi === k).reduce((s, a) => s + a.jumlah, 0); });
    return { totalJenis: aset.length, totalUnit, perKondisi };
  }, [aset]);

  return (
    <Page pageId="aset" title="Data Aset & Inventaris" path="Sarpras / Data Aset & Inventaris">
      {aset.length > 0 && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-green"><div className="info-value">{ringkasan.totalJenis}</div><div className="info-label">Jenis Aset Terdaftar</div></div>
          <div className="info-card c-blue"><div className="info-value">{ringkasan.totalUnit}</div><div className="info-label">Total Unit</div></div>
          <div className="info-card c-red"><div className="info-value">{ringkasan.perKondisi['Rusak Berat'] || 0}</div><div className="info-label">Unit Rusak Berat</div></div>
        </div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>📋 DATA ASET (TABEL)</button>
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>📝 TAMBAH MANUAL</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'tabel' && (
            <GenericStoredTable
              title="Data Aset & Inventaris (Tabel)"
              subtitle="Diambil langsung dari Google Sheets — bisa diubah atau dihapus dari sini."
              headers={ASET_HEADERS}
              fields={ASET_FIELDS}
              fetchFn={fetchAsetFromSheet}
              updateFn={updateAsetInSheet}
              deleteFn={deleteAsetFromSheet}
              moduleLabel="Data Aset & Inventaris"
              labelKey="Nama Aset"
              searchFn={(r, t) => (r['Nama Aset'] || '').toLowerCase().includes(t) || (r['Lokasi'] || '').toLowerCase().includes(t) || (r['Kategori'] || '').toLowerCase().includes(t)}
              onChanged={refreshAset}
            />
          )}
          {tab === 'manual' && (
            <GenericManualForm
              fields={ASET_FIELDS}
              emptyRow={emptyAsetRow}
              addFn={addAsetToSheet}
              onSaved={refreshAset}
              title="Tambah Aset"
              subtitle="Data langsung tersimpan ke baris baru di Google Sheets."
            />
          )}
        </div>
      </div>
    </Page>
  );
}
