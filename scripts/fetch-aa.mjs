/**
 * Busca benchmarks da Artificial Analysis (API gratuita com chave) e grava
 * `src/data/aa-ratings.json` indexado por id OpenRouter.
 *
 * Uso: `AA_API_KEY=... npm run aa:fetch` (ou chave em `.env`, ignorado no git).
 * Endpoints V2 (2026): /language/models + /media/text-to-image/models +
 * /media/image-editing/models — primeiro Pro, com queda para /free
 * (os legacy /api/v2/data/* devolvem 410 desde 04/11/2026).
 * Sem chave, o script aborta sem tocar nos dados existentes.
 *
 * A correspondência vive em `src/lib/aa-match.mjs` (partilhada com a
 * rota `/api/aa/ratings`, que serve os mesmos dados ao vivo no site).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildAaRatings } from "../src/lib/aa-match.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(rootDir, "src", "data", "aa-ratings.json");
const catalogFile = join(rootDir, "src", "data", "openrouter-models.json");

// Chave: ambiente primeiro, depois ficheiro .env (nunca no repo).
function loadKey() {
  if (process.env.AA_API_KEY) return process.env.AA_API_KEY;
  const envFile = join(rootDir, ".env");
  if (!existsSync(envFile)) return null;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*AA_API_KEY\s*=\s*["']?([^"'#\s]+)["']?\s*$/);
    if (m) return m[1];
  }
  return null;
}

const KEY = loadKey();
if (!KEY) {
  console.error(
    "AA_API_KEY em falta: exporte a variável ou crie `.env` com AA_API_KEY=...",
  );
  process.exit(1);
}

const headers = { "x-api-key": KEY, "User-Agent": "model-arena/1.0" };

const AA = "https://artificialanalysis.ai/api/v2";

/** Tenta Pro primeiro e cai para /free se o plano da chave negar.
 *  Segue também a paginação (`pagination.has_more`). */
async function getTodasComPlano(paths) {
  let ultimo = null;
  for (const urlBase of paths) {
    const linhas = [];
    let falhou = false;
    for (let page = 1; page <= 10 && !falhou; page++) {
      const res = await fetch(`${urlBase}${page > 1 ? `?page=${page}` : ""}`, { headers });
      if (!res.ok) {
        ultimo = res.status;
        falhou = true;
        break;
      }
      const j = await res.json();
      linhas.push(...(j.data ?? []));
      if (!j.pagination?.has_more) break;
    }
    if (!falhou) return linhas;
  }
  throw new Error(`HTTP ${ultimo ?? "sem resposta"}`);
}

console.log("A buscar LLMs…");
const llms =
  (await getTodasComPlano([`${AA}/language/models`, `${AA}/language/models/free`]));
console.log(`  ${llms.length} modelos na AA`);

const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
const base = catalog.models
  .filter(
    (m) => !m.id.startsWith("~") && !m.id.includes(":") && m.provider !== "openrouter",
  )
  .map((m) => ({ id: m.id, provider: m.provider }));

// Media: text-to-image + image-editing (Elo real de geração).
async function fetchMedia(tipo) {
  try {
    return await getTodasComPlano([
      `${AA}/media/${tipo}/models`,
      `${AA}/media/${tipo}/models/free`,
    ]);
  } catch (e) {
    console.log(`  media/${tipo}: ${e.message}`);
    return [];
  }
}
console.log("A buscar media…");
const t2i = await fetchMedia("text-to-image");
const iee = await fetchMedia("image-editing");
console.log(`  t2i: ${t2i.length} · image-editing: ${iee.length}`);

const mediaRows = [
  ...t2i.map((r) => ({ ...r, via: "t2i" })),
  ...iee.map((r) => ({ ...r, via: "iee" })),
];
const { ratings, misses, comDados, t2iMatches } = buildAaRatings(
  llms,
  mediaRows,
  base,
);

// Diagnóstico de escalas.
const mm = (arr) => (arr.length ? [Math.min(...arr), Math.max(...arr)] : null);
const col = (f) =>
  Object.values(ratings)
    .map((r) => r[f])
    .filter((v) => typeof v === "number");
console.log("escalas:", {
  intel: mm(col("intel")),
  coding: mm(col("coding")),
  math: mm(col("math")),
  tps: mm(col("tps")),
});

// Overlay sobre o snapshot anterior (extras medidos antes mantêm-se
// quando o plano Free não os traz: sem inventar, sem perder).
let anteriores = {};
try {
  const prev = JSON.parse(readFileSync(outFile, "utf8"));
  anteriores = prev.ratings ?? {};
} catch {
  /* sem ficheiro anterior: primeira corrida */
}
const merged = { ...anteriores };
for (const [id, r] of Object.entries(ratings)) {
  const antes = anteriores[id];
  merged[id] = antes
    ? { ...antes, ...r, extras: { ...antes.extras, ...r.extras } }
    : r;
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    fonte: "Artificial Analysis V2 API (/language/models + media)",
    count: comDados,
    ratings: merged,
  }),
);
console.log(`OK: ${comDados} modelos com dados em ${outFile} (t2i matches: ${t2iMatches})`);
console.log(`Sem correspondência (amostra, até 15):`);
console.log([...misses].slice(0, 15).join("\n"));
