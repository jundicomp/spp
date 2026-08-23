import { useState } from 'react';
import { getSheetsConfig, saveSheetsConfig, fetchSiswaFromSheet } from '../../services/googleSheets';

export default function ConnectionSettings({ onConnected }) {
  const [open, setOpen] = useState(!getSheetsConfig().url);
  const [url, setUrl] = useState(getSheetsConfig().url);
  const [secret, setSecret] = useState(getSheetsConfig().secret);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  async function testAndSave() {
    setTesting(true);
    setResult(null);
    saveSheetsConfig({ url: url.trim(), secret: secret.trim() });
    try {
      const rows = await fetchSiswaFromSheet();
      setResult({ ok: true, message: `Berhasil tersambung — ditemukan ${rows.length} baris data di Sheet.` });
      onConnected && onConnected();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  const configured = !!getSheetsConfig().url;

  return (
    <div className="card">
      <div className="card-head" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <h3>🔗 Pengaturan Koneksi Google Sheets</h3>
          <p>{configured ? 'Sudah diatur — klik untuk ubah.' : 'Belum diatur. Tempel URL Apps Script Anda di sini dulu.'}</p>
        </div>
        <span style={{ fontSize: 18 }}>{open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div className="card-body">
          <div className="form-grid">
            <div className="field span2">
              <label>URL Web App Apps Script (diakhiri /exec)</label>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/xxxxx/exec" />
            </div>
            <div className="field span2">
              <label>Kata Sandi (SECRET, sama seperti di Code.gs)</label>
              <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={testAndSave} disabled={testing || !url.trim()}>
              {testing ? 'Menguji koneksi...' : 'Simpan & Tes Koneksi'}
            </button>
            {result && (
              <span style={{ fontSize: 13, color: result.ok ? 'var(--green-dark)' : 'var(--red)', fontWeight: 600 }}>
                {result.ok ? '✓ ' : '✕ '}{result.message}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            Belum punya URL? Lihat panduan di <code>google-apps-script/README.md</code> pada source code proyek ini.
          </p>
        </div>
      )}
    </div>
  );
}
