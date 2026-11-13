/**
 * Curador de descrições do catálogo (v16).
 *
 * Gera `src/data/descricoes-modelos.json` a partir de um dump do
 * snapshot (rota temporária /api/debug-dump). Regras:
 *  - só factos reais do registo (família, papel, capacidades,
 *    contexto, preço, licença, existência de métricas);
 *  - nunca valores de benchmark em prosa (ficam obsoletos com o
 *    overlay ao vivo) — a UI já os mostra numericamente;
 *  - ~2 frases: completa, detalhada, levemente curta.
 *
 * Uso: node scripts/curar-descricoes.mjs <dump.json>
 */
import fs from "node:fs";

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error("uso: node scripts/curar-descricoes.mjs <dump.json>");
  process.exit(1);
}
const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

/* ============================================================
   TIER A — topo do catálogo (modelos medidos, mais procurados).
   Escritas à mão; factos do registo (ctx/preço/caps/medição).
   ============================================================ */
const TIER_A = {
  "anthropic/claude-opus-5.5":
    "Flagship da Anthropic para raciocínio complexo, programação avançada e análise de documentos longos, com leitura de imagens, ferramentas e saída estruturada. Lidera o índice de Inteligência da Artificial Analysis e carrega 1M de tokens de contexto.",
  "anthropic/claude-sonnet-5.5":
    "Equilíbrio entre inteligência e velocidade dentro da família Claude. Vocacionado para uso diário, programação e resumos, com 1M de contexto e preço moderado.",
  "anthropic/claude-fable-5.1":
    "Variante da família Claude virada para programação e trabalho com agentes, com índices AA fortes em codificação. Janela de 1M tokens, multimodal, a um custo mais elevado.",
  "openai/gpt-6-astra":
    "Modelo multimodal de topo da OpenAI: lê imagens, usa ferramentas, devolve JSON estruturado e raciocina em cadeia. Janela de 1.05M tokens e medições em várias arenas LMArena.",
  "openai/gpt-6.1-sol":
    "Variante eficiente da família GPT-6.1, com boa relação qualidade/preço. Lê imagens, corre ferramentas e tem 1.05M de contexto.",
  "anthropic/claude-opus-5":
    "Geração anterior do flagship Opus, ainda muito forte em raciocínio profundo e código. Contexto de 1M tokens, multimodal, a preço de flagship.",
  "anthropic/claude-fable-5":
    "Variante de codificação da família Claude, com bons índices AA em código e agentes. Janela de 1M tokens e preço premium.",
  "meta/muse-spark-1.3":
    "Modelo de topo da família Muse da Meta: rápido, multimodal e com contexto de 1M tokens. Preço contido para a gama de desempenho que oferece.",
  "openai/gpt-6-sol":
    "Variante de geração média da família GPT-6, com foco em produtividade e custo acessível. Multimodal, com 1.05M de contexto.",
  "openai/gpt-5.6-sol":
    "Geração intermediária da família GPT-5.6, com boa relação qualidade/preço. Lê imagens, usa ferramentas e tem 1.05M de contexto.",
  "x-ai/grok-4.7":
    "Modelo de topo da xAI, multimodal e com raciocínio em cadeia. Contexto de 500k tokens e preço moderado, medido em LMArena.",
  "xiaomi/mimo-v2.6-pro":
    "Flagship da família MiMo da Xiaomi: contexto de 1M tokens e preço muito abaixo da concorrência directa. Multimodal, com ferramentas e raciocínio.",
  "qwen/qwen3.8-max-0902":
    "Modelo de topo da família Qwen da Alibaba, forte em raciocínio, código e agentes. Contexto de 1M tokens, multimodal, a preço moderado.",
  "z-ai/glm-5.3":
    "Modelo de topo da família GLM da Zhipu, especializado em programação e agentes. Contexto longo (1.3M tokens) e preço contido; escrito para tarefas técnicas.",
  "x-ai/grok-4.6":
    "Variante recente da família Grok, multimodal e com raciocínio. Contexto de 500k tokens, velocidade de resposta acima da média.",
  "moonshotai/kimi-k3":
    "Topo da família Kimi da Moonshot: contexto de 1M tokens, multimodal e com bons índices AA em código. Preço moderado para a gama.",
  "openai/gpt-5.6-terra":
    "Variante da família GPT-5.6 virada para agentes e programação. Lê imagens, usa ferramentas e tem 1.05M de contexto.",
  "z-ai/glm-5.3-flash":
    "Variante rápida e barata do GLM 5.3, mantendo programação e agentes como pontos fortes. Contexto de 1.3M tokens e preço muito baixo.",
  "anthropic/claude-opus-4.8":
    "Geração anterior do Opus, ainda muito competitiva em raciocínio e código. Contexto de 1M tokens, multimodal, a preço de flagship.",
  "google/gemini-3.8-flash":
    "Variante rápida da família Gemini do Google, com janela enorme (~1M tokens) e preço baixo. Multimodal e com raciocínio em cadeia.",
  "anthropic/claude-opus-4.7":
    "Geração anterior do Opus com 1M de contexto e multimodal. Desempenho forte em texto e código, a preço de flagship.",
  "qwen/qwen3.8-2.4t-a95b":
    "Modelo very-large da família Qwen (2.4T de parâmetros, 95B activos) focado em raciocínio, código e agentes. Contexto de 1M tokens; sem leitura de imagens.",
  "meta/muse-spark-1.2":
    "Geração anterior da família Muse da Meta, multimodal e com 1M de contexto. Preço contido e boa relação qualidade/preço.",
  "deepseek/deepseek-v4.1-flash":
    "Variante rápida e barata do DeepSeek V4, com contexto de 1M tokens e leitura de imagens. Otimizada para volume e latência baixa.",
  "google/gemini-3.7-flash":
    "Variante rápida da família Gemini, multimodal, com ~1M de contexto e preço baixo. Medido em LMArena em texto, código, imagem e matemática.",
  "openai/gpt-5.4":
    "Geração anterior da família GPT-5, multimodal e com 1.05M de contexto. Preço moderado, já ultrapassada pelas gerações 5.6/6.",
  "x-ai/grok-4.5":
    "Variante da família Grok, multimodal, com 500k de contexto e preço moderado. Foco em raciocínio e velocidade.",
  "openai/gpt-5.5":
    "Geração anterior do topo GPT-5, multimodal e com 1.05M de contexto. Preço elevado em relação às variantes Sol/Luna.",
  "anthropic/claude-sonnet-5":
    "Geração anterior do Sonnet, com 1M de contexto e multimodal. Equilíbrio entre capacidade e custo dentro da família Claude.",
  "xiaomi/mimo-v2.6-flash":
    "Variante rápida do MiMo, com 1M de contexto, leitura de imagens e preço muito baixo. Vocacionada para volume elevado.",
  "openai/gpt-5.6-luna":
    "Variante económica da família GPT-5.6: multimodal, com ferramentas e 1.05M de contexto. Preço de entrada muito baixo.",
  "openai/gpt-6-luna":
    "Variante económica da família GPT-6, multimodal e com 1.05M de contexto. Um dos preços mais baixos da gama OpenAI.",
  "deepseek/deepseek-v4-pro":
    "Variante profissional do DeepSeek V4, focada em raciocínio e programação com preço contido. Contexto de 1M tokens; escrita para agentes.",
  "deepseek/deepseek-v4-pro-0813":
    "Actualização de Agosto do V4 Pro, com o mesmo foco em raciocínio e código a preço ainda mais baixo. Contexto de 1M tokens.",
  "deepseek/deepseek-v4-flash":
    "Variante rápida do DeepSeek V4, com preço muito baixo e contexto de 1M tokens. Vocacionada para volume e custo.",
  "deepseek/deepseek-v4-flash-0731":
    "Actualização do V4 Flash com contexto alongado (1.3M tokens) e preço mínimo. Para volume elevado e tarefas curtas.",
  "google/gemini-3.6-flash":
    "Variante rápida da família Gemini, multimodal, com ~1M de contexto. Medido em LMArena em texto, código e matemática.",
  "meta/muse-spark-1.1":
    "Primeira geração medida da família Muse da Meta, multimodal e com 1M de contexto. Boa base para tarefas gerais.",
  "z-ai/glm-5.2":
    "Geração anterior do GLM, focada em programação e agentes com preço muito baixo. Contexto de 1M tokens.",
  "qwen/qwen3.8-27b":
    "Modelo médio da família Qwen3.8 (27B), multimodal, com 1M de contexto e preço mínimo. Open-weight e corre ferramentas.",
  "google/gemini-3.5-flash":
    "Variante rápida da família Gemini, multimodal, com ~1M de contexto. Família consolidada e bem medida em LMArena.",
  "openai/gpt-5.3-codex":
    "Variante Codex da família GPT-5.3, vocacionada para programação assistida por agentes. Contexto de 400k tokens e preço moderado.",
  "openai/gpt-5.2":
    "Geração anterior do GPT-5, multimodal, com 400k de contexto e matemática muito forte (índice AA de topo).",
  "google/gemini-3.1-pro-preview":
    "Pré-lançamento Pro da família Gemini 3.1: multimodal, ~1M de contexto, com foco em agentes e velocidade de resposta.",
  "qwen/qwen3.7-max":
    "Topo da família Qwen3.7, focado em programação e agentes. Contexto de 1M tokens, sem leitura de imagens, a preço moderado.",
  "minimax/minimax-m3":
    "Modelo da família MiniMax, multimodal, rápido e barato. Contexto de 1M tokens e boa relação qualidade/preço.",
  "openai/gpt-5.2-codex":
    "Variante Codex do GPT-5.2 para trabalho de programação com agentes. Contexto de 400k tokens e preço moderado.",
  "upstage/solar-pro4":
    "Modelo profissional da família Solar da Upstage, compacto e rápido, com contexto de 512k tokens e preço muito baixo.",
  "z-ai/glm-5":
    "Geração base do GLM 5, focada em programação e agentes. Contexto de 200k tokens e preço contido.",
  "thinkingmachines/inkling-small":
    "Modelo eficiente da Thinking Machines, multimodal e muito rápido. Contexto de 512k tokens e preço baixo.",
  "moonshotai/kimi-k2.6":
    "Geração anterior do Kimi, multimodal e com 262k de contexto. Foco em programação e agentes a preço moderado.",
  "qwen/qwen3.6-plus":
    "Variante Plus da família Qwen3.6: multimodal, com 1M de contexto e preço baixo. Bom compromisso geral.",
  "z-ai/glm-5-turbo":
    "Variante turbo do GLM 5, focada em velocidade de resposta com programação e agentes. Contexto de ~200k tokens.",
  "anthropic/claude-opus-4.6":
    "Geração anterior do Opus, multimodal e com 1M de contexto. Mantém desempenho de topo em texto e código.",
  "z-ai/glm-5.1":
    "Actualização do GLM 5 com programação e agentes como eixos. Contexto de 200k tokens e preço moderado.",
  "xiaomi/mimo-v2.5-pro":
    "Variante profissional do MiMo V2.5 com 1M de contexto e preço muito baixo. Escrita para programação e agentes.",
  "moonshotai/kimi-k2.7-code":
    "Variante de código da família Kimi K2.7, multimodal e rápida. Contexto de 262k tokens a preço baixo.",
  "x-ai/grok-4.20":
    "Variante da família Grok com contexto muito longo (2M tokens) e preço contido. Multimodal e com raciocínio.",
  "tencent/hy3":
    "Modelo da Tencent focado em programação e agentes, rápido e muito barato. Contexto de 262k tokens.",
  "qwen/qwen3.7-plus":
    "Variante Plus do Qwen3.7: multimodal, com 1M de contexto e preço baixo. Bom para uso geral e programação.",
};

