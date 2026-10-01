/**
 * Passo 2 — Catálogo de modelos (snapshot real do OpenRouter).
 * Funde o JSON gerado por `npm run models:fetch` com os metadados de
 * fornecedor e os benchmarks editoriais. Variantes de lote (`:batch`)
 * e aliases (`~`) são excluídos da UI.
 */
import {
  type AIModel,
  type ArenaScore,
  type CategoryKey,
  type Evidencia,
  type ModelFonte,
  type ModelVariant,
  type ScoreFonte,
} from "@/types/ai-model";
import ARENA_DATA from "./arena-ratings.json" with { type: "json" };
import AA_DIRECT_DATA from "./aa-ratings.json" with { type: "json" };
import {
  modelLogoUrl,
  normalizeProvider,
  providerColor,
  providerDisplayName,
} from "@/data/providers";
import DATA from "./openrouter-models.json" with { type: "json" };
import HF_DATA from "./hf-stats.json" with { type: "json" };

/** Registo do snapshot OpenRouter (ficheiro ou API ao vivo, mesmo formato). */
export interface RawModel {
  id: string;
  nome: string;
  provider: string;
  descricao: string;
  contexto: number;
  precoEntrada: number;
  precoSaida: number;
  modalidades: { entrada: string[]; saida: string[] };
  ferramentas: boolean;
  saidaEstruturada: boolean;
  raciocinio: boolean;
  benchmarks?: {
    aa?: {
      intelligence_index?: number | null;
      coding_index?: number | null;
      agentic_index?: number | null;
    };
    design_arena?: {
      arena?: string;
      category?: string;
      elo?: number;
      rank?: number | null;
      win_rate?: number | null;
    }[];
  };
}

function varianteOf(id: string): ModelVariant {
  if (id.startsWith("~")) return "alias";
  if (id.includes(":")) return "batch";
  return "base";
}

/** Remove o prefixo "Fornecedor: " do nome do OpenRouter. */
export function shortName(nome: string): string {
  const idx = nome.indexOf(": ");
  const curto = idx >= 0 ? nome.slice(idx + 2) : nome;
  return curto.replace(/\s*\(batch\)\s*$/i, "").trim() || nome;
}

interface ArenaEntry {
  elo: number;
  votos: number;
  rank: number;
  arena: string;
  via?: string;
}

interface ArenaFile {
  publishDate: string;
  minMax: {
    texto: { min: number; max: number };
    codigo: { min: number; max: number };
    raciocinioMatematico: { min: number; max: number };
    imagemT2I: { min: number; max: number };
    imagemVisao: { min: number; max: number };
  };
  ratings: Record<string, Partial<Record<string, ArenaEntry>>>;
}

const ARENA = ARENA_DATA as unknown as ArenaFile;

/**
 * Ratings da API direta AA indexados por id OpenRouter (ver fetch-aa).
 * Exportado para fundir valores ao vivo vindos de `/api/aa/ratings`.
 */
export interface AADirectEntry {
  intel?: number | null;
  coding?: number | null;
  math?: number | null;
  agentic?: number | null;
  tps?: number | null;
  ttft?: number | null;
  extras?: Record<string, number>;
  effort?: string;
  t2i?: { elo: number; rank: number | null; via?: string } | null;
}
const AA_DIRECT = (AA_DIRECT_DATA as unknown as { ratings?: Record<string, AADirectEntry> }).ratings ?? {};

/** Data de publicação do leaderboard LMArena (para a UI). */
export const ARENA_PUBLISH_DATE = ARENA.publishDate ?? "";

/** Stats Hugging Face por id OpenRouter (apenas open-weight com repo). */
const HF = (HF_DATA as unknown as {
  stats?: Record<
    string,
    { hf: string; downloads: number | null; likes: number | null; license: string | null }
  >;
}).stats ?? {};

type ArenaCat = Exclude<CategoryKey, "velocidadeInferencia">;

const DESIGN_CODIGO_CATS = new Set(["codecategories"]);
const DESIGN_IMAGEM_CATS = new Set(["image", "imageediting", "logo"]);

