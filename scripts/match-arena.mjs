/**
 * Cruza o snapshot bruto do LMArena (`arena-raw.json`) com o catálogo
 * OpenRouter e gera `src/data/arena-ratings.json` com Elo real por modelo.
 * Só casa o MESMO modelo (normalizando sufixos de esforço "-high/-max",
 * datas e parênteses) — sem correspondência, sem dados (nunca inventa).
 *
 * Uso: `npm run arena:build`
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawFile = join(rootDir, "src", "data", "arena-raw.json");
const catalogFile = join(rootDir, "src", "data", "openrouter-models.json");
const outFile = join(rootDir, "src", "data", "arena-ratings.json");

// Arena (config/categoria) -> nossa categoria de benchmark.
const MAP = {
  texto: ["text_style_control", "overall"],
  codigo: ["text_style_control", "coding"],
  raciocinioMatematico: ["text_style_control", "math"],
};
const IMAGEM_PRIMARIA = ["text_to_image", "overall"];
const IMAGEM_FALLBACK = ["vision", "overall"];

// Orgs da Arena -> fornecedores do nosso catálogo (candidatos, por ordem).
const ORG_ALIASES = {
  moonshot: ["moonshotai"],
  zai: ["z-ai"],
  alibaba: ["qwen"],
  xai: ["x-ai"],
  "microsoft-ai": ["microsoft"],
  meta: ["meta", "meta-llama"],
  mistral: ["mistralai"],
};

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[_.]/g, "-")
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s*\[.*?\]\s*/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// Sufixos da Arena que não mudam o modelo (esforço, datas, contexto,
// beta, latest): removidos em cascata como 2ª, 3ª... tentativas.
const SUFFIX_RE =
  /-(high|medium|low|max|xhigh|thinking|reasoning|latest|preview|instruct|beta\d*|beta-\d+|\d{4}-\d{1,2}-\d{1,2}|\d{6,8}(-\d+)?|\d{4}|\d+k|\d+m)$/;

function candidates(core) {
  const list = [core];
  let cur = core;
  for (;;) {
    const next = cur.replace(SUFFIX_RE, "");
    if (next === cur || next.length < 3) break;
    list.push(next);
    cur = next;
  }
  return list;
}

const flat = (s) => s.replace(/[-_]/g, "");

const raw = JSON.parse(readFileSync(rawFile, "utf8"));
const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
const base = catalog.models.filter(
  (m) => !m.id.startsWith("~") && !m.id.includes(":") && m.provider !== "openrouter",
);

// Índice: provider -> slug normalizado -> id OpenRouter.
const index = new Map();
for (const m of base) {
  const [provider, ...rest] = m.id.split("/");
  const key = `${provider}||${norm(rest.join("/"))}`;
  if (!index.has(key)) index.set(key, m.id);
}

// Índice de recurso: slug do catálogo sem sufixo datado/móvel
// ("qwen3.8-max-0902" casa com a arena "qwen3.8-max").
// Só sufixos inequívocos de data/alias (nunca turbo/preview/
// instant — esses são variantes distintas, não a mesma métrica).
const CAT_STRIP_RE = /-(latest|\d{4}-\d{1,2}-\d{1,2}|\d{6,8}(-\d+)?|\d{4})$/;
const indexCat = new Map();
for (const m of base) {
  const [provider, ...rest] = m.id.split("/");
  const rawSlug = norm(rest.join("/"));
  const stripped = rawSlug.replace(CAT_STRIP_RE, "");
  if (stripped !== rawSlug && stripped.length >= 3) {
    const key = `${provider}||${stripped}`;
    if (!index.has(key) && !indexCat.has(key)) indexCat.set(key, m.id);
  }
}

function providersFor(org) {
  const o = flat(norm(org));
  const found = new Set();
  for (const m of base) {
    if (flat(m.provider) === o) found.add(m.provider);
  }
  for (const alias of ORG_ALIASES[o] ?? []) found.add(alias);
  return [...found];
}

let tentativas = 0;
let acertos = 0;
const misses = new Set();

const fallbackHits = new Set();

function match(org, arenaName) {
  tentativas++;
  const core = norm(arenaName);
  const cands = candidates(core);
  // Menor profundidade primeiro = correspondência exata antes de sufixos.
  for (let depth = 0; depth < cands.length; depth++) {
    for (const provider of providersFor(org)) {
      const hit = index.get(`${provider}||${cands[depth]}`);
      if (hit) {
        acertos++;
        return { id: hit, depth };
      }
    }
  }
  // Último recurso: variante datada/móvel do catálogo para o nome
  // base da arena (profundidade máxima = nunca supera match direto).
  const fbDepth = cands.length;
  for (const provider of providersFor(org)) {
    const hit = indexCat.get(`${provider}||${core}`);
    if (hit) {
      acertos++;
      fallbackHits.add(`${org} :: ${arenaName} => ${hit}`);
      return { id: hit, depth: fbDepth };
    }
  }
  misses.add(`${org} :: ${arenaName}`);
  return null;
}

