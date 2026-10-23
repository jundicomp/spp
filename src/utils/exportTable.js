import ExcelJS from 'exceljs';

const HIJAU_HEADER = 'FF123D22'; // sama dgn --green-dark tema aplikasi
const BORDER_TIPIS = { style: 'thin', color: { argb: 'FFAAAAAA' } };
const BORDER_SEMUA_SISI = { top: BORDER_TIPIS, bottom: BORDER_TIPIS, left: BORDER_TIPIS, right: BORDER_TIPIS };
const FORMAT_RIBUAN = '#,##0'; // titik pemisah ribuan (ikut locale Excel si pembuka), tanpa simbol Rp

function buildSheet(ws, headers, rows, title, footer) {
  const sudahAdaNomor = headers[0] === 'No';
  const headersFinal = sudahAdaNomor ? headers : ['No', ...headers];

  const titleLines = title ? (Array.isArray(title) ? title : [title]) : [];
  titleLines.forEach((line, i) => {
    const baris = i + 1;
    ws.mergeCells(baris, 1, baris, headersFinal.length);
    const titleCell = ws.getCell(baris, 1);
    titleCell.value = line;
    titleCell.font = i === 0
      ? { bold: true, size: 14, color: { argb: HIJAU_HEADER } }
      : { bold: false, size: 11, color: { argb: 'FF5B6B61' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(baris).height = i === 0 ? 26 : 18;
  });
  if (titleLines.length > 0) {
    ws.addRow([]);
  }

  const headerRow = ws.addRow(headersFinal);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_HEADER } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = BORDER_SEMUA_SISI;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 22;

  rows.forEach((r, idx) => {
    const dataValues = headers.map(h => r[h] ?? '');
    const values = sudahAdaNomor ? dataValues : [idx + 1, ...dataValues];
    const row = ws.addRow(values);
    row.eachCell(cell => {
      cell.border = BORDER_SEMUA_SISI;
      cell.alignment = { vertical: 'middle' };
      // Angka (nominal rupiah, jumlah, dll) otomatis diberi titik pemisah ribuan
      // ala Excel (ikut locale yg buka filenya) -- TANPA simbol "Rp" apapun, dan
      // nilainya tetap angka asli (bukan teks) supaya SUM/filter/sort tetap jalan.
      if (typeof cell.value === 'number') {
        cell.numFmt = FORMAT_RIBUAN;
      }
    });
    if (idx % 2 === 1) {
      row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF6DE' } }; });
    }
  });

  if (footer) {
    const footerValues = headersFinal.map(h => (h === 'No' && !sudahAdaNomor ? '' : (footer[h] ?? '')));
    const footerRowObj = ws.addRow(footerValues);
    footerRowObj.eachCell(cell => {
      cell.border = BORDER_SEMUA_SISI;
      cell.font = { bold: true, color: { argb: HIJAU_HEADER } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF3EC' } };
      cell.alignment = { vertical: 'middle' };
      if (typeof cell.value === 'number') {
        cell.numFmt = FORMAT_RIBUAN;
      }
    });
  }

  headersFinal.forEach((h, i) => {
    if (h === 'No' && !sudahAdaNomor) { ws.getColumn(i + 1).width = 8; return; }
    const kontenTerpanjang = rows.reduce((max, r) => Math.max(max, String(r[h] ?? '').length), h.length);
    ws.getColumn(i + 1).width = Math.min(Math.max(kontenTerpanjang + 3, 10), 45);
  });

  ws.views = [{ state: 'frozen', ySplit: titleLines.length > 0 ? titleLines.length + 2 : 1 }];
}

async function saveWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Nama tab Excel tidak boleh lebih dari 31 karakter & tidak boleh berisi
// karakter : \ / ? * [ ] -- fungsi ini membersihkan nama + menghindari duplikat
// (mis. dua rombel bernama sama) dengan menambah " (2)", " (3)", dst.
function sanitizeSheetName(name, namaTerpakai) {
  let bersih = String(name ?? 'Sheet').replace(/[:\\/?*[\]]/g, '-').trim();
  if (!bersih) bersih = 'Sheet';
  if (bersih.length > 31) bersih = bersih.slice(0, 31);
  let kandidat = bersih;
  let counter = 2;
  while (namaTerpakai.has(kandidat.toLowerCase())) {
    const suffix = ` (${counter})`;
    kandidat = bersih.slice(0, 31 - suffix.length) + suffix;
    counter += 1;
  }
  namaTerpakai.add(kandidat.toLowerCase());
  return kandidat;
}

export async function exportToExcel(headers, rows, filename, title, footer) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  buildSheet(ws, headers, rows, title, footer);
  await saveWorkbook(wb, filename);
}

// Export multi-tab: satu file Excel dengan beberapa worksheet/tab sekaligus.
// sheets: [{ name, headers, rows, title, footer }, ...] -- tiap entri jadi 1 tab.
export async function exportToExcelMultiSheet(sheets, filename) {
  const wb = new ExcelJS.Workbook();
  const namaTerpakai = new Set();
  sheets.forEach(s => {
    const namaAman = sanitizeSheetName(s.name, namaTerpakai);
    const ws = wb.addWorksheet(namaAman);
    buildSheet(ws, s.headers, s.rows, s.title, s.footer);
  });
  await saveWorkbook(wb, filename);
}

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
  setTimeout(cleanup, 4000);
}
