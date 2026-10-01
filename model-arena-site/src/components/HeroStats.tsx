"use client";

import { useMemo } from "react";
import type { AIModel } from "@/types/ai-model";
import { useCountUp } from "@/hooks/useCountUp";

/** Estatísticas animadas + marquise de fornecedores para o hero. */
export function HeroStats({ models }: { models: AIModel[] }) {
  const stats = useMemo(() => {
    const reais = models.filter((m) => m.fonte !== "estimativa").length;
    const fornecedores = new Set(models.map((m) => m.provider)).size;
    return { modelos: models.length, fornecedores, reais };
  }, [models]);

  const nModelos = useCountUp(stats.modelos);
  const nFornecedores = useCountUp(stats.fornecedores);
  const nReais = useCountUp(stats.reais);

  return (
    <div className="mt-7">
      <dl className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
        {[
          { valor: nModelos, rotulo: "modelos no catálogo" },
          { valor: nFornecedores, rotulo: "fornecedores" },
          { valor: nReais, rotulo: "com benchmarks reais" },
        ].map((s) => (
          <div key={s.rotulo}>
            <dt className="sr-only">{s.rotulo}</dt>
            <dd className="count-in text-2xl font-extrabold tabular-nums text-zinc-900 sm:text-3xl">
              {s.valor}
            </dd>
            <dd className="text-xs text-stone-500">{s.rotulo}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
