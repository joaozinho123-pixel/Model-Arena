"use client";

import { ArrowLeftRight, Dices, Plus } from "lucide-react";
import type { AIModel } from "@/types/ai-model";
import { formatContext, formatPrice } from "@/lib/format";
import { ModelLogo } from "@/components/ModelLogo";
import { ShareLinkButton } from "@/components/ShareLinkButton";

/**
 * Cartões de seleção lado a lado: cada lado abre o catálogo
 * pesquisável; o "VS" separa os dois, com ações para trocar os
 * lados ou sortear um duelo. Lados vazios mostram um convite
 * tracejado.
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

function Slot({
  badge,
  model,
  onAbrir,
}: {
  badge: "A" | "B";
  model: AIModel | null;
  onAbrir: () => void;
}) {
  if (!model) {
    return (
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Modelo ${badge}: nenhum modelo escolhido. Ativar para escolher.`}
        className="flex min-h-[76px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white text-sm font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800"
      >
        <Plus size={16} aria-hidden="true" />
        Escolher modelo {badge}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Modelo ${badge}: ${model.nomeCurto}. Ativar para trocar de modelo.`}
      className="card card-hover flex w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <ModelLogo
        nome={model.nomeCurto}
        dominio={model.dominioLogo}
        cor={model.cor}
        tamanho={40}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Modelo {badge}
        </span>
        <span className="block truncate text-sm font-semibold text-zinc-900">
          {model.nomeCurto}
        </span>
        <span className="block truncate text-xs text-zinc-500">
          {model.empresa} · {formatContext(model.contexto)} ctx ·{" "}
          {formatPrice(model.precoEntrada)}/M
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
  return (
    <section id="comparar" aria-labelledby="selecao-modelos" className="scroll-mt-24">
      <h2 id="selecao-modelos" className="sr-only">
        Escolha os modelos para comparar
      </h2>
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Slot badge="A" model={modelA} onAbrir={onAbrirA} />
        <div className="flex sm:flex-col items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-900"
          >
            VS
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onTrocar}
              title="Trocar os lados A e B"
              aria-label="Trocar os lados A e B"
              className="btn-ghost h-7 rounded-lg px-2 text-[11px]"
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              Trocar
            </button>
            <button
              type="button"
              onClick={onAleatorio}
              title="Sortear dois modelos aleatórios"
              aria-label="Sortear dois modelos aleatórios"
              className="btn-ghost h-7 rounded-lg px-2 text-[11px]"
            >
              <Dices size={12} aria-hidden="true" />
              Sortear
            </button>
          </div>
        </div>
        <Slot badge="B" model={modelB} onAbrir={onAbrirB} />
      </div>

      <div className="mt-2 flex justify-end">
        <ShareLinkButton
          href={
            modelA && modelB
              ? `/?a=${encodeURIComponent(modelA.id)}&b=${encodeURIComponent(modelB.id)}`
              : null
          }
          rotulo="Partilhar duelo"
          titulo="Copiar ligação deste duelo"
        />
      </div>
    </section>
  );
}
