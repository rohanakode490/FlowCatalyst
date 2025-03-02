import { useEffect, useState } from "react";

export const useDebounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
) => {
  const [debouncedFunc, setDebouncedFunc] = useState(() => func);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFunc(() => func);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [func, delay]);

  return debouncedFunc;
};
