import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "../api/client";

/**
 * Fetches `path` and exposes { data, meta, loading, error, reload }.
 * `data` is the backend's `data` envelope. Previous data is kept while a new
 * page/param set is loading, so paginated tables don't flash.
 */
export function useApi(path, params = {}) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const key = useMemo(() => path + JSON.stringify(params), [path, params]); // eslint-disable-line
  const alive = useRef(0);

  useEffect(() => {
    const ctrl = new AbortController();
    const id = ++alive.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiGet(path, params, ctrl.signal)
      .then((json) => {
        if (id === alive.current)
          setState({ data: json.data ?? null, meta: json.meta ?? null, loading: false, error: null });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (id === alive.current) setState((s) => ({ ...s, loading: false, error: err }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Client-side pagination helper for large arrays. */
export function usePaging(items, pageSize) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { setPage(1); }, [items.length, pageSize]);
  const safe = Math.min(page, pageCount);
  const slice = useMemo(() => items.slice((safe - 1) * pageSize, safe * pageSize), [items, safe, pageSize]);
  return { page: safe, setPage, pageCount, slice, total: items.length, from: items.length ? (safe - 1) * pageSize + 1 : 0, to: Math.min(safe * pageSize, items.length) };
}
