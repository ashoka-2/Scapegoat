import { useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import {
  trackViewApi,
  trackDwellApi,
  getRecentlyViewedApi,
  getForYouApi,
  getFrequentlyBoughtTogetherApi,
} from "../Services/activity.api";

// ── localStorage fallback for guests ─────────────────────────────────────────
const LS_KEY = "sg_recently_viewed";
const MAX_LOCAL = 50;

const getLocalViews = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
};

const addLocalView = (productId) => {
  const views = getLocalViews().filter((id) => id !== productId);
  views.unshift(productId);
  localStorage.setItem(LS_KEY, JSON.stringify(views.slice(0, MAX_LOCAL)));
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useUserActivity = () => {
  const user = useSelector((state) => state.auth?.user);
  const userId = user?._id || user?.id;

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [forYouProducts, setForYouProducts] = useState([]);
  const [fbtProducts, setFbtProducts] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingForYou, setLoadingForYou] = useState(false);
  const [loadingFbt, setLoadingFbt] = useState(false);

  const lastFbtIdRef = useRef(null);

  // Track a product view
  const trackView = useCallback(
    (productId) => {
      if (!productId) return;
      addLocalView(productId);
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
    async (limit = 10) => {
      setLoadingForYou(true);
      try {
        const data = await getForYouApi(limit);
        setForYouProducts(data.data || []);
      } catch {
        setForYouProducts([]);
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
  const user = useSelector((state) => state.auth?.user);
  const userId = user?._id || user?.id;
  const startTimeRef = useRef(null);

  const prevProductIdRef = useRef(null);

  if (prevProductIdRef.current !== productId) {
    prevProductIdRef.current = productId;
    startTimeRef.current = Date.now();
  }

  // Record dwell time when leaving page or changing product
  const recordDwell = useCallback(() => {
    if (startTimeRef.current && productId && userId) {
      const dwellMs = Date.now() - startTimeRef.current;
      if (dwellMs > 2000) {
        trackDwellApi(productId, dwellMs);
      }
    }
  }, [productId, userId]);

  return recordDwell;
};