/* ============================================================
   TIER B — composição a partir de factos reais do registo.
   ============================================================ */

const FAMILIA = [
  [/^anthropic\//, "Família Claude da Anthropic"],
  [/^openai\/gpt|^openai\/chatgpt/, "Família GPT da OpenAI"],
  [/^openai\/o\d/, "Série de raciocínio da OpenAI (família o)"],
  [/^openai\//, "Catálogo da OpenAI"],
  [/^google\/gemini|^google\/gemma|^google\/lyria|^google\/imagen|^google\/veo/, "Família Google (Gemini/Gemma)"],
  [/^meta-llama\//, "Família Llama da Meta"],
  [/^meta\/muse/, "Família Muse da Meta"],
  [/^meta\//, "Catálogo da Meta"],
  [/^x-ai\//, "Família Grok da xAI"],
  [/^qwen\//, "Família Qwen da Alibaba"],
  [/^deepseek\//, "Família DeepSeek"],
  [/^moonshotai\//, "Família Kimi da Moonshot"],
  [/^z-ai\//, "Família GLM da Zhipu"],
  [/^mistralai\/|^mixtral/, "Família Mistral AI"],
  [/^minimax\//, "Família MiniMax"],
  [/^xiaomi\//, "Família MiMo da Xiaomi"],
  [/^tencent\//, "Família Tencent (Hunyuan/Hy)"],
  [/^bytedance/, "Família ByteDance (Seed/UI-TARS)"],
  [/^nvidia\//, "Família NVIDIA Nemotron"],
  [/^amazon\//, "Família Amazon Nova"],
  [/^cohere\//, "Família Cohere Command"],
  [/^perplexity\//, "Família Perplexity Sonar"],
  [/^ibm-granite\//, "Família IBM Granite"],
  [/^microsoft\//, "Catálogo da Microsoft"],
  [/^upstage\//, "Família Solar da Upstage"],
  [/^arcee-ai\//, "Família Arcee AI"],
  [/^inclusionai\//, "Família InclusionAI Ling"],
  [/^stepfun\//, "Família StepFun"],
  [/^inception\//, "Família Inception Mercury"],
  [/^sakana\//, "Família Sakana AI"],
  [/^nousresearch\//, "Família Nous Research Hermes"],
  [/^baidu\//, "Família Baidu ERNIE"],
  [/^rekaai\//, "Família Reka"],
  [/^mancer\//, "Catálogo Mancer"],
  [/^writer\//, "Família Writer Palmyra"],
];

function familiaDe(m) {
  for (const [re, rotulo] of FAMILIA) if (re.test(m.id)) return rotulo;
  return `Catálogo ${m.empresa}`;
}

/** Papel/modelo a partir do nome — palavras reais do registo. */
function papelDe(m) {
  if (m.variante === "batch")
    return "variante em lote — endpoint assíncrono do mesmo modelo, normalmente mais barato";
  if (m.variante === "free")
    return "variante de preço zero do mesmo modelo";
  if (m.variante === "alias")
    return "atalho permanente para o modelo mais recente da família";
  const n = m.nome.toLowerCase();
  if (/nano banana/.test(n))
    return "modelo de geração e edição de imagens (Nano Banana do Google)";
  if (m.sai.includes("image"))
    return "modelo de geração e edição de imagens";
  if (/guard|safety|moderation|moderator/.test(n))
    return "modelo de moderação de conteúdo";
  if (/coder|codex|codestral|devstral/.test(n))
    return "variante especializada em programação";
  if (/thinking/.test(n))
    return "variante otimizada para raciocínio em cadeia";
  if (/multi-agent/.test(n)) return "variante multi-agente";
  if (/\bvl\b|vision/.test(n)) return "variante multimodal com leitura de imagens";
  if (/omni/.test(n)) return "variante omni (texto, imagem e áudio)";
  if (/audio|voxtral|sonar|whisper|tts|speech/.test(n))
    return "variante de voz e áudio";
  if (/pro\b|ultra|max\b|large|premier/.test(n)) return "modelo de topo da gama";
  if (/flash|turbo|lightning|\bmini\b|nano|lite|air|small|fast|ultraspeed/.test(n))
    return "variante rápida e leve";
  if (/preview|exp|beta|alpha|latest/.test(n))
    return "pré-lançamento experimental";
  if (/contributor/.test(n)) return "variante contributor";
  return "modelo de uso geral";
}

/** Contexto em palavras (só do valor real). */
function ctxDe(m) {
  const c = m.ctx;
  if (c >= 2_000_000) return "janela de 2M tokens";
  if (c >= 1_310_720) return "janela de 1.3M tokens";
  if (c >= 1_000_000) return "janela de 1M tokens";
  if (c >= 512_000) return "janela de ~512k tokens";
  return `janela de ~${Math.round(c / 1024)}k tokens`;
}

/** Faixa de preço (só dos valores reais de entrada/saída). */
function precoDe(m) {
  const { pe, ps } = m;
  if (pe === 0 && ps === 0) return "gratuito";
  if (pe < 0.5) return "preço muito baixo";
  if (pe < 3) return "preço acessível";
  if (pe < 15) return "preço moderado";
  if (pe < 60) return "preço elevado";
  return "preço premium";
}

/** Capacidades nativas (só as reais do registo). */
function capsDe(m) {
  const caps = [];
  if (m.ent.includes("image")) caps.push("lê imagens");
  if (m.ferr) caps.push("corre ferramentas");
  if (m.se) caps.push("devolve JSON estruturado");
  if (m.rac) caps.push("raciocína em cadeia");
  return caps;
}

function licencaDe(m) {
  if (m.lic && m.lic !== "other")
    return `open-weight (licença ${m.lic.toUpperCase()})`;
  if (m.hf) return "open-weight no Hugging Face";
  return "";
}

function medicaoDe(m) {
  return m.fonte === "estimativa"
    ? "ainda sem métricas públicas no catálogo"
    : "com métricas públicas já medidas no catálogo (AA/LMArena)";
}

/** Junta itens com vírgulas e "e" antes do último. */
function listaPt(itens) {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Compõe a descrição da cauda longa: família + papel + factos reais. */
function compor(m) {
  const f1 = `${familiaDe(m)} — ${papelDe(m)}.`;
  const caps = capsDe(m);
  const lic = licencaDe(m);
  const factos = [ctxDe(m), precoDe(m)];
  if (caps.length > 0) factos.push(caps.join(", "));
  if (lic) factos.push(lic);
  const f2 = `${listaPt(factos)}; ${medicaoDe(m)}.`;
  // Segunda frase começa em maiúscula.
  return `${f1} ${f2.charAt(0).toUpperCase()}${f2.slice(1)}`;
}

/* ============================================================
   GERA O JSON
   ============================================================ */
const saida = {};
let tierA = 0;
let tierB = 0;
for (const m of dump) {
  if (TIER_A[m.id]) {
    saida[m.id] = { descricao: TIER_A[m.id] };
    tierA++;
  } else {
    saida[m.id] = { descricao: compor(m) };
    tierB++;
  }
}

// Sanidade: sem campos vazios.
for (const [id, v] of Object.entries(saida)) {
  if (!v.descricao || v.descricao.length < 40) {
    console.error(`demasiado curta: ${id}`);
    process.exit(1);
  }
}

const destino = "src/data/descricoes-modelos.json";
fs.writeFileSync(destino, `${JSON.stringify(saida, null, 2)}\n`, "utf8");
console.log(`escrito: ${destino}`);
console.log(`total: ${Object.keys(saida).length} (manuais: ${tierA}, compostas: ${tierB})`);
