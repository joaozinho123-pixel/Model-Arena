"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Revelação ao scroll: o bloco entra suavemente quando fica
 * visível. Sem JS ou com movimento reduzido aparece logo —
 * o `.reveal`/`.revealed` vive no CSS, aqui só se observa.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Atraso da entrada, em ms (para cascatas). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const semMovimento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window);
    if (semMovimento) {
      el.classList.add("revealed");
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            el.classList.add("revealed");
            obs.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}
