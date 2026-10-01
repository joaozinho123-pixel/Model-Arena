/**
 * Busca o catálogo público de modelos do OpenRouter e grava um snapshot
 * compacto em `src/data/openrouter-models.json`.
 *
 * Uso: `npm run models:fetch`
 * Não requer chave de API (endpoint público).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://openrouter.ai/api/v1/models";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(rootDir, "src", "data", "openrouter-models.json");

function perMillion(value) {
  const n = Number.parseFloat(value ?? "0");
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1_000_000 * 100) / 100;
}

function parseModalities(modality) {
  // Formato OpenRouter: "text+image->text" | "text->text+image" | etc.
  if (typeof modality !== "string" || !modality.includes("->")) {
    return { entrada: ["text"], saida: ["text"] };
  }
  const [rawIn, rawOut] = modality.split("->");
  const split = (s) =>
    s
      .split("+")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  return { entrada: split(rawIn), saida: split(rawOut) };
}

function toFlags(model) {  const params = Array.isArray(model.supported_parameters)
    ? model.supported_parameters
    : [];
  const has = (...keys) => keys.some((k) => params.includes(k));
  const reasoningCfg = model.reasoning ?? {};
  return {
    ferramentas: has("tools", "tool_choice"),
    saidaEstruturada: has("response_format", "structured_outputs"),
    raciocinio:
      has("reasoning", "include_reasoning", "reasoning_effort") ||
      Object.keys(reasoningCfg).length > 0,
  };
}

/** Compacta benchmarks públicos (AA + Design Arena) preservando IDs do catálogo. */
function compactBenchmarks(b) {
  if (!b || typeof b !== "object") return undefined;
  const num = (v) => (Number.isFinite(v) ? v : null);
  const aa = b.artificial_analysis ?? {};
  const design = Array.isArray(b.design_arena)
    ? b.design_arena
        .filter((d) => d && Number.isFinite(d?.elo))
        .map((d) => ({
          arena: String(d.arena ?? ""),
          category: String(d.category ?? ""),
          elo: d.elo,
          rank: Number.isFinite(d.rank) ? d.rank : null,
          win_rate: Number.isFinite(d.win_rate) ? d.win_rate : null,
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

const res = await fetch(API_URL, {
  headers: { "User-Agent": "model-arena/1.0" },
});
if (!res.ok) {
  throw new Error(`OpenRouter respondeu ${res.status} ${res.statusText}`);
}
const payload = await res.json();
const raw = Array.isArray(payload?.data) ? payload.data : [];

const models = raw.map((m) => {
  const id = String(m.id ?? "");
  const provider = id.includes("/") ? id.split("/")[0] : "outros";
  const pricing = m.pricing ?? {};
  const modalidades = parseModalities(m.architecture?.modality);
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
    modalidades,
    ...toFlags(m),
    benchmarks: compactBenchmarks(m.benchmarks),
  };
});

// Ordena por fornecedor e nome para um catálogo estável.
models.sort((a, b) =>
  a.provider === b.provider
    ? a.nome.localeCompare(b.nome)
    : a.provider.localeCompare(b.provider),
);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify(
    { generatedAt: new Date().toISOString(), count: models.length, models },
  ),
);
console.log(`OK: ${models.length} modelos gravados em ${outFile}`);
