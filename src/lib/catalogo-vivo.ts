/**
 * Catálogo OpenRouter ao vivo (browser): busca o endpoint público
 * (`GET /api/v1/models`, com CORS, sem chave), compacta com a MESMA
 * lógica de `scripts/fetch-openrouter.mjs` e funde via `buildCatalogo`
 * (arena/AA/HF embutidos). Falha graciosa (null) → a UI mantém o
 * snapshot embutido. Nunca inventa: sem resposta válida, sem dados.
 */
import type { AADirectEntry } from "@/data/models";
import type { RawModel } from "@/data/models";

export interface CatalogoVivo {
  /** Registos brutos (a fusão acontece em `buildCatalogo`). */
  raw: RawModel[];
  /** ISO da captura (hora do browser). */
  generatedAt: string;
  /** Total de registos brutos. */
  total: number;
}

export interface AaVivo {
  ratings: Record<string, AADirectEntry>;
  generatedAt: string;
}

const API_URL = "https://openrouter.ai/api/v1/models";

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

function toRaw(m: Record<string, unknown>): RawModel | null {
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

/**
 * Busca e funde o catálogo ao vivo. Resolve null em qualquer falha
 * (rede, timeout, formato inesperado) — a UI usa o snapshot local.
 * Chamadas concorrentes partilham o mesmo voo (sem fetch duplicado).
 */
let emVoo: Promise<CatalogoVivo | null> | null = null;

export function buscarCatalogoVivo(): Promise<CatalogoVivo | null> {
  if (!emVoo) {
    emVoo = buscarInterno().finally(() => {
      emVoo = null;
    });
  }
  return emVoo;
}

async function buscarInterno(): Promise<CatalogoVivo | null> {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(API_URL, { signal: ctrl.signal });
    window.clearTimeout(t);
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: unknown };
    const raw = Array.isArray(payload?.data) ? payload.data : null;
    if (!raw || raw.length < 50) return null; // resposta truncada/estranha: descarta
    const modelos: RawModel[] = [];
    for (const m of raw) {
      if (m && typeof m === "object") {
        const r = toRaw(m as Record<string, unknown>);
        if (r) modelos.push(r);
      }
    }
    if (modelos.length < 50) return null;
    modelos.sort((a, b) =>
      a.provider === b.provider
        ? a.nome.localeCompare(b.nome)
        : a.provider.localeCompare(b.provider),
    );
    return {
      raw: modelos,
      generatedAt: new Date().toISOString(),
      total: raw.length,
    };
  } catch {
    return null;
  }
}

/** Valida a forma da resposta de `/api/aa/ratings` (nunca confia cegamente). */
function ratingsValidos(v: unknown): v is Record<string, AADirectEntry> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const rec = v as Record<string, unknown>;
  const ids = Object.keys(rec);
  if (ids.length < 10) return false;
  let numericos = 0;
  for (const k of ids.slice(0, 60)) {
    const r = rec[k] as Record<string, unknown> | null;
    if (!r || typeof r !== "object") return false;
    for (const f of ["intel", "coding", "math", "agentic", "tps", "ttft"]) {
      const n = (r as Record<string, unknown>)[f];
      if (typeof n === "number") {
        if (!Number.isFinite(n)) return false;
        numericos++;
      } else if (n != null) {
        return false;
      }
    }
  }
  return numericos > 0;
}

let emVooAa: Promise<AaVivo | null> | null = null;

/**
 * Busca os ratings AA ao vivo na NOSSA rota (`/api/aa/ratings`, que usa
 * a chave do servidor). Resolve null em qualquer falha — a UI usa os
 * dados AA embutidos. A chave nunca transita para o navegador.
 */
export function buscarAaVivo(): Promise<AaVivo | null> {
  if (!emVooAa) {
    emVooAa = buscarAaInterno().finally(() => {
      emVooAa = null;
    });
  }
  return emVooAa;
}

async function buscarAaInterno(): Promise<AaVivo | null> {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch("/api/aa/ratings", { signal: ctrl.signal });
    window.clearTimeout(t);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      generatedAt?: unknown;
      ratings?: unknown;
    };
    if (typeof j.generatedAt !== "string" || !ratingsValidos(j.ratings)) {
      return null;
    }
    return { ratings: j.ratings, generatedAt: j.generatedAt };
  } catch {
    return null;
  }
}
