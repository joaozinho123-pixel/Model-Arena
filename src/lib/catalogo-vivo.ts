/**
 * Catálogo OpenRouter ao vivo (browser): busca o endpoint público
 * (`GET /api/v1/models`, com CORS, sem chave), compacta com a MESMA
 * lógica de `scripts/fetch-openrouter.mjs` e funde via `buildCatalogo`
 * (arena/AA/HF embutidos). Falha graciosa (null) → a UI mantém o
 * snapshot embutido. Nunca inventa: sem resposta válida, sem dados.
 */
import type { AADirectEntry } from "@/data/models";
import type { RawModel } from "@/data/models";
import { rawDeApiModel } from "@/lib/openrouter-raw";

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
        const r = rawDeApiModel(m as Record<string, unknown>);
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
