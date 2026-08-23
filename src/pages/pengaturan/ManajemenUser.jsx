import { useState } from 'react';
import Page from '../../components/layout/Page';
import { USER_FIELDS, emptyUserRow, USER_HEADERS } from '../../db/userFields';
import { addUserToSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import StoredUsersTable from './StoredUsersTable';

function TambahUserForm({ onSaved }) {
  const { toast } = useAppData();
  const [form, setForm] = useState(emptyUserRow());
  const [saving, setSaving] = useState(false);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function submit(e) {
    e.preventDefault();
    if (!isConfigured()) { toast('Atur koneksi Google Sheets dulu di menu Pengaturan Koneksi (khusus Admin).', 'error'); return; }
    const wajib = USER_FIELDS.find(f => f.required && !String(form[f.key]).trim());
    if (wajib) { toast(`${wajib.label} wajib diisi.`, 'error'); return; }
    setSaving(true);
    try {
      await addUserToSheet(form);
      toast('User baru berhasil disimpan ke Google Sheets.');
      setForm(emptyUserRow());
      onSaved && onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head"><div><h3>Tambah User</h3><p>Akun baru bisa langsung dipakai login begitu tersimpan.</p></div></div>
      <form onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            {USER_FIELDS.map(f => (
              <div key={f.key} className="field">
                <label>{f.label}{f.required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={e => setField(f.key, e.target.value)}>
                    <option value="">— pilih —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn" onClick={() => setForm(emptyUserRow())}>Bersihkan</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan User'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ManajemenUser() {
  const [tab, setTab] = useState('tambah');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey(k => k + 1);

  return (
    <Page pageId="manajemen-user" title="Manajemen User" path="Pengaturan / User / Manajemen User">
      {!isConfigured() && (
        <div className="card"><div className="card-body" style={{ fontSize: 13, color: 'var(--muted)' }}>
          ℹ️ Belum tersambung ke Google Sheets. Minta Admin mengatur koneksi lewat menu <strong>Pengaturan Koneksi</strong> dulu.
        </div></div>
      )}
      <div className="card">
        <div className="seg-tabs">
          <button className={`seg-tab ${tab === 'tambah' ? 'active' : ''}`} onClick={() => setTab('tambah')}>➕ TAMBAH USER</button>
          <button className={`seg-tab ${tab === 'daftar' ? 'active' : ''}`} onClick={() => setTab('daftar')}>📋 DAFTAR USER</button>
        </div>
        <div className="card-body" style={{ background: 'transparent', padding: 20 }}>
          {tab === 'tambah' && <TambahUserForm onSaved={bump} />}
          {tab === 'daftar' && <StoredUsersTable refreshKey={refreshKey} />}
        </div>
      </div>
    </Page>
  );
}
