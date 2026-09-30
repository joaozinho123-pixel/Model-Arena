/**
 * Build do arquivo único standalone do Model Arena.
 * Lê os snapshots em src/data + CSS do template + corpo/JS,
 * funde o catálogo (mesma regra de merge/rank do models.ts,
 * versão compacta) e escreve ../../model-arena-standalone.html.
 *
 * Uso: node scripts/build-standalone.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const root = join(here, "..", "..");
const dataDir = join(app, "src", "data");

const readJSON = (p) => JSON.parse(readFileSync(p, "utf-8"));

const OR = readJSON(join(dataDir, "openrouter-models.json"));
const AA = readJSON(join(dataDir, "aa-ratings.json"));
const ARENA = readJSON(join(dataDir, "arena-ratings.json"));

const SIMPLE = (s) => `https://cdn.simpleicons.org/${s}`;
const AVATAR = (d) => `https://unavatar.io/${d}?fallback=false`;
const META = {
  anthropic: ["Anthropic", SIMPLE("anthropic"), "#D97757"],
  openai: ["OpenAI", "https://unavatar.io/openai.com?fallback=false", "#E4E4E7"],
  google: ["Google", SIMPLE("google"), "#4285F4"],
  "x-ai": ["xAI", SIMPLE("x"), "#A1A1AA"],
  deepseek: ["DeepSeek", SIMPLE("deepseek"), "#7C3AED"],
  "meta-llama": ["Meta Llama", SIMPLE("meta"), "#0866FF"],
  meta: ["Meta", SIMPLE("meta"), "#0866FF"],
  mistralai: ["Mistral AI", SIMPLE("mistralai"), "#FF7000"],
  moonshotai: ["Moonshot AI", SIMPLE("moonshotai"), "#EAB308"],
  qwen: ["Qwen", SIMPLE("qwen"), "#6D28D9"],
  microsoft: ["Microsoft", AVATAR("microsoft.com"), "#00A4EF"],
  nvidia: ["NVIDIA", SIMPLE("nvidia"), "#76B900"],
  amazon: ["AWS", AVATAR("amazon.com"), "#FF9900"],
  perplexity: ["Perplexity", SIMPLE("perplexity"), "#20808D"],
  "ibm-granite": ["IBM", AVATAR("ibm.com"), "#0F62FE"],
  "arcee-ai": ["Arcee AI", AVATAR("arcee.ai"), "#F43F5E"],
  minimax: ["MiniMax", SIMPLE("minimax"), "#EC4899"],
  xiaomi: ["Xiaomi", SIMPLE("xiaomi"), "#FF6900"],
  "z-ai": ["Zhipu", AVATAR("z.ai"), "#2563EB"],
  tencent: ["Tencent", AVATAR("tencent.com"), "#0052D9"],
  cohere: ["Cohere", AVATAR("cohere.com"), "#059669"],
  upstage: ["Upstage", AVATAR("upstage.ai"), "#4F46E5"],
  rekaai: ["Reka", AVATAR("reka.ai"), "#0EA5E9"],
  stepfun: ["StepFun", AVATAR("stepfun.com"), "#8B5CF6"],
  nousresearch: ["Nous Research", AVATAR("nousresearch.com"), "#A1A1AA"],
  thinkingmachines: ["Thinking Machines", AVATAR("thinkingmachines.ai"), "#A1A1AA"],
  inception: ["Inception", AVATAR("inception.ai"), "#22D3EE"],
};
const norm = (p) => (p.startsWith("~") ? p.slice(1) : p);
const title = (s) => norm(s).split(/[-_]/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
const disp = (p) => META[norm(p)]?.[0] ?? title(p);
const color = (p) => META[norm(p)]?.[2] ?? "#71717A";
const logoOf = (p, id) => {
  if (norm(p) === "google" && /gemini/i.test(id)) return SIMPLE("googlegemini");
  return META[norm(p)]?.[1] ?? null;
};
const shortName = (n) => {
  const i = n.indexOf(": ");
  const c = (i >= 0 ? n.slice(i + 2) : n).replace(/\s*\(batch\)\s*$/i, "").trim();
  return c || n;
};
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const pt1 = (v) => (Math.round(v * 10) / 10).toLocaleString("pt-PT");

const aaR = AA.ratings ?? {};
const arenaR = ARENA.ratings ?? {};
const CODE_CATS = new Set(["codecategories"]);
const IMG_CATS = new Set(["image", "imageediting", "logo"]);

const out = [];
for (const raw of OR.models ?? []) {
  if (typeof raw.id !== "string") continue;
  if (raw.id.startsWith("~") || raw.id.includes(":")) continue;
  if (norm(raw.provider) === "openrouter") continue;
  if (!(raw.precoEntrada >= 0 && raw.precoSaida >= 0)) continue;
  const d = aaR[raw.id];
  const bench = raw.benchmarks?.aa;
  const design = raw.benchmarks?.design_arena ?? [];
  const ar = arenaR[raw.id];
  const bestDesign = (set) =>
    design
      .filter((x) => x.arena === "models" || set.has(String(x.category ?? "").toLowerCase()))
      .filter((x) => Number.isFinite(x.elo) && set.has(String(x.category ?? "").toLowerCase()))
      .sort((x, y) => y.elo - x.elo)[0];

  // código
  let codigo = { n: null, t: "—", o: null, v: null };
  if (num(d?.coding) != null) codigo = { n: d.coding, t: String(d.coding), o: "AA", v: null };
  else if (num(bench?.coding_index) != null) codigo = { n: bench.coding_index, t: String(bench.coding_index), o: "AA", v: null };
  else {
    const dc = bestDesign(CODE_CATS);
    if (dc) codigo = { n: Math.round(dc.elo), t: String(Math.round(dc.elo)), o: "Design Arena", v: "design" };
    else if (num(ar?.codigo?.elo) != null) codigo = { n: ar.codigo.elo, t: String(ar.codigo.elo), o: "LMArena", v: ar.codigo.via ?? null };
  }
  // texto
  let texto = { n: null, t: "—", o: null, v: null };
  if (num(d?.intel) != null) texto = { n: d.intel, t: String(d.intel), o: "AA", v: null };
  else if (num(bench?.intelligence_index) != null) texto = { n: bench.intelligence_index, t: String(bench.intelligence_index), o: "AA", v: null };
  else if (num(ar?.texto?.elo) != null) texto = { n: ar.texto.elo, t: String(ar.texto.elo), o: "LMArena", v: ar.texto.via ?? null };
  // imagem
  let imagem = { n: null, t: "—", o: null, v: null };
  if (num(d?.t2i?.elo) != null) imagem = { n: Math.round(d.t2i.elo), t: String(Math.round(d.t2i.elo)), o: "AA", v: "aa-t2i" };
  else {
    const di = bestDesign(IMG_CATS);
    if (di) imagem = { n: Math.round(di.elo), t: String(Math.round(di.elo)), o: "Design Arena", v: "design" };
    else if (num(ar?.imagem?.elo) != null) imagem = { n: ar.imagem.elo, t: String(ar.imagem.elo), o: "LMArena", v: ar.imagem.via ?? null };
  }
  // mat
  let mat = { n: null, t: "—", o: null, v: null };
  if (num(d?.math) != null) mat = { n: d.math, t: String(d.math), o: "AA", v: null };
  else if (num(ar?.raciocinioMatematico?.elo) != null) mat = { n: ar.raciocinioMatematico.elo, t: String(ar.raciocinioMatematico.elo), o: "LMArena", v: ar.raciocinioMatematico.via ?? null };
  // vel
  let vel = { n: null, t: "—", o: null, v: null };
  if (num(d?.tps) != null) vel = { n: d.tps, t: `${pt1(d.tps)} tok/s`, o: "AA", v: null };

  const intel = num(d?.intel) ?? num(bench?.intelligence_index) ?? null;
  const eloT = num(ar?.texto?.elo) ?? null;
  out.push({
    id: raw.id,
    nc: shortName(raw.nome),
    em: disp(raw.provider),
    pv: norm(raw.provider),
    co: color(raw.provider),
    lg: logoOf(raw.provider, raw.id),
    ct: raw.contexto ?? 0,
    pe: raw.precoEntrada ?? 0,
    ps: raw.precoSaida ?? 0,
    ds: String(raw.descricao ?? "").slice(0, 220),
    md: { entrada: raw.modalidades?.entrada ?? [], saida: raw.modalidades?.saida ?? [] },
    ft: !!raw.ferramentas,
    es: !!raw.saidaEstruturada,
    ra: !!raw.raciocinio,
    intel,
    eloT,
    cats: { codigo, texto, imagem, mat, vel },
    _k1: intel ?? -Infinity,
    _k2: eloT ?? -Infinity,
  });
}
out.sort((a, b) => b._k1 - a._k1 || b._k2 - a._k2 || a.nc.localeCompare(b.nc));
out.forEach((m, i) => { m.rank = i + 1; delete m._k1; delete m._k2; });

const provCount = {};
for (const m of out) provCount[m.pv] ??= { slug: m.pv, nome: m.em, count: 0 }, provCount[m.pv].count++;
const providers = Object.values(provCount).sort((a, b) => b.count - a.count);
const payload = {
  models: out,
  providers,
  dates: { snapshot: (OR.generatedAt ?? "").slice(0, 10), arena: ARENA.publishDate ?? "", aa: (AA.generatedAt ?? "").slice(0, 10), aaCount: AA.count ?? 0 },
  total: OR.models?.length ?? 0,
};

// monta o HTML final
const tpl = readFileSync(join(root, "standalone-template.html"), "utf-8");
const css = tpl.split("/*__APP_HTML__*/")[0].split("<style>")[1].split("</style>")[0] ?? "";
let cssFull = tpl.includes("</style>") ? tpl.slice(tpl.indexOf("<style>") + 7, tpl.indexOf("</style>")) : tpl;
cssFull = cssFull.replace(/\/\*__APP_HTML__\*\/|\/\*__APP_JS__\*\//g, "");
const body = readFileSync(join(here, "standalone-body.html"), "utf-8");
let js = readFileSync(join(here, "standalone-app.js"), "utf-8");
const dataJSON = JSON.stringify(payload).replace(/</g, "\\u003c");
js = `window.__ARENA__=${dataJSON};\n` + js;

const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="8" fill="#4f46e5"/><path d="M10 22V10l6 7 6-7v12" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Model Arena — Duelo de Modelos de IA</title>
<meta name="description" content="Compare dois modelos de IA lado a lado em código, texto, imagem, raciocínio matemático, preço, contexto e velocidade — com benchmarks reais de AA, LMArena e OpenRouter.">
<meta name="theme-color" content="#fafaf9">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800;9..144,900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${cssFull}</style>
</head>
<body>
${body}
<script>${js.replace(/<\/script>/g, "<\\/script>")}</script>
</body>
</html>`;

const dest = join(root, "model-arena-standalone.html");
writeFileSync(dest, html);
console.log(`OK ${dest} bytes=${Buffer.byteLength(html)} models=${out.length}`);
