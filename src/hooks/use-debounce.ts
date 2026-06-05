"use client";

import { useEffect, useState } from "react";

/**
 * Returns a value that updates only after `delay`ms of stability.
 * Useful for throttling search input that drives an API call.
 */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
