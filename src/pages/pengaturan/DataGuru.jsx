import { useState } from 'react';
import Page from '../../components/layout/Page';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { GURU_FIELDS, GURU_HEADERS, emptyGuruRow } from '../../db/guruFields';
import { fetchGuruFromSheet, addGuruToSheet, updateGuruInSheet, deleteGuruFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function DataGuru() {
  const { guru, refreshGuru } = useAppData();
  const [tab, setTab] = useState('tabel');

  return (
    <Page pageId="guru" title="Data Guru & Staff" path="Pengaturan / Modul / Data Guru & Staff">
      {guru.length > 0 && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ padding: '10px 20px', background: 'var(--blue-soft)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>{guru.length}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Total Guru &amp; Staff</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>
              {guru.filter(g => g.status === 'Aktif').length}
              <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>Aktif</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>📋 DATA GURU (TABEL)</button>
          <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>📝 TAMBAH MANUAL</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'tabel' && (
            <GenericStoredTable
              title="Data Guru & Staff (Tabel)"
              subtitle="Diambil langsung dari Google Sheets — bisa diubah atau dihapus dari sini."
              headers={GURU_HEADERS}
              fields={GURU_FIELDS}
              fetchFn={fetchGuruFromSheet}
              updateFn={updateGuruInSheet}
              deleteFn={deleteGuruFromSheet}
              moduleLabel="Data Guru & Staff"
              labelKey="Nama Lengkap"
              searchFn={(r, t) => (r['Nama Lengkap'] || '').toLowerCase().includes(t) || (r['Jabatan'] || '').toLowerCase().includes(t)}
              onChanged={refreshGuru}
            />
          )}
          {tab === 'manual' && (
            <GenericManualForm
              fields={GURU_FIELDS}
              emptyRow={emptyGuruRow}
              addFn={addGuruToSheet}
              onSaved={refreshGuru}
              title="Tambah Guru / Staff"
              subtitle="Data langsung tersimpan ke baris baru di Google Sheets."
            />
          )}
        </div>
      </div>
    </Page>
  );
}
