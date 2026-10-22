import { useMemo, useState } from 'react';
import LongTextCell from './LongTextCell';
import { normalisasiTanggalUntukInput } from '../../db/helpers';

/**
 * DataTable generik — padanan React dari createTableController() di app vanilla.
 *
 * columns: [{ key, label, sortable?, accessor?(row), render?(row, index), filterable?,
 *   filterType?: 'select', filterOptions?: string[] }]
 *   - filterable: default TRUE kalau kolom punya accessor ATAU tidak punya render custom
 *     (fallback LongTextCell baca row[key] langsung -- berarti ada nilai nyata utk difilter).
 *     Kolom yg CUMA punya render custom (mis. kolom "Aksi" isinya tombol Edit/Hapus,
 *     tidak ada accessor) otomatis default filterable:false krn tidak ada nilai teks
 *     yg bisa dibandingkan -- bisa dipaksa true/false manual lewat properti ini.
 *   - filterType:'select' -- filter kolom ini tampil sbg dropdown (bukan kotak teks
 *     bebas), isinya dari filterOptions. Cocok utk kolom kategorikal (Status, Jenis, dst).
 * data: array baris mentah
 * searchFn: (row, termLowerCase) => boolean -- pencarian GLOBAL (semua kolom sekaligus,
 *   kotak "Cari..." di pojok kiri atas tabel).
 * dateFilterKey: opsional -- nama field MENTAH di baris (row[dateFilterKey]) yg dipakai
 *   utk filter rentang tanggal "Dari/Sampai" di pojok kanan atas tabel. Nilainya
 *   dinormalisasi dulu (normalisasiTanggalUntukInput) spy tetap akurat walau field
 *   aslinya ISO+jam dari Google Sheets. TIDAK ditampilkan kalau prop ini kosong.
 * dateFilterLabel: opsional, label kolom tanggal yg difilter (default "Tanggal").
 * pageSize: default 10 -- kalau pageSizeOptions TIDAK diisi, ini ukuran halaman TETAP.
 * pageSizeOptions: default [10, 25, 50, 100, 'Semua'] -- dropdown "Tampilkan" di atas
 *   tabel SELALU tampil kecuali pemanggil eksplisit kirim pageSizeOptions={null}.
 *   pageSize dipakai sbg nilai AWAL dropdown ini. Nilai 'Semua' menampilkan SELURUH
 *   baris (tanpa paginasi).
 * footer: opsional, (filteredRows) => <tr>...</tr> -- baris ringkasan/total yg
 *   ditaruh di <tfoot>, dihitung dari SELURUH baris yg lolos pencarian+filter+sort
 *   (BUKAN cuma baris di halaman yg sedang tampil), jadi totalnya tetap benar walau
 *   lagi di halaman 2/3/dst.
 * emptyMessage: teks saat data kosong
 */
