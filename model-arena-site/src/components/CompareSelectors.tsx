"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeftRight, Dices, Plus } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";
import { TrollButton } from "@/components/TrollButton";

/**
 * Cartões de seleção lado a lado: cada lado abre o catálogo
 * pesquisável; o "VS" separa os dois, com botões para inverter
 * os lados ou sortear um duelo sem reabrir os seletores.
 * Lados vazios mostram um convite tracejado para escolher.
 */
interface CompareSelectorsProps {
  modelA: AIModel | null;
  modelB: AIModel | null;
  onAbrirA: () => void;
  onAbrirB: () => void;
  /** Inverte os lados mantendo os mesmos modelos. */
  onTrocar: () => void;
  /** Sorteia dois modelos com benchmarks reais. */
  onAleatorio: () => void;
}

function SelectorCard({
  badge,
  model,
  rotulo,
  onAbrir,
}: {
  badge: "A" | "B";
  model: AIModel | null;
  rotulo: string;
  onAbrir: () => void;
}) {
  const corLado = "#18181b";
  if (!model) {
    return (
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`${rotulo}: nenhum modelo escolhido. Ativar para escolher.`}
        className="group flex flex-1 items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50/40 active:scale-[0.99]"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-stone-500 transition group-hover:rotate-90 group-hover:border-indigo-400 group-hover:text-indigo-600"
          style={{ transitionDuration: "0.4s" }}
        >
          <Plus size={18} />
        </span>
        <span className="text-sm font-bold text-stone-500 group-hover:text-zinc-900">
          Escolher o Modelo {badge}
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`${rotulo}: ${model.nomeCurto}. Ativar para trocar de modelo.`}
      style={{ "--cor": model.cor } as CSSProperties}
      className="sel-glow sheen group relative flex flex-1 items-center gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white px-5 py-5 text-left shadow-sm hover:bg-white active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="ghost-letter"
        style={{ WebkitTextStrokeColor: `${corLado}30` }}
      >
        {badge}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${corLado}, transparent)`,
        }}
      />
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 transition group-hover:border-indigo-400 group-hover:text-indigo-600"
      >
        <Plus size={18} />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <ModelLogo
          nome={model.nomeCurto}
          dominio={model.dominioLogo}
          cor={model.cor}
          tamanho={44}
        />
        <span className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase"
            style={{ color: corLado }}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: corLado }}
            />
            Modelo {badge}
          </span>
          <span className="block truncate text-base font-bold text-zinc-900">
            {model.nomeCurto}
          </span>
          <span className="block truncate text-xs text-stone-500">
            {model.empresa} · {formatContext(model.contexto)} ctx ·{" "}
            {formatPrice(model.precoEntrada)}/M
          </span>
        </span>
      </span>
    </button>
  );
}

export function CompareSelectors({
  modelA,
  modelB,
  onAbrirA,
  onAbrirB,
  onTrocar,
  onAleatorio,
}: CompareSelectorsProps) {
  const [giros, setGiros] = useState(0);
  return (
    <section aria-labelledby="selecao-modelos" id="comparar" className="scroll-mt-20">
      <h2 id="selecao-modelos" className="sr-only">
        Escolha os modelos para comparar
      </h2>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <SelectorCard badge="A" model={modelA} rotulo="Modelo A" onAbrir={onAbrirA} />
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 py-1">
          <span className="duel-medal inline-flex rounded-full">
            <TrollButton />
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTrocar}
              title="Trocar os lados A e B"
              aria-label="Trocar os lados A e B"
              className="swap-btn btn-ghost flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
            >
              <ArrowLeftRight
                size={12}
                aria-hidden="true"
                className="swap-icon"
              />
              Trocar
            </button>
            <button
              type="button"
              onClick={() => {
                onAleatorio();
                setGiros((g) => g + 1);
              }}
              title="Sortear dois modelos aleatórios"
              aria-label="Sortear dois modelos aleatórios"
              className="btn-ghost flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
            >
              <span key={giros} className="dice-spin inline-flex">
                <Dices size={12} aria-hidden="true" />
              </span>
              Sortear
            </button>
          </div>
        </div>
        <SelectorCard badge="B" model={modelB} rotulo="Modelo B" onAbrir={onAbrirB} />
      </div>
    </section>
  );
}
