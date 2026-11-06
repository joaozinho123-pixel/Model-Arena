"use client";

import { useMemo, useState } from "react";
import { Brain, Boxes, Coins } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";

type Tab = "benchmark" | "preco" | "contexto";

const TABS: {
  id: Tab;
  rotulo: string;
  icone: typeof Brain;
}[] = [
  { id: "benchmark", rotulo: "Melhor benchmark", icone: Brain },
  { id: "preco", rotulo: "Menor preço", icone: Coins },
  { id: "contexto", rotulo: "Maior contexto", icone: Boxes },
];

/** Top 10 do catálogo em 3 rankings, sem pódio nem brilhos. */
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
    // por rank é o top 10 por AA.
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
      // Aba de benchmark: número (índice AA) e barra (0–100) são
      // sempre a mesma métrica nativa.
      const intel = m.aa?.intelligence_index;
      const v =
        typeof intel === "number" && Number.isFinite(intel) ? intel : NaN;
      return {
        texto: Number.isFinite(v) ? `${v} · AA Intel.` : "sem dados",
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

  // Distância ao líder do grupo (contexto informativo, não inventa).
  const distancias = useMemo(() => {
    if (top.length < 2) return top.map(() => null);
    if (tab === "benchmark") {
      const indice = (m: AIModel) => m.aa?.intelligence_index;
      const lider = top.reduce(
        (best, m) =>
          (indice(m) ?? -Infinity) > (indice(best) ?? -Infinity) ? m : best,
        top[0]!,
      );
      return top.map((m) => {
        const a = indice(m);
        const b = indice(lider);
        if (a == null || b == null) return null;
        return Math.round((b - a) * 10) / 10;
      });
    }
    if (tab === "contexto") {
      const lider = top[0]!;
      return top.map((m) =>
        m.contexto === lider.contexto ? null : lider.contexto - m.contexto,
      );
    }
    // Preço: distância ao mais barato do grupo.
    const lider = top.reduce(
      (best, m) => (m.precoEntrada < best.precoEntrada ? m : best),
      top[0]!,
    );
    return top.map((m) =>
      m.precoEntrada === lider.precoEntrada ? null : m.precoEntrada - lider.precoEntrada,
    );
  }, [top, tab]);

  function distanciaTexto(i: number): string | null {
    const d = distancias[i];
    if (d == null || d === 0) return null;
    if (tab === "benchmark") return `−${Math.abs(d).toLocaleString("pt-PT")} pts`;
    if (tab === "contexto") return `−${formatContext(d)} tokens`;
    return `+${formatPrice(d)}/M`;
  }

  return (
    <section aria-label="Rankings do catálogo" className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {tab === "benchmark"
            ? "Top 10 por índice AA de Inteligência (0–100)."
            : tab === "preco"
              ? "Preço de entrada por 1M de tokens · menor preço, maior barra."
              : "Da maior para a menor janela de contexto."}
        </p>
        <div
          role="tablist"
          aria-label="Critério do ranking"
          className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1"
        >
          {TABS.map((t) => {
            const Icon = t.icone;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tab === t.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                {t.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {top.map((m, i) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2"
          >
            <span
              aria-hidden="true"
              className={`w-6 shrink-0 text-center text-sm font-semibold tabular-nums ${
                i < 3 ? "text-zinc-900" : "text-zinc-400"
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
              <span className="block truncate text-sm font-medium text-zinc-900">
                {m.nomeCurto}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="truncate">{m.empresa}</span>
                {distanciaTexto(i) && (
                  <span
                    className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 tabular-nums"
                    title="Distância ao líder deste ranking"
                  >
                    {distanciaTexto(i)}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="mt-1 block h-1 overflow-hidden rounded-full bg-zinc-100"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(4, fracoes[i]! * 100)}%`,
                    // Escurece a cor do fornecedor para legibilidade
                    // no tema claro (ex.: o branco da OpenAI sumia).
                    background: `color-mix(in srgb, ${m.cor} 78%, #18181b)`,
                  }}
                />
              </span>
            </span>
            <span className="max-w-28 truncate text-xs text-zinc-600 sm:max-w-none">
              {stats[i]!.texto}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onAssign("A", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo A`}
                className="rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-zinc-700"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => onAssign("B", m.id)}
                aria-label={`Usar ${m.nomeCurto} como Modelo B`}
                className="rounded-md border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 transition hover:border-zinc-900 hover:text-zinc-900"
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
