import { useState } from 'react';
import Page from '../../components/layout/Page';
import { CHANGELOG } from '../../data/changelog';

function formatTanggalIndo(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChangelogPage() {
  // Dikelompokkan per versi, TERTUTUP semua secara default -- isi poinnya baru
  // muncul kalau baris versinya diklik, biar halaman tidak langsung penuh dgn
  // seluruh riwayat sekaligus. State cuma simpan versi mana saja yg lagi terbuka.
  const [terbuka, setTerbuka] = useState(() => new Set());

  function toggle(versi) {
    setTerbuka(prev => {
      const next = new Set(prev);
      if (next.has(versi)) next.delete(versi);
      else next.add(versi);
      return next;
    });
  }

  return (
    <Page pageId="changelog" title="Riwayat Pembaruan" path="Pengaturan / Riwayat Pembaruan">
      <div className="card">
        <div className="card-body">
          <div className="changelog-timeline">
            {CHANGELOG.map((entri, idx) => {
              const sedangTerbuka = terbuka.has(entri.versi);
              return (
                <div key={entri.versi} className={`changelog-entry${idx === 0 ? ' terbaru' : ''}`}>
                  <div className="changelog-dot" />
                  <div className="changelog-ver-row changelog-ver-row-clickable" onClick={() => toggle(entri.versi)}>
                    <span className={`changelog-arrow${sedangTerbuka ? ' open' : ''}`}>▸</span>
                    <span className="changelog-ver-badge">v{entri.versi}</span>
                    <span className="changelog-tanggal">{formatTanggalIndo(entri.tanggal)}</span>
                    {idx === 0 && <span className="changelog-tag-terbaru">Terbaru</span>}
                  </div>
                  {sedangTerbuka && (
                    <div className="changelog-card">
                      <ul>
                        {entri.poin.map((p, i) => <li key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Page>
  );
}
