import { useState, useCallback, useRef } from "react";

export function usePagedResource(fetchFn) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(new Set());

  const loadPage = useCallback(
    async (p = 1, force = false) => {
      if (inFlight.current.has(p) && !force) return;
      if (p === 1) setLoadingInitial(true);
      else setLoadingMore(true);
      inFlight.current.add(p);
      try {
        const { data } = await fetchFn(p);
        const { pagination } = data;
        const newItems =
          data.items || data.wardrobe_items || data.outfits || [];

        setPages(pagination?.pages || 1);
        setPage(pagination?.current_page || p);

        setItems((cur) => {
          if (p === 1) return newItems;
          const ids = new Set(cur.map((i) => i.id));
          const deduped = newItems.filter((i) => !ids.has(i.id));
          return [...cur, ...deduped];
        });
      } finally {
        inFlight.current.delete(p);
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [fetchFn]
  );

  const loadMore = useCallback(() => {
    if (page < pages && !loadingMore) loadPage(page + 1);
  }, [page, pages, loadingMore, loadPage]);

  const refresh = useCallback(() => {
    inFlight.current.clear();
    loadPage(1, true);
  }, [loadPage]);

  return {
    items,
    loadingInitial,
    loadingMore,
    hasMore: page < pages,
    loadMore,
    refresh,
    setItems,
  };
}
