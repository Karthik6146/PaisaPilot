import { useEffect, useRef, useState } from 'react';

// Animates a money figure from its previous value to the new one. Static when the user prefers reduced motion.
export function CountUp({ value, format }: { value: number; format: (value: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (from.current === value) return;
    const start = performance.now(), origin = from.current, delta = value - origin;
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const tick = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start) / 650), eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round((origin + delta * eased) * 100) / 100);
      if (t < 1) frame = requestAnimationFrame(tick); else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(shown)}</>;
}