export default function DataTable({
  columns, data, searchFn, pageSize = 10, pageSizeOptions = [10, 25, 50, 100, 'Semua'],
  footer = null, emptyMessage = 'Tidak ada data.', defaultSortKey = null, defaultSortDir = 'asc',
  rowKey, forceShowAll = false, dateFilterKey = null, dateFilterLabel = 'Tanggal',
}) {
  const [term, setTerm] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [page, setPage] = useState(1);
  const [pageSizeSel, setPageSizeSel] = useState(pageSize);
  const [columnFilters, setColumnFilters] = useState({});
  const [dariTanggal, setDariTanggal] = useState('');
  const [sampaiTanggal, setSampaiTanggal] = useState('');

  // Kolom bisa difilter kalau: filterable eksplisit TRUE, ATAU (filterable tidak
  // diatur manual DAN kolomnya punya accessor ATAU tidak punya render custom sama
  // sekali -- lihat catatan lengkap di komentar atas).
  function kolomBisaDifilter(col) {
    if (col.filterable === false) return false; // eksplisit dimatikan pemanggil
    if (col.filterable === true) return true; // eksplisit dipaksa nyala pemanggil
    return Boolean(col.accessor) || !col.render;
  }
  function nilaiTeksKolom(col, row) {
    const v = col.accessor ? col.accessor(row) : row[col.key];
    return v === null || v === undefined ? '' : String(v);
  }

  const adaFilterAktif = term.trim() || dariTanggal || sampaiTanggal || Object.values(columnFilters).some(v => v);

  const filtered = useMemo(() => {
    let rows = data;
    if (term.trim() && searchFn) {
      const t = term.trim().toLowerCase();
      rows = rows.filter(r => searchFn(r, t));
    }
    if (dateFilterKey && (dariTanggal || sampaiTanggal)) {
      rows = rows.filter(r => {
        const v = normalisasiTanggalUntukInput(r[dateFilterKey]);
        if (!v) return false;
        if (dariTanggal && v < dariTanggal) return false;
        if (sampaiTanggal && v > sampaiTanggal) return false;
        return true;
      });
    }
    const filterEntries = Object.entries(columnFilters).filter(([, v]) => v);
    if (filterEntries.length) {
      rows = rows.filter(r => filterEntries.every(([key, val]) => {
        const col = columns.find(c => c.key === key);
        if (!col) return true;
        const text = nilaiTeksKolom(col, r);
        if (col.filterType === 'select') return text === val;
        return text.toLowerCase().includes(val.toLowerCase());
      }));
    }
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      const accessor = col?.accessor || (r => r[sortKey]);
      rows = [...rows].sort((a, b) => {
        const av = accessor(a); const bv = accessor(b);
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, term, sortKey, sortDir, columns, searchFn, dateFilterKey, dariTanggal, sampaiTanggal, columnFilters]);

  // Kalau dropdown "Tampilkan" pilih 'Semua', perlakukan spt forceShowAll (lewati paginasi).
  const tampilkanSemua = forceShowAll || pageSizeSel === 'Semua';
  const pageSizeAktif = typeof pageSizeSel === 'number' ? pageSizeSel : pageSize;
  const totalPages = tampilkanSemua ? 1 : Math.max(1, Math.ceil(filtered.length / pageSizeAktif));
  const pageSafe = Math.min(page, totalPages);
  // Mode cetak (forceShowAll) ATAU dropdown "Semua": lewati paginasi sepenuhnya --
  // supaya PDF/print/tampilan "Semua" memuat SEMUA baris, bukan cuma 1 halaman.
  const pageRows = tampilkanSemua ? filtered : filtered.slice((pageSafe - 1) * pageSizeAktif, pageSafe * pageSizeAktif);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  function handleGantiPageSize(v) {
    setPageSizeSel(v === 'Semua' ? 'Semua' : Number(v));
    setPage(1);
  }

  function handleColumnFilter(key, val) {
    setColumnFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  function resetSemuaFilter() {
    setTerm('');
    setColumnFilters({});
    setDariTanggal('');
    setSampaiTanggal('');
    setPage(1);
  }

  return (
    <div>
      {(searchFn || pageSizeOptions || dateFilterKey) && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, flex: 1 }}>
            {searchFn && (
              <div className="search-box" style={{ minWidth: 180 }}>
                <input
                  type="text"
                  placeholder="Cari..."
                  value={term}
                  onChange={(e) => { setTerm(e.target.value); setPage(1); }}
                />
              </div>
            )}
            {dateFilterKey && (
              <div className="date-range-filter">
                <span>{dateFilterLabel}:</span>
                <input type="date" value={dariTanggal} onChange={e => { setDariTanggal(e.target.value); setPage(1); }} />
                <span>s/d</span>
                <input type="date" value={sampaiTanggal} onChange={e => { setSampaiTanggal(e.target.value); setPage(1); }} />
              </div>
            )}
            {adaFilterAktif && (
              <button type="button" className="btn btn-sm" onClick={resetSemuaFilter}>✕ Hapus Filter</button>
            )}
          </div>
          {pageSizeOptions && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              Tampilkan
              <select value={String(pageSizeSel)} onChange={e => handleGantiPageSize(e.target.value)} style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5 }}>
                {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>No</th>
              {columns.map(col => (
                <th key={col.key} className={col.headerClassName} onClick={col.sortable ? () => handleSort(col.key) : undefined} style={col.sortable ? { cursor: 'pointer' } : undefined}>
                  {col.label} {col.sortable && (sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅')}
                </th>
              ))}
            </tr>
            <tr className="filter-row no-print">
              <th />
              {columns.map(col => (
                <th key={col.key + '-filter'} className={col.headerClassName}>
                  {kolomBisaDifilter(col) ? (
                    col.filterType === 'select' ? (
                      <select value={columnFilters[col.key] || ''} onChange={e => handleColumnFilter(col.key, e.target.value)}>
                        <option value="">Semua</option>
                        {(col.filterOptions || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[col.key] || ''}
                        onChange={e => handleColumnFilter(col.key, e.target.value)}
                      />
                    )
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td className="empty-cell" colSpan={columns.length + 1}>{adaFilterAktif ? 'Tidak ada data yang cocok dengan filter.' : emptyMessage}</td></tr>
            )}
            {pageRows.map((row, idx) => (
              <tr key={rowKey ? rowKey(row) : idx}>
                <td>{(pageSafe - 1) * pageSizeAktif + idx + 1}</td>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row, (pageSafe - 1) * pageSizeAktif + idx)
                      : <LongTextCell value={col.accessor ? col.accessor(row) : row[col.key]} label={col.label} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && filtered.length > 0 && (
            <tfoot>{footer(filtered)}</tfoot>
          )}
        </table>
      </div>
      {totalPages > 1 && !tampilkanSemua && (
        <div className="pagination no-print">
          <button disabled={pageSafe <= 1} onClick={() => setPage(p => p - 1)}>‹ Sebelumnya</button>
          <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--muted)' }}>Halaman {pageSafe} / {totalPages} ({filtered.length} baris)</span>
          <button disabled={pageSafe >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya ›</button>
        </div>
      )}
    </div>
  );
}
