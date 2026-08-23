import { useEffect, useState } from 'react';
import { isConfigured, fetchSiswaFromSheet } from '../../services/googleSheets';

export default function ConnectionStatusBadge() {
  const [status, setStatus] = useState('checking'); // checking | ok | fail

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!isConfigured()) {
        if (!cancelled) setStatus('fail');
        return;
      }
      try {
        await fetchSiswaFromSheet();
        if (!cancelled) setStatus('ok');
      } catch {
        if (!cancelled) setStatus('fail');
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const config = {
    checking: { color: '#B7B7B7', icon: '…', label: 'Memeriksa koneksi Google Sheets...' },
    ok: { color: '#1C7A3C', icon: '✓', label: 'Google Sheets terhubung' },
    fail: { color: '#B23B2E', icon: '✕', label: 'Google Sheets belum terhubung' },
  }[status];

  return (
    <div title={config.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
      <span style={{
        width: 15, height: 15, borderRadius: '50%', background: config.color, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9.5, fontWeight: 800, flexShrink: 0, lineHeight: 1,
      }}>{config.icon}</span>
      {config.label}
    </div>
  );
}
