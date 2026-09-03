import { useId } from 'react';
import Modal from '../../components/common/Modal';
import { useAppData } from '../../context/AppContext';
import { printElementById } from '../../utils/exportTable';

function formatRupiah(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export default function KwitansiModal({ pembayaran, onClose }) {
  const { profilSekolah } = useAppData();
  const printId = 'print-kwitansi-' + useId().replace(/:/g, '');

  return (
    <Modal title="Kwitansi Pembayaran" subtitle={`No. ${pembayaran.no}`} onClose={onClose} actions={
      <>
        <button className="btn no-print" onClick={onClose}>Tutup</button>
        <button className="btn btn-primary no-print" onClick={() => printElementById(printId)}>🖨️ Cetak</button>
      </>
    }>
      <div id={printId} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 18, borderBottom: '2px solid var(--green-dark)', paddingBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--green-dark)' }}>{profilSekolah?.nama || 'Nama Sekolah'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{profilSekolah?.alamat || '-'}</div>
        </div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>KWITANSI PEMBAYARAN</div>
        <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)', width: 140 }}>No. Kwitansi</td><td>: {pembayaran.no}</td></tr>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)' }}>Nama Siswa</td><td>: {pembayaran.namaSiswa}</td></tr>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)' }}>NISN</td><td>: {pembayaran.nisn || '-'}</td></tr>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)' }}>Jenis Pembayaran</td><td>: {pembayaran.jenis}</td></tr>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)' }}>Tanggal Bayar</td><td>: {pembayaran.tanggalBayar}</td></tr>
            <tr><td style={{ padding: '5px 0', color: 'var(--muted)' }}>Metode</td><td>: {pembayaran.metode}</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--green-soft)', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Jumlah Dibayar</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-dark)' }}>{formatRupiah(pembayaran.nominal)}</div>
        </div>
        <div style={{ marginTop: 24, textAlign: 'right', fontSize: 13 }}>
          <div style={{ marginBottom: 50 }}>Diterima oleh,</div>
          <div style={{ fontWeight: 700 }}>( ................................. )</div>
        </div>
      </div>
    </Modal>
  );
}
