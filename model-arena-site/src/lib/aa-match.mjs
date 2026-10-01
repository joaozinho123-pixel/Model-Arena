/**
 * Lógica PURA de correspondência Artificial Analysis -> ids OpenRouter.
 * Usada tanto por `scripts/fetch-aa.mjs` (snapshot em ficheiro) como por
 * `src/app/api/aa/ratings/route.ts` (resposta ao vivo): uma única fonte
 * de verdade, sem escrita em ficheiro nem acesso a chaves aqui.
 *
 * Regras (idênticas nos dois consumidores):
 * - casa o MESMO modelo (profundidade 0 = exata, 1 = sem sufixo de
 *   esforço, 2 = mesmos tokens); sem correspondência, sem dados;
 * - entre linhas do mesmo modelo, vence a avaliação MAIS COMPLETA
 *   (índices parciais não são comparáveis) e, em empate, a de menor
 *   esforço;
 * - text-to-image/image-editing só por match exato ou alias curado
 *   com dupla corroboração (nunca por palpite).
 */

/** @typedef {{ id: string, provider: string }} CatalogRef */

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[_.]/g, "-")
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s*\[.*?\]\s*/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
const flat = (s) => s.replace(/[-_]/g, "");

// AA creator -> fornecedores do catálogo.
const ORG_ALIASES = {
  alibaba: ["qwen"],
  mistral: ["mistralai"],
  xai: ["x-ai"],
  meta: ["meta", "meta-llama"],
  kimi: ["moonshotai"],
  zai: ["z-ai"],
  zhipuai: ["z-ai"],
  aws: ["amazon"],
  ibm: ["ibm-granite"],
  bytedance_seed: ["bytedance-seed", "bytedance"],
  liquidai: ["liquid"],
  "reka-ai": ["rekaai"],
  arcee: ["arcee-ai"],
};

// Peso do esforço (desempate após completude: prefere base/low para
// não inflacionar entre avaliações igualmente completas).
const EFFORT_W = { low: 1, medium: 2, high: 3, xhigh: 4, max: 5 };
const effortOf = (slug) => {
  const m = slug.match(/-(low|medium|xhigh|high|max)$/);
  return m ? m[1] : "base";
};
const effortStrip = (s) => s.replace(/-(low|medium|xhigh|high|max)$/, "");
// Último recurso: mesmos tokens por outra ordem (ex.: claude-4-5-sonnet).
const tokenKey = (s) =>
  norm(s)
    .split("-")
    .filter((t) => t && !/^(low|medium|xhigh|high|max)$/.test(t))
    .sort()
    .join("|");

const CORE_KEYS = [
  "artificial_analysis_intelligence_index",
  "artificial_analysis_coding_index",
  "artificial_analysis_math_index",
  "artificial_analysis_agentic_index",
];
const EXTRA_KEYS = [
  "mmlu_pro",
  "gpqa",
  "hle",
  "livecodebench",
  "scicode",
  "math_500",
  "aime",
  "aime_25",
  "ifbench",
  "lcr",
  "terminalbench_hard",
  "terminalbench_v2_1",
  "tau2",
  "tau_banking",
];
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Aliases curados media AA -> id OpenRouter. Só com dupla corroboração:
// o próprio OpenRouter nomeia estes ids "Nano Banana 2" e "Nano Banana
// Pro" (ver catálogo). Qualquer outro palpite fica de fora (sem inventar).
const MEDIA_ALIASES = {
  "nano-banana-2": "google/gemini-3.1-flash-image",
  "gemini-nano-banana-pro": "google/gemini-3-pro-image",
};
const stripDate = (s) => norm(s).replace(/-\d{4}-\d{2}-\d{2}$/, "");

function providersFor(base, org) {
  const o = flat(norm(org));
  const found = new Set();
  for (const m of base) {
    if (flat(m.provider) === o) found.add(m.provider);
  }
  for (const alias of ORG_ALIASES[o] ?? []) found.add(alias);
  return [...found];
}

/**
 * Cruza linhas AA (llms + media já com `via`) com o catálogo.
 * @param {unknown[]} llms linhas de `/data/llms/models`
 * @param {unknown[]} mediaRows linhas de media com campo `via`
 * @param {CatalogRef[]} base modelos base do catálogo (id + provider)
 */
