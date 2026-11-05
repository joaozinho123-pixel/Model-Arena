"use client";

import { MODELS_BY_ID } from "@/data/models";
import type { AIModel } from "@/types/ai-model";
import { ModelLogo } from "@/components/ModelLogo";

/**
 * Presets de comparação: pares prontos que preenchem o duelo
 * com um clique. Sem descrições nem cartões — só chips.
 */
interface Preset {
  titulo: string;
  ids: [string, string];
}

const PRESETS: Preset[] = [
  { titulo: "Modelos topo", ids: ["anthropic/claude-opus-5.5", "openai/gpt-6-astra"] },
  { titulo: "Para código", ids: ["anthropic/claude-fable-5.1", "moonshotai/kimi-k3"] },
  { titulo: "Custo baixo", ids: ["deepseek/deepseek-v3.2", "openai/gpt-5.6-luna"] },
  { titulo: "Imagem", ids: ["google/gemini-3.1-flash-image", "openai/gpt-5-image"] },
];

export function CategoryShortcuts({
  onSelect,
}: {
  onSelect: (aId: string, bId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Presets de comparação">
      <span className="mr-1 text-xs text-zinc-400">Começar com:</span>
      {PRESETS.map(({ titulo, ids }) => {
        const modelos = ids
          .map((id) => MODELS_BY_ID[id])
          .filter((m): m is AIModel => m != null);
        if (modelos.length < 2) return null;
        return (
          <button
            key={titulo}
            type="button"
            onClick={() => onSelect(modelos[0].id, modelos[1].id)}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-2 pr-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            <span className="flex items-center" aria-hidden="true">
              {modelos.map((m) => (
                <ModelLogo
                  key={m.id}
                  nome={m.nomeCurto}
                  dominio={m.dominioLogo}
                  cor={m.cor}
                  tamanho={20}
                />
              ))}
            </span>
            {titulo}
          </button>
        );
      })}
    </div>
  );
}
