/**
 * Importa modelos da base de dados do OpenCode (models.dev) que ainda
 * não estão no catálogo do site. Só fornecedores de PRIMEIRA PARTE
 * (laboratórios com modelos próprios em API própria), com preço em
 * USD. Gateways, espelhos e endpoints CN (preços em CNY) ficam fora.
 *
 * Uso: node scripts/importar-modelsdev.mjs <modelsdev-raw.json>
 * - Grava `src/data/modelos-modelsdev.json` (registos RawModel).
 * - Acrescenta descrições dos NOVOS ids a
 *   `src/data/descricoes-modelos.json` (factos reais só).
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const captura = process.argv[2];
if (!captura) {
  console.error("uso: node scripts/importar-modelsdev.mjs <modelsdev-raw.json>");
  process.exit(1);
}

/** Primeira parte na base do OpenCode → slug do site. */
const KEEPERS = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  xai: "x-ai",
  deepseek: "deepseek",
  mistral: "mistralai",
  cohere: "cohere",
  perplexity: "perplexity",
  moonshotai: "moonshotai",
  zai: "z-ai",
  minimax: "minimax",
  alibaba: "qwen",
  "stepfun-ai": "stepfun",
  upstage: "upstage",
  inception: "inception",
  thinkingmachines: "thinkingmachines",
  meta: "meta",
  arcee: "arcee-ai",
  sakana: "sakana",
  xiaomi: "xiaomi",
  ai21: "ai21",
  sarvam: "sarvam",
  longcat: "meituan",
};

/** Prefixos de id obrigatórios: descarta modelos ALHEIOS servidos por
 * gateways dentro do provider (ex.: Alibaba também serve GLM/Kimi,
 * Mistral serve DeepSeek/GLM, Arcee serve Kimi/Inkling). */
const ID_PREFIXOS = {
  alibaba: ["qwen", "qwq", "qvq"],
  thinkingmachines: ["thinkingmachines/"],
  arcee: ["trinity"],
  mistral: [
    "mistral", "mixtral", "ministral", "codestral", "pixtral",
    "devstral", "voxtral", "magistral", "open-mistral", "mathstral",
    "labs-",
  ],
};

/** Nome de exibição do fornecedor (site) para as descrições. */
const EMPRESAS = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  "x-ai": "xAI",
  deepseek: "DeepSeek",
  mistralai: "Mistral AI",
  cohere: "Cohere",
  perplexity: "Perplexity",
  moonshotai: "Moonshot AI",
  "z-ai": "Zhipu",
  minimax: "MiniMax",
  qwen: "Qwen",
  stepfun: "StepFun",
  upstage: "Upstage",
  inception: "Inception",
  thinkingmachines: "Thinking Machines",
  meta: "Meta",
  "arcee-ai": "Arcee AI",
  sakana: "Sakana AI",
  xiaomi: "Xiaomi",
  ai21: "AI21 Labs",
  sarvam: "Sarvam AI",
  meituan: "Meituan",
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

const shortNameOR = (nome) => {
  const idx = nome.indexOf(": ");
  const curto = idx >= 0 ? nome.slice(idx + 2) : nome;
  return curto.replace(/\s*\((batch|free)\)\s*$/i, "").trim() || nome;
};

const TIPOS_FORA = new Set([
  "embedding", "rerank", "reranking", "speech", "transcription",
  "realtime", "image", "video", "audio",
]);

const db = JSON.parse(fs.readFileSync(captura, "utf8"));
const site = JSON.parse(
  fs.readFileSync(join(rootDir, "src/data/openrouter-models.json"), "utf8"),
);

/** 1) Chaves do catálogo atual (slug + nome curto normalizado). */
const chaveSite = new Set();
for (const m of site.models ?? []) {
  const slug = m.provider.startsWith("~") ? m.provider.slice(1) : m.provider;
  chaveSite.add(`${slug}//${norm(shortNameOR(m.nome))}`);
  chaveSite.add(m.id.toLowerCase());
}

/** 2) Candidatos filtrados por esquema real da captura. */
const candidatos = [];
const pulados = {};
const pulo = (k) => (pulados[k] = (pulados[k] ?? 0) + 1);
for (const [pid, p] of Object.entries(db)) {
  const slug = KEEPERS[pid];
  if (!slug) continue;
  const prefixos = ID_PREFIXOS[pid];
  for (const m of Object.values(p.models ?? {})) {
    if (TIPOS_FORA.has((m.type ?? "").toLowerCase())) {
      pulo("tipo");
      continue;
    }
    const saida = m.modalities?.output ?? [];
    const entrada = m.modalities?.input ?? [];
    if (saida.length !== 1 || saida[0] !== "text" || !entrada.includes("text")) {
      pulo("modalidade");
      continue;
    }
    if ((m.id ?? "").includes(":") || m.id?.endsWith("-contributor")) {
      pulo("variante");
      continue;
    }
    if (prefixos && !prefixos.some((px) => m.id.toLowerCase().startsWith(px))) {
      pulo("outro org");
      continue;
    }
    const pin = m.cost?.input;
    const pout = m.cost?.output;
    if (
      typeof pin !== "number" ||
      typeof pout !== "number" ||
      pin < 0 ||
      pout < 0 ||
      pin > 500 ||
      pout > 1500
    ) {
      pulo("preço");
      continue;
    }
    const ctx = m.limit?.context;
    if (typeof ctx !== "number" || ctx < 1000) {
      pulo("contexto");
      continue;
    }
    // O models.dev anota aliases com "(latest)" — tira-o do nome;
    // a identidade fica pelo id/fornecedor.
    const nome = m.name?.trim().replace(/\s*\(latest\)\s*$/i, "") ?? "";
    if (!nome) {
      pulo("nome");
      continue;
    }
    candidatos.push({ pid, slug, m, nome, pin, pout, ctx });
  }
}

