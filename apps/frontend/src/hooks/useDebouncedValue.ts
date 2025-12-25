// ===========================================
// Debounced Value Hook
// ===========================================
// Returns a debounced version of the provided value

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * The returned value will only update after the specified delay
 * has passed without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

export default useDebouncedValue;
