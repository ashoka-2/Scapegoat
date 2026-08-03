import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Creates a debounced function that delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The delay in milliseconds (default: 300ms).
 * @param {boolean} immediate - If true, trigger function on the leading edge instead of trailing.
 * @returns {Function} Debounced function with a `.cancel()` method.
 */
export function debounce(fn, delay = 300, immediate = false) {
  let timeoutId = null;

  const debounced = function (...args) {
    const context = this;
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(context, args);
      }
    }, delay);

    if (callNow) {
      fn.apply(context, args);
    }
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes `fn` at most once per every `limit` milliseconds.
 *
 * @param {Function} fn - The function to throttle.
 * @param {number} limit - The limit in milliseconds (default: 300ms).
 * @returns {Function} Throttled function.
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  let lastFn = null;
  let lastTime = 0;

  return function (...args) {
    const context = this;
    const now = Date.now();

    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = now;
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (now - lastTime >= limit) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(limit - (now - lastTime), 0));
    }
  };
}

/**
 * Custom React hook for debouncing a state value.
 *
 * @param {any} value - The input value to debounce.
 * @param {number} delay - The delay in milliseconds (default: 300ms).
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom React hook for throttling a state value.
 *
 * @param {any} value - The input value to throttle.
 * @param {number} limit - The limit in milliseconds (default: 300ms).
 * @returns {any} The throttled value.
 */
export function useThrottle(value, limit = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Custom React hook for creating a stable debounced callback function.
 *
 * @param {Function} callback - The callback function to debounce.
 * @param {number} delay - The delay in milliseconds (default: 300ms).
 * @param {Array} deps - Dependency array.
 * @returns {Function} Stable debounced callback.
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // eslint-disable-next-deps
  return useCallback(
    debounce((...args) => callbackRef.current(...args), delay),
    [delay, ...deps]
  );
}
