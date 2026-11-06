import { useMemo } from "react";
import type { AIModel } from "@/types/ai-model";

/** Estatísticas do catálogo para o hero, em linha sóbria. */
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
          <dd className="text-xl font-semibold tabular-nums text-zinc-900">
            {s.valor}
          </dd>
          <dd className="mt-0.5 text-xs text-zinc-500">{s.rotulo}</dd>
        </div>
      ))}
    </dl>
  );
}
