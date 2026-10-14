import { useState, useCallback, useRef } from "react";
import {
  trackViewApi,
  trackDwellApi,
  getRecentlyViewedApi,
  getForYouApi,
  getFrequentlyBoughtTogetherApi,
} from "../Services/activity.api";

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useUserActivity = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [forYouProducts, setForYouProducts] = useState([]);
  const [forYouHasMore, setForYouHasMore] = useState(false);
  const [forYouPage, setForYouPage] = useState(0);
  const [forYouTotal, setForYouTotal] = useState(0);
  const [fbtProducts, setFbtProducts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingForYou, setLoadingForYou] = useState(false);
  const [loadingFbt, setLoadingFbt] = useState(false);

  const lastFbtIdRef = useRef(null);

  // Track a product view (backend handles user OR visitor identity via X-Visitor-Id)
  const trackView = useCallback(
    (productId) => {
      if (!productId) return;
      trackViewApi(productId); // backend handles user OR visitor identity
    },
    []
  );

  // Track dwell time
  const trackDwell = useCallback(
    (productId, dwellMs) => {
      if (!productId || !dwellMs) return;
      trackDwellApi(productId, dwellMs); // backend handles user OR visitor identity
    },
    []
  );

  // Fetch recently viewed products with stable callback
  const fetchRecentlyViewed = useCallback(
    async (limit = 10) => {
      setLoadingRecent(true);
      try {
        const data = await getRecentlyViewedApi(limit);
        setRecentlyViewed(data.data || []);
      } catch {
        setRecentlyViewed([]);
      } finally {
        setLoadingRecent(false);
      }
    },
    []
  );

  // Fetch "For You" personalized products
  const fetchForYou = useCallback(
    async (limit = 12, page = 1, append = false) => {
      setLoadingForYou(true);
      try {
        const data = await getForYouApi(limit, page);
        setForYouProducts((current) => append ? [...current, ...(data.data || [])] : (data.data || []));
        setForYouHasMore(Boolean(data.hasMore));
        setForYouPage(data.page || page);
        setForYouTotal(data.total || 0);
      } catch {
        if (!append) setForYouProducts([]);
        setForYouHasMore(false);
      } finally {
        setLoadingForYou(false);
      }
    },
    []
  );

  // Fetch frequently bought together products (memoized by productId)
  const fetchFrequentlyBoughtTogether = useCallback(
    async (productId) => {
      if (!productId || lastFbtIdRef.current === productId) return;
      lastFbtIdRef.current = productId;
      setLoadingFbt(true);
      try {
        const data = await getFrequentlyBoughtTogetherApi(productId);
        setFbtProducts(data.data || []);
      } catch {
        setFbtProducts([]);
      } finally {
        setLoadingFbt(false);
      }
    },
    []
  );

  return {
    trackView,
    trackDwell,
    recentlyViewed,
    forYouProducts,
    forYouHasMore,
    forYouPage,
    forYouTotal,
    fbtProducts,
    loadingRecent,
    loadingForYou,
    loadingFbt,
    fetchRecentlyViewed,
    fetchForYou,
    fetchFrequentlyBoughtTogether,
  };
};

// ── Dwell time tracker hook ──────────────────────────────────────────────────
export const useDwellTracker = (productId) => {
  const startTimeRef = useRef(null);

  const prevProductIdRef = useRef(null);

  if (prevProductIdRef.current !== productId) {
    prevProductIdRef.current = productId;
    startTimeRef.current = Date.now();
  }

  // Record dwell time when leaving page or changing product
  const recordDwell = useCallback(() => {
    if (startTimeRef.current && productId) {
      const dwellMs = Date.now() - startTimeRef.current;
      if (dwellMs > 2000) {
        trackDwellApi(productId, dwellMs);
      }
    }
  }, [productId]);

  return recordDwell;
};
