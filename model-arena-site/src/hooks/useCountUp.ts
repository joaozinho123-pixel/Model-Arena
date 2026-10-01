"use client";

import { useEffect, useState } from "react";

/**
 * Conta de 0 até ao alvo com easing (contadores do hero).
 * setState só dentro de callbacks; parado com reduced-motion.
 */
export function useCountUp(
  target: number,
  decimals = 0,
  duration = 900,
): number {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setValor(target));
      return () => cancelAnimationFrame(raf);
    }
    const inicio = performance.now();
    const tick = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValor(Number((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, duration]);

  return valor;
}
