"use client";

import { ArrowRight, Crown, ImageIcon, PiggyBank, Code2 } from "lucide-react";
import { MODELS_BY_ID } from "@/data/models";
import type { AIModel } from "@/types/ai-model";
import { ModelLogo } from "@/components/ModelLogo";

/**
 * Atalhos por categoria (estilo OpenRouter): cada cartão aplica
 * um par de modelos à comparação com um clique.
 */
interface Shortcut {
  icone: typeof Code2;
  titulo: string;
  descricao: string;
  ids: [string, string, string?];
}

const SHORTCUTS: Shortcut[] = [
  {
    icone: Crown,
    titulo: "Modelos emblemáticos",
    descricao:
      "A ponta de cada laboratório em set/2026: Opus 5.5 (AA #1 e Elo #1), GPT-6 Astra e Gemini 3.8 Flash.",
    ids: [
      "anthropic/claude-opus-5.5",
      "openai/gpt-6-astra",
      "google/gemini-3.8-flash",
    ],
  },
  {
    icone: Code2,
    titulo: "Melhor para código",
    descricao:
      "Índice AA de codificação no topo (Fable 5.1: 81.6) e o #1 da arena de código (Kimi K3).",
    ids: [
      "anthropic/claude-fable-5.1",
      "moonshotai/kimi-k3",
      "openai/gpt-5.6-sol",
    ],
  },
  {
    icone: PiggyBank,
    titulo: "Mais acessível",
    descricao: "Modelos de baixo custo mais utilizados.",
    ids: [
      "deepseek/deepseek-v3.2",
      "openai/gpt-5.6-luna",
      "z-ai/glm-4.6",
    ],
  },
  {
    icone: ImageIcon,
    titulo: "Geração de imagens",
    descricao: "Modelos de imagem de referência dos laboratórios.",
    ids: [
      "google/gemini-3.1-flash-image",
      "openai/gpt-5-image",
      "google/gemini-3.8-flash",
    ],
  },
];

export function CategoryShortcuts({
  onSelect,
}: {
  onSelect: (aId: string, bId: string) => void;
}) {
  return (
    <section aria-label="Atalhos por categoria" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {SHORTCUTS.map(({ icone: Icon, titulo, descricao, ids }) => {
        const modelos = ids
          .filter((id): id is string => id != null)
          .map((id) => MODELS_BY_ID[id])
          .filter((m): m is AIModel => m != null);
        if (modelos.length < 2) return null;
        return (
          <button
            key={titulo}
            type="button"
            onClick={() => onSelect(modelos[0].id, modelos[1].id)}
            className="wiggle-hover group glass-card card-hover p-4 text-left"
          >
            <span className="flex items-center gap-1.5" aria-hidden="true">
              {modelos.map((m) => (
                <ModelLogo
                  key={m.id}
                  nome={m.nomeCurto}
                  dominio={m.dominioLogo}
                  cor={m.cor}
                  tamanho={24}
                />
              ))}
            </span>
            <span className="mt-2.5 flex items-center gap-1.5 text-sm font-bold text-zinc-900">
              <Icon
                size={15}
                aria-hidden="true"
                className="wiggle-target text-indigo-600"
              />
              {titulo}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-500">
              {descricao}
            </span>
            <span className="mt-2.5 flex items-center justify-between gap-1 border-t border-stone-100 pt-2 text-xs font-medium text-stone-500 transition group-hover:text-zinc-900">
              <span className="truncate">
                {modelos.map((m) => m.nomeCurto).join(" · ")}
              </span>
              <ArrowRight
                size={13}
                aria-hidden="true"
                className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
              />
            </span>
          </button>
        );
      })}
    </section>
  );
}