/** 3) Dedupe interno (-latest são aliases do irmão versionado) e
 *     contra o site (slug + nome normalizado). */
const grupos = new Map();
for (const c of candidatos.sort((a, b) => a.pin - b.pin || a.m.id.localeCompare(b.m.id))) {
  const idBase = c.m.id.replace(/-latest$/, "");
  if (idBase !== c.m.id) {
    const temIrmao = candidatos.some(
      (o) => o.slug === c.slug && o.m.id !== c.m.id && o.m.id.startsWith(idBase),
    );
    if (temIrmao) continue; // alias "-latest": o versionado entra
  }
  const chave = `${c.slug}//${norm(c.nome)}`;
  if (!grupos.has(chave)) grupos.set(chave, c);
}
const novos = [];
let sobrepos = 0;
for (const [chave, c] of grupos) {
  if (chaveSite.has(chave) || chaveSite.has(`${c.slug}/${c.m.id}`.toLowerCase())) {
    sobrepos++;
    continue;
  }
  novos.push(c);
}

/** 4) RawModel do site a partir dos factos da captura. */
const fmtInt = (n) => n.toLocaleString("pt-PT");
const fmtPreco = (v) =>
  v === 0
    ? "grátis"
    : `US$ ${v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtMesAno = (iso) => {
  const [a, mes, dia] = String(iso ?? "").split("-");
  if (!a || Number.isNaN(Number(mes)) || !MESES[Number(mes) - 1]) return "";
  return `${dia ? `${Number(dia)} de ` : ""}${MESES[Number(mes) - 1]} de ${a}`;
};

const registros = novos.map((c) => ({
  id: `${c.slug}/${c.m.id}`,
  nome: c.nome,
  provider: c.slug,
  descricao: c.m.description?.trim() ?? "",
  contexto: Math.round(c.ctx),
  precoEntrada: c.pin,
  precoSaida: c.pout,
  modalidades: {
    entrada: (c.m.modalities.input ?? []).filter((x) => x !== "text"),
    saida: [],
  },
  ferramentas: Boolean(c.m.tool_call),
  saidaEstruturada: Boolean(c.m.structured_output),
  raciocinio: Boolean(c.m.reasoning),
}));

/** 5) Descrições curadas (2 frases, detalhadas mas leves) dos novos. */
const descricoes = {};
for (const c of novos) {
  const idModelo = `${c.slug}/${c.m.id}`;
  const empresa = EMPRESAS[c.slug] ?? c.slug;
  const lanc = fmtMesAno(c.m.release_date);
  const partes = [
    `janela de contexto de ${fmtInt(Math.round(c.ctx))} tokens${
      c.m.open_weights ? " e pesos abertos" : ""
    }`,
    c.pin === 0 && c.pout === 0
      ? "sem custo por tokens na API do fornecedor"
      : `preço de ${fmtPreco(c.pin)} na entrada e ${fmtPreco(c.pout)} na saída por milhão de tokens`,
  ];
  const papeis = [];
  if (c.m.reasoning) papeis.push("raciocínio");
  if (c.m.tool_call) papeis.push("chamadas de ferramentas");
  if (c.m.structured_output) papeis.push("saída estruturada");
  if (c.m.attachment) papeis.push("entrada de imagens e PDF");
  descricoes[idModelo] = {
    descricao: `Modelo de linguagem da ${empresa}${
      lanc ? `, lançado em ${lanc}, ` : ", "
    }${partes.join(" e ")}. ${
      papeis.length ? `A API suporta ${papeis.join(", ").replace(/, ([^,]*)$/, " e $1")}.` : ""
    }`.trim(),
  };
}

/** 6) Grava os dois ficheiros. */
const saida = {
  generatedAt: new Date().toISOString(),
  fonte: "models.dev — base de dados de modelos usada pelo OpenCode (fornecedores de primeira parte, preços em USD)",
  contagens: { candidatos: candidatos.length, sobreposicao: sobrepos, novos: registros.length, pulados },
  modelos: registros,
};
fs.writeFileSync(
  join(rootDir, "src/data/modelos-modelsdev.json"),
  `${JSON.stringify(saida, null, 2)}\n`,
  "utf8",
);

const fDesc = join(rootDir, "src/data/descricoes-modelos.json");
const descAntigas = JSON.parse(fs.readFileSync(fDesc, "utf8"));
let acrescentadas = 0;
for (const [id, d] of Object.entries(descricoes)) {
  if (!descAntigas[id]) {
    descAntigas[id] = d;
    acrescentadas++;
  }
}
fs.writeFileSync(fDesc, `${JSON.stringify(descAntigas, null, 2)}\n`, "utf8");

/** 7) Resumo humano para verificação. */
console.log(
  `candidatos: ${candidatos.length} · sobreposição com site: ${sobrepos} · novos: ${registros.length} · descrições acrescentadas: ${acrescentadas}`,
);
console.log("pulados:", JSON.stringify(pulados, null, 1));
const porSlug = {};
for (const r of registros) porSlug[r.provider] = (porSlug[r.provider] ?? 0) + 1;
console.log("novos por fornecedor:", JSON.stringify(porSlug));
for (const r of registros) {
  console.log(` + ${r.id} · ${fmtInt(r.contexto)} tok · ${fmtPreco(r.precoEntrada)}/${fmtPreco(r.precoSaida)}`);
}
console.log("\n--- descrições novas ---");
for (const [id, d] of Object.entries(descricoes)) {
  console.log(` ${id}: ${d.descricao}`);
}
