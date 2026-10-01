"use client";

import { useMemo, useState } from "react";
import { ListOrdered } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

type Tab = "benchmark" | "preco" | "contexto";

const TABS: { id: Tab; rotulo: string }[] = [
  { id: "benchmark", rotulo: "Melhor benchmark" },
  { id: "preco", rotulo: "Menor preço" },
  { id: "contexto", rotulo: "Maior contexto" },
];

/** Top 10 do catálogo em 3 rankings, com barras animadas e pódio. */
export function TopModels({
  models,
  onAssign,
}: {
  models: AIModel[];
  onAssign: (slot: "A" | "B", id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("benchmark");

  const top = useMemo(() => {
    const lista = [...models];
    // O ranking geral já ordena por índice AA primeiro: o top 10
    // por rank é o top 10 por AA — ordem, número e barra coerentes.
    if (tab === "benchmark") lista.sort((a, b) => a.rank - b.rank);
    else if (tab === "preco")
      lista.sort(
        (a, b) => a.precoEntrada - b.precoEntrada || a.rank - b.rank,
      );
    // Tiebreak pelo rank evita ordem instável entre contexto iguais.
    else lista.sort((a, b) => b.contexto - a.contexto || a.rank - b.rank);
    return lista.slice(0, 10);
  }, [models, tab]);

  const stats = useMemo(() => {
    return top.map((m) => {
      if (tab === "preco")
        return { texto: `${formatPrice(m.precoEntrada)}/M`, fracao: 0 };
      if (tab === "contexto")
        return {
          texto: `${formatContext(m.contexto)} tokens`,
          fracao: m.contexto / Math.max(1, top[0]?.contexto ?? 1),
        };
      // Aba de benchmark: o top já vem filtrado SÓ com índice AA,
      // por isso número (2 dígitos) e barra (0–100) são sempre a
      // mesma métrica nativa — sem paradoxos posição × valor.
      const intel = m.aa?.intelligence_index;
      const v =
        typeof intel === "number" && Number.isFinite(intel) ? intel : NaN;
      return {
        texto: Number.isFinite(v) ? `${v} · AA Inteligência` : "sem dados",
        fracao: Number.isFinite(v) ? Math.min(1, Math.max(0, v / 100)) : 0,
      };
    });
  }, [top, tab]);

  // No ranking de preço, a barra representa a economia relativa.
  const fracoes = useMemo(() => {
    if (tab !== "preco") return stats.map((s) => s.fracao);
    const precos = top.map((m) => m.precoEntrada);
    const max = Math.max(...precos);
    const min = Math.min(...precos);
    return precos.map((p) => (max === min ? 1 : (max - p) / (max - min)));
  }, [stats, tab, top]);

  return (
    <section
      aria-labelledby="top-modelos"
      className="glass-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="top-modelos"
          className="flex items-center gap-2 text-base font-bold text-zinc-900"
        >
          <ListOrdered size={18} aria-hidden="true" className="text-indigo-600" />
          Rankings do catálogo
        </h2>
        <div
          role="tablist"
          aria-label="Critério do ranking"
          className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                tab === t.id
                  ? "tab-active bg-white text-indigo-700 shadow-sm"
                  : "text-stone-500 hover:text-zinc-900"
              }`}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-stone-500">
        {tab === "benchmark"
          ? "Top 10 por índice AA de Inteligência (0–100) — igual ao board oficial da Artificial Analysis."
          : tab === "preco"
            ? "Do mais barato para o mais caro (preço de entrada /1M). Menor preço, maior barra."
            : "Da maior para a menor janela de contexto."}
      </p>

      <ol key={tab} className="mt-3 flex flex-col gap-2">
        {top.map((m, i) => (
          <li
            key={m.id}
            style={{ animationDelay: `${i * 55}ms` }}
            className={`card-enter card-hover flex items-center gap-3 rounded-xl border bg-white px-3 py-2 ${
              i < 3 ? "podium border-indigo-600/25" : "border-stone-200"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-6 shrink-0 text-center text-sm font-extrabold tabular-nums ${
                i < 3 ? "text-indigo-600" : "text-stone-400"
              }`}
            >
              {i + 1}
            </span>
            <ModelLogo
              nome={m.nomeCurto}
              dominio={m.dominioLogo}
              cor={m.cor}
              tamanho={28}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-zinc-900">
                {m.nomeCurto}
              </span>
              <span
                aria-hidden="true"
                title={
                  tab === "benchmark"
                    ? "Índice AA de Inteligência (0–100) — critério e barra"
                    : tab === "preco"
                      ? "Economia relativa ao mais caro do top 10"
                      : "Fração da maior janela de contexto do top 10"
                }
                className="mt-1 block h-1.5 overflow-hidden rounded-full bg-stone-200"
              >
                <span
                  className="bar-fill block h-full rounded-full"
                  style={{
                    width: `${Math.max(4, fracoes[i]! * 100)}%`,
                    // Escurece a cor do fornecedor para legibilidade
                    // no tema claro (ex.: o branco da OpenAI sumia).
                    background: `linear-gradient(90deg, color-mix(in srgb, ${m.cor} 78%, #1c1917), color-mix(in srgb, ${m.cor} 58%, #1c1917))`,
                  }}
                />
              </span>
            </span>
            <span className="max-w-28 truncate text-xs font-bold tabular-nums text-zinc-700 sm:max-w-none">
              {stats[i]!.texto}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onAssign("A", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo A`}
                className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-zinc-700 active:scale-95"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => onAssign("B", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo B`}
                className="rounded-md border border-stone-300 px-2 py-1 text-[11px] font-bold text-stone-500 transition hover:border-zinc-900 hover:text-zinc-900 active:scale-95"
              >
                B
              </button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
