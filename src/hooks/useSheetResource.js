import { useCallback, useEffect, useState } from 'react';
import { isConfigured } from '../services/googleSheets';

/**
 * Hook generik: ambil satu "resource" dari Google Sheets, dengan state loading/error,
 * dan fungsi refresh yang bisa dipanggil ulang kapan saja (mis. setelah tambah/edit/hapus).
 */
export default function useSheetResource(fetchFn, normalizeFn) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!isConfigured()) {
      setData([]);
      setLoaded(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchFn();
      setData(normalizeFn ? rows.map(normalizeFn) : rows);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, loaded, refresh };
}
