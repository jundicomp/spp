import { useState } from 'react';
import { isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';

export default function GenericManualForm({ fields, emptyRow, addFn, onSaved, title, subtitle, target = 'master' }) {
  const { toast } = useAppData();
  const [form, setForm] = useState(emptyRow());
  const [saving, setSaving] = useState(false);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function submit(e) {
    e.preventDefault();
    if (!isConfigured(target)) { toast('Atur koneksi Google Sheets dulu (menu Pengaturan Koneksi).', 'error'); return; }
    const wajib = fields.find(f => f.required && !String(form[f.key]).trim());
    if (wajib) { toast(`${wajib.label} wajib diisi.`, 'error'); return; }
    setSaving(true);
    try {
      await addFn(form);
      toast('Data berhasil disimpan ke Google Sheets.');
      setForm(emptyRow());
      onSaved && onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head"><div><h3>{title}</h3><p>{subtitle}</p></div></div>
      <form onSubmit={submit}>
        <div className="card-body">
          <div className="form-grid">
            {fields.map(f => (
              <div key={f.key} className="field">
                <label>{f.label}{f.required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={e => setField(f.key, e.target.value)}>
                    <option value="">— pilih —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder || ''} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn" onClick={() => setForm(emptyRow())}>Bersihkan</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan ke Google Sheets'}</button>
        </div>
      </form>
    </div>
  );
}
