import { useMemo, useState } from 'react';
import Page from '../../components/layout/Page';
import GenericManualForm from '../../components/sheetCrud/GenericManualForm';
import GenericStoredTable from '../../components/sheetCrud/GenericStoredTable';
import { GURU_HEADERS, buildGuruFields, emptyGuruRow } from '../../db/guruFields';
import { fetchGuruFromSheet, addGuruToSheet, updateGuruInSheet, deleteGuruFromSheet } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import { formatTanggalAngka } from '../../db/helpers';

const KOLOM_KHUSUS_GURU = ['Mata Pelajaran', 'Sertifikasi', 'Jumlah Jam Mengajar', 'TMT Mengajar'];
const KOLOM_TANGGAL = ['Tanggal Lahir', 'TMT Mengajar'];

function makeFetchByKategori(kategori) {
  return async () => {
    const rows = await fetchGuruFromSheet();
    // Data lama (sebelum kolom Kategori ada) dianggap "Guru" -- konsisten dgn normalizeSheetGuru.
    return rows.filter(r => (r['Kategori'] || 'Guru') === kategori);
  };
}

function KategoriPanel({ kategori, onChanged }) {
  const [tab, setTab] = useState('tabel');
  const fields = useMemo(() => buildGuruFields(kategori), [kategori]);
  const fetchFn = useMemo(() => makeFetchByKategori(kategori), [kategori]);
  const headers = useMemo(
    () => kategori === 'Guru' ? GURU_HEADERS.filter(h => h !== 'Kategori') : GURU_HEADERS.filter(h => h !== 'Kategori' && !KOLOM_KHUSUS_GURU.includes(h)),
    [kategori]
  );
  async function addFn(row) {
    return addGuruToSheet({ ...row, Kategori: kategori });
  }

  return (
    <div className="card">
      <div className="seg-tabs">
        <button className={`seg-tab ${tab === 'tabel' ? 'active' : ''}`} onClick={() => setTab('tabel')}>📋 DATA {kategori.toUpperCase()} (TABEL)</button>
        <button className={`seg-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>📝 TAMBAH {kategori.toUpperCase()}</button>
      </div>
      <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
        {tab === 'tabel' && (
          <GenericStoredTable
            title={`Data ${kategori} (Tabel)`}
            subtitle="Diambil langsung dari Google Sheets — bisa diubah atau dihapus dari sini."
            headers={headers}
            fields={fields}
            fetchFn={fetchFn}
            updateFn={updateGuruInSheet}
            deleteFn={deleteGuruFromSheet}
            moduleLabel={`Data ${kategori}`}
            labelKey="Nama Lengkap"
            searchFn={(r, t) => (r['Nama Lengkap'] || '').toLowerCase().includes(t) || (r['Jabatan'] || '').toLowerCase().includes(t)}
            onChanged={onChanged}
            columnRenderers={{
              'Tanggal Lahir': (r) => formatTanggalAngka(r['Tanggal Lahir']),
              'TMT Mengajar': (r) => formatTanggalAngka(r['TMT Mengajar']),
            }}
          />
        )}
        {tab === 'manual' && (
          <GenericManualForm
            fields={fields}
            emptyRow={() => emptyGuruRow(kategori)}
            addFn={addFn}
            onSaved={onChanged}
            title={`Tambah ${kategori}`}
            subtitle="Data langsung tersimpan ke baris baru di Google Sheets."
          />
        )}
      </div>
    </div>
  );
}

export default function DataGuru() {
  const { guru, refreshGuru } = useAppData();
  const [kategoriTab, setKategoriTab] = useState('Guru');

  const jumlahGuru = useMemo(() => guru.filter(g => g.kategori === 'Guru').length, [guru]);
  const jumlahStaff = useMemo(() => guru.filter(g => g.kategori === 'Staff').length, [guru]);

  return (
    <Page pageId="guru" title="Data Guru & Staff" path="Pengaturan / Modul / Data Guru & Staff">
      {guru.length > 0 && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card c-blue"><div className="info-value">{jumlahGuru}</div><div className="info-label">Guru</div></div>
          <div className="info-card c-purple"><div className="info-value">{jumlahStaff}</div><div className="info-label">Staff</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className={`btn ${kategoriTab === 'Guru' ? 'btn-primary' : ''}`} onClick={() => setKategoriTab('Guru')}>👩‍🏫 Guru</button>
        <button className={`btn ${kategoriTab === 'Staff' ? 'btn-primary' : ''}`} onClick={() => setKategoriTab('Staff')}>🧑‍💼 Staff</button>
      </div>

      <KategoriPanel key={kategoriTab} kategori={kategoriTab} onChanged={refreshGuru} />
    </Page>
  );
}
