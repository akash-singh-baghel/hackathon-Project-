import { useEffect, useRef, useState } from 'react';

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Animates a number from 0 to `target` once, on mount or whenever target changes. */
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frameRef = useRef();

  useEffect(() => {
    if (target == null || Number.isNaN(target)) {
      setValue(target);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setValue(target * easeOutExpo(t));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
