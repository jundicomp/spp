import * as XLSX from 'xlsx';

// Ekspor array baris (objek dgn key = nama header) ke file .xlsx, terunduh langsung.
export function exportToExcel(headers, rows, filename) {
  const data = rows.map(r => {
    const obj = {};
    headers.forEach(h => { obj[h] = r[h] ?? ''; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Cetak SATU elemen (dicari lewat id) secara terisolasi -- sidebar/topbar/kartu lain
// otomatis disembunyikan saat proses cetak, tanpa perlu bikin halaman/tab baru.
// Pola: tempel class "printing-mode" di <body> + "print-target" di elemen tujuan,
// browser native print (Ctrl+P / window.print) cuma akan menampilkan elemen itu --
// dari situ pengguna bisa pilih "Simpan sebagai PDF" di dialog cetaknya.
export function printElementById(elementId) {
  const el = document.getElementById(elementId);
  if (!el) { console.warn('printElementById: elemen tidak ditemukan:', elementId); return; }

  document.body.classList.add('printing-mode');
  el.classList.add('print-target');

  function cleanup() {
    document.body.classList.remove('printing-mode');
    el.classList.remove('print-target');
    window.removeEventListener('afterprint', cleanup);
  }
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Jaring pengaman -- sebagian browser lama tidak selalu memicu 'afterprint'.
  setTimeout(cleanup, 4000);
}
