import { useMemo } from "react";
import type { AIModel } from "@/types/ai-model";

/** Estatísticas do catálogo para o hero. */
export function HeroStats({ models }: { models: AIModel[] }) {
  const stats = useMemo(() => {
    const reais = models.filter((m) => m.fonte !== "estimativa").length;
    const fornecedores = new Set(models.map((m) => m.provider)).size;
    return { modelos: models.length, fornecedores, reais };
  }, [models]);

  return (
    <div className="mt-7">
      <dl className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
        {[
          { valor: stats.modelos, rotulo: "modelos no catálogo" },
          { valor: stats.fornecedores, rotulo: "fornecedores" },
          { valor: stats.reais, rotulo: "com benchmarks reais" },
        ].map((s) => (
          <div key={s.rotulo}>
            <dt className="sr-only">{s.rotulo}</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-zinc-900 sm:text-3xl">
              {s.valor}
            </dd>
            <dd className="text-xs text-stone-500">{s.rotulo}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
