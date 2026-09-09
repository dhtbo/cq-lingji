import { useEffect, useState } from "react";

/**
 * 防抖 Hook
 * @param value 输入值
 * @param delay 延迟毫秒数
 * @returns 经过防抖的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
