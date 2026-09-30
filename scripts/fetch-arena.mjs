/**
 * Baixa os leaderboards LMArena (dataset oficial `lmarena-ai/leaderboard-dataset`,
 * split `latest`) via o endpoint público datasets-server do HuggingFace.
 * Grava o snapshot bruto em `src/data/arena-raw.json`.
 * Paginação com atraso + retry exponencial (o servidor limita a ~429).
 *
 * Uso: `npm run arena:fetch`
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATASET = "lmarena-ai/leaderboard-dataset";
const SPLIT = "latest";
// Configs com as arenas que nos interessam (texto, código, visão, imagem).
const CONFIGS = ["text_style_control", "webdev", "vision", "text_to_image"];

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(rootDir, "src", "data", "arena-raw.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url, tentativas = 12) {
  for (let t = 0; ; t++) {
    const res = await fetch(url, { headers: { "User-Agent": "model-arena/1.0" } });
    if (res.ok) return res.json();
    const espera = Math.min(
      Number(res.headers.get("retry-after") || 0) * 1000 || 4000 * 2 ** t,
      120000,
    );
    if (t >= tentativas - 1 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${url}: HTTP ${res.status}`);
    }
    console.log(`  429/lento — a aguardar ${Math.round(espera / 1000)}s…`);
    await sleep(espera);
  }
}

async function fetchConfig(config) {
  const rows = [];
  let offset = 0;
  for (;;) {
    const url =
      `https://datasets-server.huggingface.co/rows?dataset=${DATASET}` +
      `&config=${config}&split=${SPLIT}&offset=${offset}&length=100`;
    const payload = await fetchPage(url);
    const batch = (payload.rows ?? []).map((r) => r.row).filter(Boolean);
    rows.push(...batch);
    if (batch.length < 100) break;
    offset += 100;
    await sleep(3000); // cortesia anti-429
  }
  console.log(`  ${config}: ${rows.length} linhas`);
  return rows;
}

const configs = {};
for (const cfg of CONFIGS) {
  console.log(`A buscar ${cfg}…`);
  configs[cfg] = await fetchConfig(cfg);
  await sleep(1000);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify({ generatedAt: new Date().toISOString(), configs }),
);
const total = Object.values(configs).reduce((n, r) => n + r.length, 0);
console.log(`OK: ${total} linhas em ${outFile}`);
