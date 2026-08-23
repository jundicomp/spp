import { useState } from 'react';
import Modal from '../common/Modal';
import PasswordConfirmModal from '../common/PasswordConfirmModal';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { addLogEntry } from '../../services/googleSheets';

export default function GenericEditModal({ row, fields, updateFn, moduleLabel, labelKey, onClose, onSaved }) {
  const { toast } = useAppData();
  const { currentUser } = useAuth();
  const [form, setForm] = useState(() => {
    const initial = {};
    fields.forEach(f => { initial[f.key] = row[f.key] ?? ''; });
    return initial;
  });
  const [step, setStep] = useState('form');
  const [saving, setSaving] = useState(false);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function trySubmit(e) {
    e.preventDefault();
    const wajib = fields.find(f => f.required && !String(form[f.key]).trim());
    if (wajib) { toast(`${wajib.label} wajib diisi.`, 'error'); return; }
    setStep('confirm');
  }

  async function doUpdate() {
    setSaving(true);
    try {
      await updateFn({ ...form, No: row['No'] });
      await addLogEntry({
        username: currentUser.username,
        namaUser: currentUser.nama,
        aksi: 'Edit Data',
        modul: moduleLabel,
        detail: `Mengubah data "${form[labelKey]}" (No. ${row['No']})`,
      });
      toast('Data berhasil diperbarui.');
      onSaved && onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  if (step === 'confirm') {
    return (
      <PasswordConfirmModal
        title="Konfirmasi Perubahan Data"
        message={`Anda akan mengubah data "${form[labelKey]}".`}
        onConfirm={doUpdate}
        onClose={() => setStep('form')}
      />
    );
  }

  return (
    <Modal title={`Edit ${moduleLabel}`} subtitle={`No. ${row['No']}`} onClose={onClose} actions={
      <>
        <button className="btn" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" onClick={trySubmit} disabled={saving}>Lanjut ke Konfirmasi</button>
      </>
    }>
      <form onSubmit={trySubmit}>
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
                <input type={f.type} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}
