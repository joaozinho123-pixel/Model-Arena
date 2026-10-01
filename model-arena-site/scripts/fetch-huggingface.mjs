/**
 * Enriquece o catálogo com estatísticas públicas do Hugging Face
 * (downloads, likes, licença) para modelos open-weight.
 * Grava `src/data/hf-stats.json` indexado por id OpenRouter.
 *
 * Uso: `npm run hf:fetch` — sem chave, com cortesia entre pedidos.
 * Pares curados + fallback automático provider/sufixo para
 * fornecedores comunitários (mesmo slug, ex.: undi95/*).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogFile = join(rootDir, "src", "data", "openrouter-models.json");
const outFile = join(rootDir, "src", "data", "hf-stats.json");

// Pares curados openrouterId -> repo Hugging Face (só tenta se existir no catálogo).
const CURADOS = [
  ["meta-llama/llama-3.3-70b-instruct", "meta-llama/Llama-3.3-70B-Instruct"],
  ["meta-llama/llama-4-maverick", "meta-llama/Llama-4-Maverick-17B-128E-Instruct"],
  ["openai/gpt-oss-120b", "openai/gpt-oss-120b"],
  ["qwen/qwen3-235b-a22b-2507", "Qwen/Qwen3-235B-A22B-Instruct-2507"],
  ["qwen/qwen3-235b-a22b", "Qwen/Qwen3-235B-A22B"],
  ["qwen/qwen3-max", "Qwen/Qwen3-Max"],
  ["deepseek/deepseek-r1", "deepseek-ai/DeepSeek-R1"],
  ["deepseek/deepseek-v3.2", "deepseek-ai/DeepSeek-V3.2"],
  ["mistralai/mistral-large", "mistralai/Mistral-Large-Instruct-2407"],
  ["microsoft/phi-4", "microsoft/phi-4"],
  ["z-ai/glm-4.6", "zai-org/GLM-4.6"],
  ["z-ai/glm-4.5", "zai-org/GLM-4.5"],
  ["moonshotai/kimi-k2.5", "moonshotai/Kimi-K2.5"],
  ["moonshotai/kimi-k2", "moonshotai/Kimi-K2-Instruct"],
  ["minimax/minimax-m2", "MiniMaxAI/MiniMax-M2"],
  ["minimax/minimax-m2.5", "MiniMaxAI/MiniMax-M2.5"],
  ["nvidia/llama-3.1-nemotron-70b-instruct", "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"],
  ["cohere/command-r-plus-08-2024", "CohereLabs/c4ai-command-r-plus-08-2024"],
  ["cohere/command-r-08-2024", "CohereLabs/c4ai-command-r-08-2024"],
  ["cohere/command-r7b-12-2024", "CohereLabs/c4ai-command-r7b-12-2024"],
  ["cohere/command-a", "CohereLabs/c4ai-command-a-03-2025"],
  ["xiaomi/mimo-v2.5-pro", "XiaomiMiMo/MiMo-V2.5-Pro"],
  ["deepseek/deepseek-r1-0528", "deepseek-ai/DeepSeek-R1-0528"],
  ["deepseek/deepseek-r1-distill-llama-70b", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"],
  ["meta-llama/llama-4-scout", "meta-llama/Llama-4-Scout-17B-16E-Instruct"],
  ["meta-llama/llama-3.1-70b-instruct", "meta-llama/Llama-3.1-70B-Instruct"],
  ["meta-llama/llama-3.1-8b-instruct", "meta-llama/Llama-3.1-8B-Instruct"],
  ["meta-llama/llama-3.2-1b-instruct", "meta-llama/Llama-3.2-1B-Instruct"],
  ["meta-llama/llama-3.2-3b-instruct", "meta-llama/Llama-3.2-3B-Instruct"],
  ["qwen/qwen3-32b", "Qwen/Qwen3-32B"],
  ["qwen/qwen3-30b-a3b", "Qwen/Qwen3-30B-A3B"],
  ["qwen/qwen3-235b-a22b-thinking-2507", "Qwen/Qwen3-235B-A22B-Thinking-2507"],
  ["moonshotai/kimi-k2-thinking", "moonshotai/Kimi-K2-Thinking"],
  ["z-ai/glm-4.5-air", "zai-org/GLM-4.5-Air"],
];

// Provedores comunitários: tenta provider/sufixo igual ao id OpenRouter.
const COMUNITARIOS = new Set([
  "sao10k",
  "undi95",
  "thedrummer",
  "gryphe",
  "cognitivecomputations",
  "mancer",
  "nousresearch",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRepo(repo) {
  const res = await fetch(`https://huggingface.co/api/models/${repo}`, {
    headers: { "User-Agent": "model-arena/1.0" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${repo}: HTTP ${res.status}`);
  const j = await res.json();
  const tags = Array.isArray(j.tags) ? j.tags : [];
  const license =
    j.cardData?.license ??
    tags.find((t) => t.startsWith("license:"))?.replace("license:", "") ??
    null;
  return {
    hf: j.id ?? repo,
    downloads: typeof j.downloads === "number" ? j.downloads : null,
    likes: typeof j.likes === "number" ? j.likes : null,
    license,
  };
}

const catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
const ids = new Set(
  catalog.models
    .filter((m) => !m.id.startsWith("~") && !m.id.includes(":"))
    .map((m) => m.id),
);

const pares = CURADOS.filter(([id]) => ids.has(id));
for (const m of catalog.models) {
  if (!ids.has(m.id)) continue;
  const [provider, ...rest] = m.id.split("/");
  if (COMUNITARIOS.has(provider)) {
    pares.push([m.id, `${provider}/${rest.join("/")}`]);
  }
}
console.log(`A consultar ${pares.length} repos no Hugging Face…`);

const stats = {};
let ok = 0;
for (const [id, repo] of pares) {
  try {
    const s = await fetchRepo(repo);
    if (s && (s.downloads != null || s.likes != null)) {
      stats[id] = s;
      ok++;
    }
  } catch (e) {
    console.log(`  falha ${repo}: ${e.message}`);
  }
  await sleep(400); // cortesia
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify({ generatedAt: new Date().toISOString(), stats }),
);
console.log(`OK: ${ok} modelos com stats HF em ${outFile}`);
