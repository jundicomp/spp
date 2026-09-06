import Modal from '../../components/common/Modal';
import { normalizeSheetAset } from '../../db/asetFields';

function Baris({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value || '-'}</div>
    </div>
  );
}

export default function AsetViewModal({ row, onClose }) {
  const a = normalizeSheetAset(row);

  return (
    <Modal title={a.nama} subtitle={a.kode ? `Kode: ${a.kode}` : undefined} onClose={onClose} actions={
      <button className="btn" onClick={onClose}>Tutup</button>
    }>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 220px' }}>
          {a.gambar ? (
            <img src={a.gambar} alt={a.nama} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: 180, borderRadius: 10, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12.5 }}>
              Belum ada foto
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 260px' }}>
          <Baris label="Kategori" value={a.kategori} />
          <Baris label="Lokasi / Ruang" value={a.lokasi} />
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Baik</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-dark)' }}>{a.baik}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>RR</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#8a5b00' }}>{a.rusakRingan}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>RB</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>{a.rusakBerat}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{a.total}</div>
            </div>
          </div>
          <Baris label="Tahun Perolehan" value={a.tahunPerolehan} />
          <Baris label="Keterangan" value={a.keterangan} />
        </div>
      </div>
    </Modal>
  );
}
