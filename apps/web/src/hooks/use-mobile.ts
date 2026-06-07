import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)"
    );
    const onChange = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener("change", onChange);
    setIsTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTablet;
}
