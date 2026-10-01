/**
 * Sonda o CDN simpleicons (devolve 404 quando não há marca) para
 * descobrir que fornecedores têm ícone real. Uso pontual:
 * `node scripts/probe-icons.mjs`
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(join(rootDir, "src", "data", "openrouter-models.json"), "utf8"),
);
const providers = [...new Set(data.models.map((m) => m.provider))];

const OVERRIDES = {
  "x-ai": ["x"],
  amazon: ["amazonwebservices", "amazon"],
  meta: ["meta"],
  "meta-llama": ["meta"],
  "ibm-granite": ["ibm"],
  "bytedance-seed": ["bytedance"],
  "z-ai": ["zhipu"],
  moonshotai: ["moonshotai", "kimi"],
  qwen: ["qwen", "alibabacloud"],
  inclusionai: ["inclusionai"],
  "rekaai": ["reka"],
};

function candidates(slug) {
  const clean = slug.replace(/^~/, "");
  const base = [clean, clean.replace(/-/g, ""), clean.replace(/-/g, "_")];
  return [...(OVERRIDES[clean] ?? []), ...base];
}

async function resolve(slug) {
  for (const c of candidates(slug)) {
    try {
      const res = await fetch(`https://cdn.simpleicons.org/${c}`);
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("svg")) return c;
      }
    } catch {
      // ignora e tenta o próximo candidato
    }
  }
  return null;
}

for (const p of providers.sort()) {
  const hit = await resolve(p);
  console.log(`${hit ? "OK  " : "MISS"} ${p}${hit ? ` -> ${hit}` : ""}`);
}
