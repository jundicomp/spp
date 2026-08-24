import { useState } from 'react';
import { getSheetsConfig, saveSheetsConfig, fetchFromSheet } from '../../services/googleSheets';
import { useAuth } from '../../context/AuthContext';

const TARGET_META = {
  master: {
    title: '🔗 Koneksi Data Induk',
    desc: 'Siswa, Kelas, Guru, Profil Sekolah, Tahun Ajaran, User, Log Aktivitas — semua dalam SATU file Sheets.',
    testSheet: 'siswa',
  },
  keuangan: {
    title: '💰 Koneksi Data Keuangan',
    desc: 'Tarif, Tagihan, Pembayaran, dst — SENGAJA di file Sheets terpisah karena data ini terus bertambah tiap bulan (beda karakter dari data induk yang relatif tetap).',
    testSheet: 'tarif',
  },
};

function ConnectionCard({ target, onConnected }) {
  const meta = TARGET_META[target];
  const [open, setOpen] = useState(!getSheetsConfig(target).url);
  const [url, setUrl] = useState(getSheetsConfig(target).url);
  const [secret, setSecret] = useState(getSheetsConfig(target).secret);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  async function testAndSave() {
    setTesting(true);
    setResult(null);
    saveSheetsConfig({ url: url.trim(), secret: secret.trim() }, target);
    try {
      const rows = await fetchFromSheet(meta.testSheet, target);
      setResult({ ok: true, message: `Berhasil tersambung — ditemukan ${rows.length} baris data di Sheet.` });
      onConnected && onConnected();
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  const configured = !!getSheetsConfig(target).url;

  return (
    <div className="card">
      <div className="card-head" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <h3>{meta.title}</h3>
          <p>{meta.desc}</p>
          <p style={{ marginTop: 4, fontWeight: 600, color: configured ? 'var(--green-dark)' : 'var(--red)' }}>
            {configured ? '✓ Sudah diatur — klik untuk ubah.' : '✕ Belum diatur.'}
          </p>
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
              <label>Kata Sandi (SECRET, sama seperti di Code.gs file ini)</label>
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
        </div>
      )}
    </div>
  );
}

export default function ConnectionSettings({ onConnected, onConnectedKeuangan }) {
  const { canAccess } = useAuth();
  const allowed = canAccess('koneksi-sheets');

  if (!allowed) {
    return (
      <div className="card">
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Pengaturan Koneksi Google Sheets</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Hanya <strong>Admin</strong> yang bisa mengubah pengaturan ini.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConnectionCard target="master" onConnected={onConnected} />
      <ConnectionCard target="keuangan" onConnected={onConnectedKeuangan} />
      <div className="card">
        <div className="card-body" style={{ fontSize: 12, color: 'var(--muted)' }}>
          Belum punya URL? Lihat panduan di <code>google-apps-script/README.md</code> (data induk) dan{' '}
          <code>google-apps-script/Code-Keuangan.gs</code> (data keuangan) pada source code proyek ini.
        </div>
      </div>
    </>
  );
}
