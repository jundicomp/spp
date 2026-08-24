export const TARIF_HEADERS = ['No', 'Tahun Ajaran', 'Jenis', 'Tipe', 'Nominal', 'Wajib'];

export const TIPE_TARIF_OPTIONS = ['Bulanan (SPP)', 'Sekali Masuk', 'Per Tahun', 'Opsional'];

export function buildTarifFields(tahunAjaranOptions) {
  return [
    { key: 'Tahun Ajaran', label: 'Tahun Ajaran', type: 'select', options: tahunAjaranOptions, required: true },
    { key: 'Jenis', label: 'Jenis Biaya', type: 'text', required: true, placeholder: 'mis. SPP Bulanan, Uang Pangkal, Seragam' },
    { key: 'Tipe', label: 'Tipe', type: 'select', options: TIPE_TARIF_OPTIONS, required: true },
    { key: 'Nominal', label: 'Nominal (Rp)', type: 'number', required: true },
    { key: 'Wajib', label: 'Wajib?', type: 'select', options: ['Ya', 'Tidak'], required: true },
  ];
}

export function emptyTarifRow() {
  return { 'Tahun Ajaran': '', 'Jenis': '', 'Tipe': '', 'Nominal': '', 'Wajib': 'Ya' };
}

export function normalizeSheetTarif(row, idx) {
  return {
    id: 'TRF-' + (row['No'] ?? idx),
    no: row['No'],
    tahunAjaran: String(row['Tahun Ajaran'] ?? '').trim(),
    jenis: String(row['Jenis'] ?? '').trim(),
    tipe: String(row['Tipe'] ?? '').trim(),
    nominal: Number(row['Nominal']) || 0,
    wajib: String(row['Wajib'] ?? '').trim(),
  };
}
