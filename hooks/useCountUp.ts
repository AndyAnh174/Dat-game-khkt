import { useEffect, useRef, useState } from "react";

export function useCountUp(targetValue: number, durationMs = 400) {
  const [display, setDisplay] = useState(targetValue);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(targetValue);
  const toRef = useRef(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    toRef.current = targetValue;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(
        fromRef.current + (toRef.current - fromRef.current) * eased
      );
      setDisplay(next);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, durationMs]);

  return display;
}