// Guarda o melhor por (modelo, categoria): menor profundidade;
// desempate por mais votos (Elo mais fiável).
const chosen = new Map();
function consider(id, cat, row, depth) {
  const key = `${id}||${cat}`;
  const cur = chosen.get(key);
  if (
    !cur ||
    depth < cur.depth ||
    (depth === cur.depth && (row.vote_count ?? 0) > (cur.row.vote_count ?? 0))
  ) {
    chosen.set(key, { id, cat, row, depth });
  }
}

const rowsOf = (config, category) =>
  (raw.configs[config] ?? []).filter((r) => r.category === category);

function minMax(config, category) {
  const elos = rowsOf(config, category)
    .map((r) => r.rating)
    .filter((n) => Number.isFinite(n));
  return { min: Math.min(...elos), max: Math.max(...elos) };
}

const mm = {
  texto: minMax(...MAP.texto),
  codigo: minMax(...MAP.codigo),
  raciocinioMatematico: minMax(...MAP.raciocinioMatematico),
  imagemT2I: minMax(...IMAGEM_PRIMARIA),
  imagemVisao: minMax(...IMAGEM_FALLBACK),
};

const entry = (row) => ({
  elo: Math.round(row.rating * 10) / 10,
  votos: Math.round(row.vote_count ?? 0),
  rank: row.rank,
  arena: row.model_name,
});

const ratings = {};

for (const [cat, [cfg, name]] of Object.entries(MAP)) {
  for (const row of rowsOf(cfg, name)) {
    const m = match(row.organization, row.model_name);
    if (m) consider(m.id, cat, row, m.depth);
  }
}
// Imagem: text-to-image tem prioridade sobre vision (dimensões distintas).
for (const row of rowsOf(...IMAGEM_PRIMARIA)) {
  const m = match(row.organization, row.model_name);
  if (m) consider(m.id, "imagem:t2i", row, m.depth);
}
for (const row of rowsOf(...IMAGEM_FALLBACK)) {
  const m = match(row.organization, row.model_name);
  if (m) consider(m.id, "imagem:vision", row, m.depth);
}

// Materializa os vencedores (t2i primeiro; vision só como fallback).
for (const { id, cat, row } of chosen.values()) {
  ratings[id] ??= {};
  if (cat === "imagem:t2i") {
    ratings[id].imagem = { ...entry(row), via: "t2i" };
  } else if (cat === "imagem:vision") {
    if (!ratings[id].imagem) {
      ratings[id].imagem = { ...entry(row), via: "vision" };
    }
  } else {
    ratings[id][cat] = entry(row);
  }
}

let publishDate = "";
for (const rows of Object.values(raw.configs)) {
  const d = rows.find((r) => r.leaderboard_publish_date)
    ?.leaderboard_publish_date;
  if (d && (!publishDate || d > publishDate)) publishDate = d;
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    publishDate,
    fonte: "LMArena (lmarena-ai/leaderboard-dataset, split latest)",
    minMax: {
      texto: mm.texto,
      codigo: mm.codigo,
      raciocinioMatematico: mm.raciocinioMatematico,
      imagemT2I: mm.imagemT2I,
      imagemVisao: mm.imagemVisao,
    },
    norm: "min-max do Elo da categoria completa -> 0-10",
    ratings,
  }),
);

const comAlgum = Object.keys(ratings).length;
const comTudo = Object.values(ratings).filter(
  (r) => r.texto && r.codigo && r.raciocinioMatematico,
).length;
const porProfundidade = {};
let votosBaixos = 0;
for (const { row, depth } of chosen.values()) {
  porProfundidade[depth] = (porProfundidade[depth] ?? 0) + 1;
  if ((row.vote_count ?? 0) < 300) votosBaixos++;
}
console.log(`Profundidade (0=exata): ${JSON.stringify(porProfundidade)}`);
console.log(`Fallback datado/móvel (${fallbackHits.size}):`);
console.log([...fallbackHits].slice(0, 30).join("\n"));
console.log(`Entradas com <300 votos: ${votosBaixos}/${chosen.size}`);
console.log(`Tentativas: ${tentativas} · acertos: ${acertos}`);
console.log(`Modelos com algum dado: ${comAlgum}/${base.length}`);
console.log(`Com texto+código+matemática: ${comTudo}/${base.length}`);
console.log(`Sem correspondência (amostra):`);
console.log(
  [...misses]
    .filter((m) =>
      /opus|gpt|gemini|grok|deepseek|kimi|llama|qwen|mistral|glm|sonnet/i.test(m),
    )
    .slice(0, 25)
    .join("\n"),
);
