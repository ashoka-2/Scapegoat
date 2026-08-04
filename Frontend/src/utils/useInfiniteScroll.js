import { useEffect, useRef, useCallback } from "react";

/**
 * Reusable Infinite Scroll Hook using IntersectionObserver
 * @param {Function} onLoadMore - Callback to fetch/display next page/batch
 * @param {boolean} hasMore - Boolean indicating if more items exist
 * @param {boolean} isLoading - Boolean indicating if currently fetching
 */
export const useInfiniteScroll = (onLoadMore, hasMore, isLoading) => {
  const observerRef = useRef(null);

  const sentinelRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        },
        { rootMargin: "300px" } // Trigger 300px before reaching absolute bottom
      );

      if (node) observerRef.current.observe(node);
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return sentinelRef;
};
