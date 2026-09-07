import Page from '../../components/layout/Page';
import { CHANGELOG } from '../../data/changelog';

function formatTanggalIndo(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChangelogPage() {
  return (
    <Page pageId="changelog" title="Riwayat Pembaruan" path="Pengaturan / Riwayat Pembaruan">
      <div className="card">
        <div className="card-body">
          <div className="changelog-timeline">
            {CHANGELOG.map((entri, idx) => (
              <div key={entri.versi} className={`changelog-entry${idx === 0 ? ' terbaru' : ''}`}>
                <div className="changelog-dot" />
                <div className="changelog-ver-row">
                  <span className="changelog-ver-badge">v{entri.versi}</span>
                  <span className="changelog-tanggal">{formatTanggalIndo(entri.tanggal)}</span>
                  {idx === 0 && <span className="changelog-tag-terbaru">Terbaru</span>}
                </div>
                <div className="changelog-card">
                  <ul>
                    {entri.poin.map((p, i) => <li key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
