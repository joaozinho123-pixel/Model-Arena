/**
 * Conversão PURA de registos OpenRouter -> `RawModel` (sem `window`,
 * sem fetch). Partilhada pelo catálogo ao vivo do browser
 * (`catalogo-vivo.ts`) e pela ficha servidor de modelos que ainda não
 * estão no snapshot (`modelo-vivo-servidor.ts`).
 *
 * A lógica é a MESMA de `scripts/fetch-openrouter.mjs` — uma só
 * fonte de verdade para o formato cru do catálogo.
 */
import type { RawModel } from "@/data/models";

function perMillion(value: unknown): number {
  const n = typeof value === "string" || typeof value === "number" ? Number.parseFloat(String(value)) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1_000_000 * 100) / 100;
}

function parseModalities(modality: unknown): { entrada: string[]; saida: string[] } {
  if (typeof modality !== "string" || !modality.includes("->")) {
    return { entrada: ["text"], saida: ["text"] };
  }
  const [rawIn, rawOut] = modality.split("->");
  const split = (s: string) =>
    s
      .split("+")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  return { entrada: split(rawIn ?? ""), saida: split(rawOut ?? "") };
}

function toFlags(model: Record<string, unknown>): {
  ferramentas: boolean;
  saidaEstruturada: boolean;
  raciocinio: boolean;
} {
  const params = Array.isArray(model.supported_parameters)
    ? (model.supported_parameters as unknown[])
    : [];
  const has = (...keys: string[]) => keys.some((k) => params.includes(k));
  const reasoningCfg = (model.reasoning ?? {}) as Record<string, unknown>;
  return {
    ferramentas: has("tools", "tool_choice"),
    saidaEstruturada: has("response_format", "structured_outputs"),
    raciocinio:
      has("reasoning", "include_reasoning", "reasoning_effort") ||
      Object.keys(reasoningCfg).length > 0,
  };
}

function compactBenchmarks(b: unknown):
  | {
      aa: {
        intelligence_index: number | null;
        coding_index: number | null;
        agentic_index: number | null;
      };
      design_arena: {
        arena: string;
        category: string;
        elo: number;
        rank: number | null;
        win_rate: number | null;
      }[];
    }
  | undefined {
  if (!b || typeof b !== "object") return undefined;
  const rec = b as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const aa = (rec.artificial_analysis ?? {}) as Record<string, unknown>;
  const design = Array.isArray(rec.design_arena)
    ? (rec.design_arena as Record<string, unknown>[])
        .filter((d) => d && Number.isFinite(d?.elo))
        .map((d) => ({
          arena: String(d.arena ?? ""),
          category: String(d.category ?? ""),
          elo: d.elo as number,
          rank: Number.isFinite(d.rank) ? (d.rank as number) : null,
          win_rate: Number.isFinite(d.win_rate) ? (d.win_rate as number) : null,
        }))
    : [];
  const out = {
    aa: {
      intelligence_index: num(aa.intelligence_index),
      coding_index: num(aa.coding_index),
      agentic_index: num(aa.agentic_index),
    },
    design_arena: design,
  };
  if (
    out.aa.intelligence_index == null &&
    out.aa.coding_index == null &&
    out.aa.agentic_index == null &&
    out.design_arena.length === 0
  ) {
    return undefined;
  }
  return out;
}

/** Registo cru do catálogo a partir de um modelo da API OpenRouter. */
export function rawDeApiModel(m: Record<string, unknown>): RawModel | null {
  const id = String(m.id ?? "");
  if (!id) return null;
  const provider = id.includes("/") ? id.split("/")[0] : "outros";
  const pricing = (m.pricing ?? {}) as Record<string, unknown>;
  const descricao = String(m.description ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
  return {
    id,
    nome: String(m.name ?? id),
    provider,
    descricao,
    contexto: Number(m.context_length ?? 0) || 0,
    precoEntrada: perMillion(pricing.prompt),
    precoSaida: perMillion(pricing.completion),
    modalidades: parseModalities(
      (m.architecture as Record<string, unknown> | undefined)?.modality,
    ),
    ...toFlags(m),
    benchmarks: compactBenchmarks(m.benchmarks),
  };
}
