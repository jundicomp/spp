import { useMemo, useState } from 'react';

/**
 * DataTable generik — padanan React dari createTableController() di app vanilla.
 *
 * columns: [{ key, label, sortable?, accessor?(row), render?(row, index) }]
 * data: array baris mentah
 * searchFn: (row, termLowerCase) => boolean
 * pageSize: default 10
 * emptyMessage: teks saat data kosong
 */
export default function DataTable({ columns, data, searchFn, pageSize = 10, emptyMessage = 'Tidak ada data.', defaultSortKey = null, defaultSortDir = 'asc', rowKey, forceShowAll = false }) {
  const [term, setTerm] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = data;
    if (term.trim() && searchFn) {
      const t = term.trim().toLowerCase();
      rows = rows.filter(r => searchFn(r, t));
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
  }, [data, term, sortKey, sortDir, columns, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  // Mode cetak (forceShowAll): lewati paginasi sepenuhnya -- supaya PDF/print memuat SEMUA baris,
  // bukan cuma halaman yg sedang tampil di layar.
  const pageRows = forceShowAll ? filtered : filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  return (
    <div>
      {searchFn && (
        <div className="search-box no-print" style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Cari..."
            value={term}
            onChange={(e) => { setTerm(e.target.value); setPage(1); }}
          />
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
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td className="empty-cell" colSpan={columns.length + 1}>{emptyMessage}</td></tr>
            )}
            {pageRows.map((row, idx) => (
              <tr key={rowKey ? rowKey(row) : idx}>
                <td>{(pageSafe - 1) * pageSize + idx + 1}</td>
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row, (pageSafe - 1) * pageSize + idx) : (col.accessor ? col.accessor(row) : row[col.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && !forceShowAll && (
        <div className="pagination no-print">
          <button disabled={pageSafe <= 1} onClick={() => setPage(p => p - 1)}>‹ Sebelumnya</button>
          <span style={{ alignSelf: 'center', fontSize: 12.5, color: 'var(--muted)' }}>Halaman {pageSafe} / {totalPages}</span>
          <button disabled={pageSafe >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya ›</button>
        </div>
      )}
    </div>
  );
}