export function buildAaRatings(llms, mediaRows, base) {
  const index = new Map();
  for (const m of base) {
    const [provider, ...rest] = m.id.split("/");
    const key = `${provider}||${norm(rest.join("/"))}`;
    if (!index.has(key)) index.set(key, m.id);
  }

  const grupos = new Map(); // id -> [{row, effort, weight, depth}]
  const misses = new Set();
  for (const row of llms) {
    const slug = norm(row.slug);
    const providers = providersFor(base, row.model_creator?.slug ?? "");
    let placed = false;
    // depth 0: exata · 1: sem sufixo de esforço · 2: mesmos tokens.
    const cands = [
      { key: slug, depth: 0 },
      { key: effortStrip(slug), depth: 1 },
    ];
    for (const { key, depth } of cands) {
      for (const provider of providers) {
        const hit = index.get(`${provider}||${key}`);
        if (hit) {
          const w = EFFORT_W[effortOf(slug)] ?? 0;
          if (!grupos.has(hit)) grupos.set(hit, []);
          grupos.get(hit).push({ row, effort: depth === 0 ? "base" : effortOf(slug), weight: w, depth });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (!placed) {
      // Fallback por conjunto de tokens (nomes invertidos tipo claude-4-5-sonnet).
      const tk = tokenKey(slug);
      for (const provider of providers) {
        for (const [k, id] of index) {
          if (!k.startsWith(provider + "||")) continue;
          if (tokenKey(k.split("||")[1]) === tk) {
            if (!grupos.has(id)) grupos.set(id, []);
            grupos.get(id).push({ row, effort: effortOf(slug), weight: 5, depth: 2 });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) misses.add(`${row.model_creator?.slug} :: ${row.slug}`);
    }
  }

  const ratings = {};
  let comDados = 0;
  for (const [id, linhas] of grupos) {
    linhas.sort((a, b) => {
      // 1º avaliação mais completa (nº de benchmarks com valor): evita
      // linhas parciais cujo índice não é comparável ao das completas.
      // 2º menor esforço (base/low): não inflaciona entre iguais.
      const ca =
        [...CORE_KEYS, ...EXTRA_KEYS].filter((k) => a.row.evaluations?.[k] != null)
          .length + (a.row.median_output_tokens_per_second != null ? 1 : 0);
      const cb =
        [...CORE_KEYS, ...EXTRA_KEYS].filter((k) => b.row.evaluations?.[k] != null)
          .length + (b.row.median_output_tokens_per_second != null ? 1 : 0);
      if (ca !== cb) return cb - ca;
      if (a.weight !== b.weight) return a.weight - b.weight;
      return 0;
    });
    const { row, effort } = linhas[0];
    const ev = row.evaluations ?? {};
    const rec = { aaSlug: row.slug, effort };
    for (const k of [...CORE_KEYS, ...EXTRA_KEYS]) {
      const v = num(ev[k]);
      if (v != null) rec[k.replace("artificial_analysis_", "").replace("_index", "")] = v;
    }
    // Mapeia chaves curtas para o nosso modelo de dados.
    const short = {};
    if (rec.intelligence != null) short.intel = rec.intelligence;
    if (rec.coding != null) short.coding = rec.coding;
    if (rec.math != null) short.math = rec.math;
    if (rec.agentic != null) short.agentic = rec.agentic;
    const tpsRaw = num(row.median_output_tokens_per_second);
    const tps = tpsRaw != null && tpsRaw > 0 ? tpsRaw : null;
    const ttftRaw = num(row.median_time_to_first_token_seconds);
    const ttft = ttftRaw != null && ttftRaw > 0 ? ttftRaw : null;
    const extras = {};
    for (const k of ["mmlu_pro", "gpqa", "hle", "livecodebench", "scicode", "math_500", "aime", "aime_25", "ifbench", "lcr", "terminalbench_hard", "terminalbench_v2_1", "tau2", "tau_banking"]) {
      if (num(ev[k]) != null) extras[k] = ev[k];
    }
    if (
      Object.keys(short).length === 0 &&
      tps == null &&
      Object.keys(extras).length === 0
    ) {
      continue;
    }
    comDados++;
    ratings[id] = { ...short, tps, ttft, extras, effort };
  }

  const baseIds = new Set(base.map((m) => m.id));
  let t2iMatches = 0;
  for (const row of mediaRows) {
    if (!Number.isFinite(row.elo)) continue;
    const slug = stripDate(row.slug);
    let hit = null;
    const aliasId = MEDIA_ALIASES[slug] ?? MEDIA_ALIASES[effortStrip(slug)];
    if (aliasId && baseIds.has(aliasId)) {
      hit = aliasId;
    } else {
      for (const provider of providersFor(base, row.model_creator?.slug ?? row.model_creator?.name ?? "")) {
        hit = index.get(`${provider}||${slug}`) ?? index.get(`${provider}||${effortStrip(slug)}`);
        if (hit) break;
      }
    }
    if (hit) {
      ratings[hit] ??= {};
      const cur = ratings[hit].t2i;
      if (!cur || row.elo > cur.elo) {
        ratings[hit].t2i = {
          elo: Math.round(row.elo * 10) / 10,
          rank: row.rank ?? null,
          via: row.via,
          modelo: row.name,
          votes: row.appearances ?? null,
        };
        t2iMatches++;
      }
    }
  }

  return { ratings, misses: [...misses], comDados, t2iMatches };
}
