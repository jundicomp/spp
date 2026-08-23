import { useState } from 'react';
import { SISWA_FIELDS, emptySiswaRow } from '../../db/siswaFields';
import { addSiswaToSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function ManualForm({ onSaved }) {
  const { toast } = useAppData();
  const [form, setForm] = useState(emptySiswaRow());
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!isConfigured()) { toast('Atur koneksi Google Sheets dulu di atas.', 'error'); return; }
    const wajib = SISWA_FIELDS.find(f => f.required && !String(form[f.key]).trim());
    if (wajib) { toast(`${wajib.label} wajib diisi.`, 'error'); return; }
    setSaving(true);
    try {
      await addSiswaToSheet(form);
      toast('Data siswa berhasil disimpan ke Google Sheets.');
      setForm(emptySiswaRow());
      onSaved && onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div><h3>Tambah Data Siswa (Manual)</h3><p>Data langsung tersimpan ke baris baru di Google Sheets.</p></div>
      </div>
      <form onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            {SISWA_FIELDS.map(f => (
              <div key={f.key} className={`field ${f.type === 'textarea' ? 'span2' : ''}`}>
                <label>{f.label}{f.required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={e => setField(f.key, e.target.value)}>
                    <option value="">— pilih —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows={2} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn" onClick={() => setForm(emptySiswaRow())}>Bersihkan Form</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan ke Google Sheets'}</button>
        </div>
      </form>
    </div>
  );
}