function toModel(
  raw: RawModel,
  aaDirect: Record<string, AADirectEntry> = AA_DIRECT,
): Omit<AIModel, "rank"> {
  const provider = normalizeProvider(raw.provider);
  const rating = ARENA.ratings[raw.id];
  const aa = raw.benchmarks?.aa;
  const design = raw.benchmarks?.design_arena ?? [];

  /** Melhor entrada Design Arena de código (models/codecategories). */
  const designCodigo = design
    .filter((d) => d.arena === "models" && DESIGN_CODIGO_CATS.has((d.category ?? "").toLowerCase()) && Number.isFinite(d.elo))
    .sort((a, b) => (b.elo as number) - (a.elo as number))[0];
  /** Melhor entrada Design Arena de imagem (image/imageediting/logo). */
  const designImagem = design
    .filter((d) => DESIGN_IMAGEM_CATS.has((d.category ?? "").toLowerCase()) && Number.isFinite(d.elo))
    .sort((a, b) => (b.elo as number) - (a.elo as number))[0];

  const num = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

  // Métrica nativa por quesito (ordem de prioridade abaixo).
  // Sem normalização: sem dado público, exibe "—" (nunca inventa).
  const direto = aaDirect[raw.id];
  const effTxt =
    direto && direto.effort && direto.effort !== "base"
      ? ` · esforço ${direto.effort}`
      : "";
  const usa = (cat: CategoryKey): { fonte: ScoreFonte; ev: Evidencia } => {
    // 1) API direta AA (mais fresca e completa que o espelho).
    if (cat === "codigo" && num(direto?.coding)) {
      const v = direto.coding as number;
      return {
        fonte: "aa",
        ev: {
          fonte: "aa",
          origem: "AA",
          valor: `${v}`,
          titulo: `Artificial Analysis coding_index ${v} (API direta${effTxt})`,
        },
      };
    }
    if (cat === "texto" && num(direto?.intel)) {
      const v = direto.intel as number;
      return {
        fonte: "aa",
        ev: {
          fonte: "aa",
          origem: "AA",
          valor: `${v}`,
          titulo: `Artificial Analysis intelligence_index ${v} (API direta${effTxt})`,
        },
      };
    }
    if (cat === "raciocinioMatematico" && num(direto?.math)) {
      const v = direto.math as number;
      return {
        fonte: "aa",
        ev: {
          fonte: "aa",
          origem: "AA",
          valor: `${v}`,
          titulo: `Artificial Analysis math_index ${v} (API direta${effTxt})`,
        },
      };
    }
    if (cat === "imagem" && direto?.t2i && num(direto.t2i.elo)) {
      const t = direto.t2i;
      return {
        fonte: "aa",
        ev: {
          fonte: "aa",
          origem: "AA",
          valor: `${Math.round(t.elo)}`,
          titulo: `AA text-to-image · Elo ${Math.round(t.elo)} · rank ${t.rank ?? "?"} (API direta)`,
          via: "aa-t2i",
        },
      };
    }
    if (cat === "velocidadeInferencia" && num(direto?.tps)) {
      const v = direto.tps as number;
      const fmt = (Math.round(v * 10) / 10).toLocaleString("pt-PT");
      return {
        fonte: "aa",
        ev: {
          fonte: "aa",
          origem: "AA",
          valor: `${fmt} tok/s`,
          titulo: `Artificial Analysis median_output_tokens_per_second ${v} (API direta${effTxt})`,
        },
      };
    }
    // 2) Espelho AA + Design Arena via OpenRouter (casamento exato por id).
    if (cat === "codigo") {
      const v = aa?.coding_index;
      if (num(v)) {
        return {
          fonte: "openrouter",
          ev: {
            fonte: "openrouter",
            origem: "AA",
            valor: `${v}`,
            titulo: `Artificial Analysis coding_index ${v} (via OpenRouter)`,
          },
        };
      }
      if (designCodigo) {
        const elo = designCodigo.elo as number;
        return {
          fonte: "openrouter",
          ev: {
            fonte: "openrouter",
            origem: "Design Arena",
            valor: `${Math.round(elo)}`,
            titulo: `Design Arena ${designCodigo.category} · Elo ${Math.round(elo)} · rank ${designCodigo.rank ?? "?"} (via OpenRouter)`,
          },
        };
      }
    }
    if (cat === "texto") {
      const v = aa?.intelligence_index;
      if (num(v)) {
        return {
          fonte: "openrouter",
          ev: {
            fonte: "openrouter",
            origem: "AA",
            valor: `${v}`,
            titulo: `Artificial Analysis intelligence_index ${v} (via OpenRouter)`,
          },
        };
      }
    }
    if (cat === "imagem") {
      if (designImagem) {
        const elo = designImagem.elo as number;
        return {
          fonte: "openrouter",
          ev: {
            fonte: "openrouter",
            origem: "Design Arena",
            valor: `${Math.round(elo)}`,
            titulo: `Design Arena ${designImagem.category} · Elo ${Math.round(elo)} · rank ${designImagem.rank ?? "?"} (via OpenRouter)`,
            via: "design",
          },
        };
      }
    }
    // 3) Elo LMArena (correspondência exata; aviso: sem velocidade aqui).
    if (cat !== "velocidadeInferencia") {
      const r = rating?.[cat as ArenaCat];
      if (r && Number.isFinite(r.elo)) {
        return {
          fonte: "arena",
          ev: {
            fonte: "arena",
            origem: "LMArena",
            valor: `${r.elo}`,
            titulo: `LMArena ${r.arena} · Elo ${r.elo} · ${r.votos.toLocaleString("pt-PT")} votos · rank ${r.rank}`,
            via: r.via,
          },
        };
      }
    }
    return {
      fonte: "estimativa",
      ev: {
        fonte: "estimativa",
        origem: "Estimativa",
        valor: "—",
        titulo: "Sem benchmark público; sem nota",
      },
    };
  };

  const codigo = usa("codigo");
  const texto = usa("texto");
  const imagem = usa("imagem");
  const mat = usa("raciocinioMatematico");
  const vel = usa("velocidadeInferencia");

  const fontes: Record<CategoryKey, ScoreFonte> = {
    codigo: codigo.fonte,
    texto: texto.fonte,
    imagem: imagem.fonte,
    raciocinioMatematico: mat.fonte,
    velocidadeInferencia: vel.fonte,
  };
  const evidencias: Record<CategoryKey, Evidencia> = {
    codigo: codigo.ev,
    texto: texto.ev,
    imagem: imagem.ev,
    raciocinioMatematico: mat.ev,
    velocidadeInferencia: vel.ev,
  };
  const arena: Partial<Record<CategoryKey, ArenaScore>> = {};
  for (const cat of [
    "codigo",
    "texto",
    "imagem",
    "raciocinioMatematico",
  ] as const) {
    const r = rating?.[cat];
    if (r && Number.isFinite(r.elo)) {
      arena[cat] = {
        elo: r.elo,
        votos: r.votos,
        rank: r.rank,
        arena: r.arena,
        via: r.via,
      };
    }
  }
  const reais = (Object.values(fontes) as ScoreFonte[]).filter(
    (f) => f !== "estimativa",
  );
  const fonte: ModelFonte =
    reais.length === 0
      ? "estimativa"
      : reais.every((f) => f === reais[0])
        ? (reais[0] as ModelFonte)
        : "mista";
  // Ficha AA fundida (direto primeiro, espelho como fallback) + velocidade.
  const pickNum = (...vs: unknown[]): number | null => {
    for (const v of vs) {
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  };
  const aaM: NonNullable<AIModel["aa"]> = {};
  const intel = pickNum(direto?.intel, aa?.intelligence_index);
  const cod = pickNum(direto?.coding, aa?.coding_index);
  const ag = pickNum(direto?.agentic, aa?.agentic_index);
  const matI = pickNum(direto?.math);
  const tps = pickNum(direto?.tps);
  const ttft = pickNum(direto?.ttft);
  if (intel != null) aaM.intelligence_index = intel;
  if (cod != null) aaM.coding_index = cod;
  if (ag != null) aaM.agentic_index = ag;
  if (matI != null) aaM.math_index = matI;
  if (tps != null) aaM.tps = tps;
  if (ttft != null) aaM.ttft = ttft;
  const extras =
    direto?.extras && Object.keys(direto.extras).length
      ? direto.extras
      : undefined;
  return {
    ...raw,
    provider,
    nomeCurto: shortName(raw.nome),
    empresa: providerDisplayName(raw.provider),
    dominioLogo: modelLogoUrl(raw.provider, raw.id),
    cor: providerColor(raw.provider),
    fontes,
    evidencias,
    arena,
    aa: Object.keys(aaM).length ? aaM : undefined,
    extras,
    t2i:
      direto?.t2i && num(direto.t2i.elo)
        ? { elo: direto.t2i.elo, rank: direto.t2i.rank ?? null }
        : undefined,
    designArena:
      designCodigo || designImagem
        ? {
            codigo: designCodigo
              ? {
                  elo: designCodigo.elo as number,
                  rank: designCodigo.rank ?? null,
                  category: String(designCodigo.category ?? ""),
                }
              : undefined,
            imagem: designImagem
              ? {
                  elo: designImagem.elo as number,
                  rank: designImagem.rank ?? null,
                  category: String(designImagem.category ?? ""),
                }
              : undefined,
          }
        : undefined,
    designTodas: design
      .filter((d) => num(d.elo))
      .map((d) => ({
        arena: String(d.arena ?? ""),
        category: String(d.category ?? ""),
        elo: d.elo as number,
        rank: d.rank ?? null,
        win_rate: typeof d.win_rate === "number" ? d.win_rate : null,
      })),
    fonte,
    hf: HF[raw.id],
    variante: varianteOf(raw.id),
  };
}

const rawModels = (DATA as { models: RawModel[] }).models ?? [];

/** Data/hora da captura do snapshot (ISO). */
export const DATA_GENERATED_AT =
  (DATA as { generatedAt?: string }).generatedAt ?? "";

/**
 * Chave de ordenação do ranking geral: índice AA de Inteligência
 * primeiro (a métrica exibida nas fichas e na aba de benchmark —
 * posição e número ficam sempre coerentes); modelos sem índice
 * ordenados entre si pelo Elo LMArena, após todos os que têm índice.
 * Valores SEMPRE nativos — sem calibragens nem extrapolações.
 */
function chaveRank(m: Omit<AIModel, "rank">): [number, number] {
  const intel = m.aa?.intelligence_index;
  const elo = m.arena.texto?.elo;
  return [
    typeof intel === "number" && Number.isFinite(intel) ? intel : -Infinity,
    typeof elo === "number" && Number.isFinite(elo) ? elo : -Infinity,
  ];
}

/**
 * Constrói um catálogo ordenado a partir de registos OpenRouter
 * (snapshot embutido ou resposta ao vivo da API — o merge com
 * arena/AA/HF é o mesmo para ambos).
 */
export interface CatalogoPronto {
  models: AIModel[];
  /** Total de registos brutos (inclui lotes e aliases). */
  total: number;
}

export function buildCatalogo(
  rawModels: RawModel[],
  aaDirect: Record<string, AADirectEntry> = AA_DIRECT,
): CatalogoPronto {
  const models = rawModels
    .map((raw) => toModel(raw, aaDirect))
    // Sem lotes, aliases, roteadores OpenRouter nem roteadores com
    // preço sentinela negativo (ex.: typesafe/jev-router): preço
    // negativo nunca é preço real, é roteamento automático.
    .filter(
      (m) =>
        m.variante === "base" &&
        m.provider !== "openrouter" &&
        m.precoEntrada >= 0 &&
        m.precoSaida >= 0,
    )
    .sort((a, b) => {
      const ka = chaveRank(a);
      const kb = chaveRank(b);
      return (
        kb[0] - ka[0] || kb[1] - ka[1] || a.nomeCurto.localeCompare(b.nomeCurto)
      );
    })
    .map((m, i) => ({ ...m, rank: i + 1 }));
  return { models, total: rawModels.length };
}

const STATIC = buildCatalogo(rawModels);

export const AI_MODELS: AIModel[] = STATIC.models;

/** Total de registos no snapshot (inclui lotes e aliases). */
export const DATA_COUNT_TOTAL = STATIC.total;

/** Lookup rápido por id. */
export const MODELS_BY_ID: Record<string, AIModel> = Object.fromEntries(
  AI_MODELS.map((m) => [m.id, m]),
);

/** Opções de fornecedor com contagem, para o filtro do catálogo. */
export interface ProviderOption {
  slug: string;
  nome: string;
  count: number;
}

export function buildProviderOptions(models: AIModel[]): ProviderOption[] {
  return Object.values(
    models.reduce(
      (acc, m) => {
        acc[m.provider] ??= {
          slug: m.provider,
          nome: m.empresa,
          count: 0,
        };
        acc[m.provider].count++;
        return acc;
      },
      {} as Record<string, ProviderOption>,
    ),
  ).sort((a, b) => b.count - a.count);
}

export const PROVIDER_OPTIONS: ProviderOption[] =
  buildProviderOptions(AI_MODELS);

/** Par padrão da comparação (ambos com Elo real LMArena). */
export const DEFAULT_MODEL_A = "anthropic/claude-opus-5";
export const DEFAULT_MODEL_B = "openai/gpt-5.5";
