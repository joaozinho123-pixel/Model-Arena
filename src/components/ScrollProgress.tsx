"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Barra de progresso de scroll: fita finíssima fixa no topo,
 * cresce de 0 a 100% conforme a página desce (rAF: 1 medição
 * por frame no máximo, sem custo em scroll).
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const medir = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setPct(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
    };
    const aoScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(medir);
    };
    rafRef.current = requestAnimationFrame(medir);
    window.addEventListener("scroll", aoScroll, { passive: true });
    window.addEventListener("resize", aoScroll);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", aoScroll);
      window.removeEventListener("resize", aoScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        className="h-full origin-left bg-zinc-900"
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}
