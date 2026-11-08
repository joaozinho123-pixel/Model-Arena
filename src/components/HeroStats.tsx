"use client";

import { useEffect, useMemo, useState } from "react";
import type { AIModel } from "@/types/ai-model";

/** Contador animado: 0 → valor com ease-out; movimento reduzido salta. */
function Contador({ valor }: { valor: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (valor <= 0) {
      const j = requestAnimationFrame(() => setN(0));
      return () => cancelAnimationFrame(j);
    }
    // Movimento reduzido: chega logo ao valor (pós-paint via rAF).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const j = requestAnimationFrame(() => setN(valor));
      return () => cancelAnimationFrame(j);
    }
    let raf = 0;
    let t0 = 0;
    const dur = 900;
    const passo = (ts: number) => {
      if (!t0) t0 = ts;
      const k = Math.min(1, (ts - t0) / dur);
      setN(Math.round(valor * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  return <span className="tabular-nums">{n.toLocaleString("pt-PT")}</span>;
}

/** Estatísticas do catálogo para o hero, em linha sóbria com contagem. */
export function HeroStats({ models }: { models: AIModel[] }) {
  const stats = useMemo(() => {
    const reais = models.filter((m) => m.fonte !== "estimativa").length;
    const fornecedores = new Set(models.map((m) => m.provider)).size;
    const gratis = models.filter((m) => m.precoEntrada === 0).length;
    return { modelos: models.length, fornecedores, reais, gratis };
  }, [models]);

  return (
    <dl className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
      {[
        { valor: stats.modelos, rotulo: "modelos no catálogo" },
        { valor: stats.fornecedores, rotulo: "fornecedores" },
        { valor: stats.reais, rotulo: "com benchmarks reais" },
        { valor: stats.gratis, rotulo: "grátis (US$ 0)" },
      ].map((s) => (
        <div key={s.rotulo}>
          <dt className="sr-only">{s.rotulo}</dt>
          <dd className="text-xl font-semibold text-zinc-900">
            <Contador valor={s.valor} />
          </dd>
          <dd className="mt-0.5 text-xs text-zinc-500">{s.rotulo}</dd>
        </div>
      ))}
    </dl>
  );
}
