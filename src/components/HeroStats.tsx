"use client";

import { useMemo } from "react";
import type { AIModel } from "@/types/ai-model";
import { useCountUp } from "@/hooks/useCountUp";
import { ModelLogo } from "@/components/ModelLogo";

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

  // Um modelo representativo por fornecedor (para cor e logótipo).
  const logos = useMemo(() => {
    const vistos = new Set<string>();
    const out: AIModel[] = [];
    for (const m of models) {
      if (!vistos.has(m.provider)) {
        vistos.add(m.provider);
        out.push(m);
      }
      if (out.length >= 16) break;
    }
    return out;
  }, [models]);

  return (
    <div className="mt-7">
      <dl className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
        {[
          { valor: nModelos, rotulo: "modelos no catálogo", cor: "#4f46e5" },
          { valor: nFornecedores, rotulo: "fornecedores", cor: "#7c3aed" },
          { valor: nReais, rotulo: "com benchmarks reais", cor: "#0284c7" },
        ].map((s) => (
          <div key={s.rotulo}>
            <dt className="sr-only">{s.rotulo}</dt>
            <dd
              className="count-in text-2xl font-extrabold tabular-nums sm:text-3xl"
              style={{ color: s.cor }}
            >
              {s.valor}
            </dd>
            <dd className="text-xs text-stone-500">{s.rotulo}</dd>
          </div>
        ))}
      </dl>

      <div className="marquee mt-6" aria-hidden="true">
        <div className="marquee-track">
          {[...logos, ...logos].map((m, i) => (
            <span
              key={`${m.id}-${i}`}
              className="flex shrink-0 items-center gap-2 opacity-70 transition hover:scale-110 hover:opacity-100"
            >
              <ModelLogo
                nome={m.nomeCurto}
                dominio={m.dominioLogo}
                cor={m.cor}
                tamanho={26}
                eager
              />
              <span className="text-xs font-semibold whitespace-nowrap text-stone-500">
                {m.empresa}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
